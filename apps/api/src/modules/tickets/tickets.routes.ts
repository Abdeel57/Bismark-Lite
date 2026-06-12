import type { FastifyInstance } from 'fastify';
import { reserveTicketsSchema, reserveManualSchema, TicketStatus } from '@bismark/shared';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../lib/http.js';
import { badRequest, conflict, notFound, forbidden } from '../../lib/errors.js';
import { requireRifero } from '../../middlewares/auth.js';
import { loadOwnedRaffle } from '../../lib/ownership.js';
import { getPlanContext } from '../../lib/plan.js';
import { newOrderCode } from '../../lib/codes.js';
import { toBuyerDTO, riferoPaymentMethods } from '../../lib/serializers.js';
import { logActivity } from '../../lib/activity.js';
import { sendNewOrderEmail } from '../../lib/mailer.js';
import { sendPushToUser } from '../../lib/push.js';
import { env } from '../../config/env.js';

export default async function ticketsRoutes(app: FastifyInstance): Promise<void> {
  // GET /raffles/:id/tickets — vista completa para el rifero dueño (incluye comprador)
  app.get('/raffles/:id/tickets', { preHandler: requireRifero }, async (request) => {
    const { id } = request.params as { id: string };
    await loadOwnedRaffle(id, request.auth!);
    const tickets = await prisma.ticketNumber.findMany({
      where: { raffleId: id },
      orderBy: { number: 'asc' },
      include: { buyer: true },
    });
    return {
      items: tickets.map((t) => ({
        id: t.id,
        number: t.number,
        displayNumber: t.displayNumber,
        status: t.status,
        reservedUntil: t.reservedUntil?.toISOString() ?? null,
        paidAt: t.paidAt?.toISOString() ?? null,
        orderId: t.orderId,
        buyer: t.buyer ? toBuyerDTO(t.buyer) : null,
      })),
    };
  });

  // POST /public/raffles/:id/reserve — apartar boletos (comprador sin cuenta)
  app.post(
    '/public/raffles/:id/reserve',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = validate(reserveTicketsSchema, request.body);

      const raffle = await prisma.raffle.findUnique({ where: { id } });
      if (!raffle) throw notFound('Rifa no encontrada');
      if (raffle.status !== 'PUBLISHED') throw forbidden('Esta rifa no está disponible para apartar');

      const ctx = await getPlanContext(raffle.riferoId);
      if (!ctx.hasActivePlan) throw forbidden('Esta rifa no está disponible en este momento');

      const numbers = [...new Set(data.ticketNumbers)];
      if (numbers.some((n) => n < raffle.ticketStart || n > raffle.ticketEnd)) {
        throw badRequest('Algunos boletos están fuera del rango de la rifa');
      }
      if (raffle.maxTicketsPerOrder && numbers.length > raffle.maxTicketsPerOrder) {
        throw badRequest(`Máximo ${raffle.maxTicketsPerOrder} boletos por orden`);
      }

      const expiresAt = new Date(Date.now() + raffle.reserveMinutes * 60_000);
      const totalAmount = numbers.length * raffle.ticketPrice;

      const result = await prisma.$transaction(async (tx) => {
        // Bloqueo optimista: sólo cambian los que están AVAILABLE.
        const updated = await tx.ticketNumber.updateMany({
          where: { raffleId: id, number: { in: numbers }, status: 'AVAILABLE' },
          data: { status: 'RESERVED', reservedUntil: expiresAt },
        });
        if (updated.count !== numbers.length) {
          throw conflict('Algunos boletos ya no están disponibles. Actualiza y vuelve a intentar.');
        }

        const buyer = await tx.buyer.create({
          data: {
            fullName: data.buyer.fullName,
            phone: data.buyer.phone,
            whatsapp: data.buyer.whatsapp || data.buyer.phone,
            state: data.buyer.state || null,
          },
        });

        const order = await tx.order.create({
          data: {
            code: newOrderCode(),
            raffleId: id,
            buyerId: buyer.id,
            totalAmount,
            status: 'RESERVED',
            expiresAt,
          },
        });

        const ticketRows = await tx.ticketNumber.findMany({
          where: { raffleId: id, number: { in: numbers } },
          select: { id: true, displayNumber: true },
          orderBy: { number: 'asc' },
        });

        await tx.ticketNumber.updateMany({
          where: { id: { in: ticketRows.map((t) => t.id) } },
          data: { orderId: order.id, buyerId: buyer.id },
        });

        await tx.orderTicket.createMany({
          data: ticketRows.map((t) => ({ orderId: order.id, ticketId: t.id })),
        });

        // NO se crea el boleto digital aquí: se genera solo cuando el organizador
        // confirma el pago (en PATCH /orders/:id/mark-paid).
        return { order, buyer, displayNumbers: ticketRows.map((t) => t.displayNumber) };
      });

      await logActivity({ type: 'ORDER', action: 'reserve', meta: { orderId: result.order.id }, ip: request.ip });

      const profile = await prisma.riferoProfile.findUniqueOrThrow({
        where: { id: raffle.riferoId },
        include: { user: { select: { email: true, name: true } } },
      });

      // Aviso al rifero de la nueva orden. No bloquea la respuesta (sin await) y
      // sendEmail nunca lanza: un fallo de correo no debe romper el apartado.
      void sendNewOrderEmail({
        to: profile.user.email,
        riferoName: profile.user.name,
        buyerName: result.buyer.fullName,
        raffleTitle: raffle.title,
        eventLabel: `E${raffle.eventNumber}`,
        ticketCount: result.displayNumbers.length,
        totalAmount,
        orderCode: result.order.code,
        panelUrl: `${env.publicWebUrl}/panel/admin/ordenes`,
      });

      // Push al rifero (solo organizadores). Best-effort, sin await.
      void sendPushToUser(profile.userId, {
        title: 'Nueva orden 🎟️',
        body: `${result.buyer.fullName} apartó ${result.displayNumbers.length} boleto(s) · $${totalAmount.toLocaleString('es-MX')}`,
        url: `${env.publicWebUrl}/panel/admin/ordenes`,
      });

      return reply.code(201).send({
        receipt: {
          code: result.order.code,
          raffleTitle: raffle.title,
          eventLabel: `E${raffle.eventNumber}`,
          ticketNumbers: result.displayNumbers,
          totalAmount,
          status: result.order.status,
          expiresAt: result.order.expiresAt?.toISOString() ?? null,
          digitalTicketCode: null, // aún no existe; se genera al confirmar el pago
          riferoPublicName: profile.publicName,
          riferoWhatsapp: profile.payWhatsapp || profile.whatsapp,
          paymentProfile: {
            holderName: profile.payHolderName,
            bank: profile.payBank,
            clabe: profile.payClabe,
            cardNumber: profile.payCardNumber,
            concept: profile.payConcept,
            instructions: profile.payInstructions || raffle.paymentInstructions,
            whatsapp: profile.payWhatsapp || profile.whatsapp,
            methods: riferoPaymentMethods(profile),
          },
        },
      });
    },
  );

  // POST /tickets/reserve-manual — el rifero reserva boletos manualmente
  app.post('/tickets/reserve-manual', { preHandler: requireRifero }, async (request) => {
    const body = request.body as { raffleId?: string };
    const raffleId = body.raffleId;
    if (!raffleId) throw badRequest('raffleId requerido');
    const raffle = await loadOwnedRaffle(raffleId, request.auth!);
    const data = validate(reserveManualSchema, request.body);

    const numbers = [...new Set(data.ticketNumbers)];
    const updated = await prisma.ticketNumber.updateMany({
      where: { raffleId: raffle.id, number: { in: numbers }, status: 'AVAILABLE' },
      data: { status: 'RIFERO_RESERVED' },
    });
    if (updated.count !== numbers.length) {
      throw conflict('Algunos boletos no estaban disponibles para reservar');
    }
    await logActivity({ userId: request.auth!.userId, type: 'TICKET', action: 'reserve_manual', meta: { raffleId, count: numbers.length } });
    return { reserved: updated.count };
  });

  // PATCH /tickets/:id/status — cambiar estado de un boleto (rifero dueño)
  app.patch('/tickets/:id/status', { preHandler: requireRifero }, async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status?: string };
    const allowed: TicketStatus[] = ['AVAILABLE', 'RIFERO_RESERVED', 'CANCELLED'];
    if (!status || !allowed.includes(status as TicketStatus)) {
      throw badRequest('Estado no permitido. Usa AVAILABLE, RIFERO_RESERVED o CANCELLED.');
    }
    const ticket = await prisma.ticketNumber.findUnique({ where: { id }, include: { raffle: true } });
    if (!ticket) throw notFound('Boleto no encontrado');
    if (request.auth!.role !== 'SUPER_ADMIN' && ticket.raffle.riferoId !== request.auth!.riferoId) {
      throw forbidden('Este boleto no te pertenece');
    }
    if (ticket.status === 'PAID' || ticket.status === 'WINNER') {
      throw conflict('No puedes cambiar el estado de un boleto pagado o ganador');
    }
    await prisma.ticketNumber.update({
      where: { id },
      data: { status: status as TicketStatus, orderId: null, buyerId: null, reservedUntil: null },
    });
    return { ok: true };
  });
}
