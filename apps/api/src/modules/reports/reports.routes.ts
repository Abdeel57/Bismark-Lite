import type { FastifyInstance, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { badRequest } from '../../lib/errors.js';
import { requireRifero } from '../../middlewares/auth.js';
import { loadOwnedRaffle } from '../../lib/ownership.js';
import { assertFeature } from '../../lib/plan.js';
import { buildExcel, buildPdfTable, type ReportColumn, type ReportRow } from '../../lib/reports.js';
import { ORDER_STATUS_LABELS, TICKET_STATUS_LABELS, formatDateTimeMX } from '@bismark/shared';

type Format = 'excel' | 'pdf';

function getFormat(request: { query: unknown }): Format {
  const f = (request.query as { format?: string }).format;
  return f === 'pdf' ? 'pdf' : 'excel';
}

async function deliver(
  reply: FastifyReply,
  format: Format,
  filename: string,
  title: string,
  subtitle: string,
  columns: ReportColumn[],
  rows: ReportRow[],
): Promise<FastifyReply> {
  if (format === 'excel') {
    const buf = await buildExcel(title, columns, rows);
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${filename}.xlsx"`)
      .send(buf);
  }
  const buf = await buildPdfTable(title, subtitle, columns, rows);
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `attachment; filename="${filename}.pdf"`)
    .send(buf);
}

export default async function reportsRoutes(app: FastifyInstance): Promise<void> {
  // GET /reports/raffles/:id/orders?format=excel|pdf
  app.get('/reports/raffles/:id/orders', { preHandler: requireRifero }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const raffle = await loadOwnedRaffle(id, request.auth!);
    const format = getFormat(request);
    await assertFeature(raffle.riferoId, format === 'pdf' ? 'allowReportsPdf' : 'allowReportsExcel');

    const orders = await prisma.order.findMany({
      where: { raffleId: id },
      orderBy: { createdAt: 'desc' },
      include: { buyer: true, tickets: { orderBy: { number: 'asc' } } },
    });

    const columns: ReportColumn[] = [
      { header: 'Folio', key: 'code', width: 14 },
      { header: 'Comprador', key: 'buyer', width: 24 },
      { header: 'Teléfono', key: 'phone', width: 16 },
      { header: 'Estado', key: 'status', width: 14 },
      { header: 'Boletos', key: 'tickets', width: 30 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Fecha', key: 'date', width: 20 },
    ];
    const rows: ReportRow[] = orders.map((o) => ({
      code: o.code,
      buyer: o.buyer.fullName,
      phone: o.buyer.phone,
      status: ORDER_STATUS_LABELS[o.status] ?? o.status,
      tickets: o.tickets.map((t) => t.displayNumber).join(', '),
      total: o.totalAmount,
      date: formatDateTimeMX(o.createdAt),
    }));

    return deliver(reply, format, `ordenes-${raffle.eventNumber}`, `Órdenes · ${raffle.title}`, `E${raffle.eventNumber}`, columns, rows);
  });

  // GET /reports/raffles/:id/tickets?format=excel|pdf
  app.get('/reports/raffles/:id/tickets', { preHandler: requireRifero }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const raffle = await loadOwnedRaffle(id, request.auth!);
    const format = getFormat(request);
    await assertFeature(raffle.riferoId, format === 'pdf' ? 'allowReportsPdf' : 'allowReportsExcel');

    const tickets = await prisma.ticketNumber.findMany({
      where: { raffleId: id },
      orderBy: { number: 'asc' },
      include: { buyer: true, order: true },
    });

    const columns: ReportColumn[] = [
      { header: 'Boleto', key: 'num', width: 12 },
      { header: 'Estado', key: 'status', width: 16 },
      { header: 'Comprador', key: 'buyer', width: 24 },
      { header: 'Teléfono', key: 'phone', width: 16 },
      { header: 'Folio', key: 'code', width: 14 },
    ];
    const rows: ReportRow[] = tickets.map((t) => ({
      num: t.displayNumber,
      status: TICKET_STATUS_LABELS[t.status] ?? t.status,
      buyer: t.buyer?.fullName ?? '',
      phone: t.buyer?.phone ?? '',
      code: t.order?.code ?? '',
    }));

    return deliver(reply, format, `boletos-${raffle.eventNumber}`, `Boletos · ${raffle.title}`, `E${raffle.eventNumber}`, columns, rows);
  });

  // GET /reports/raffles/:id/buyers?format=excel|pdf
  app.get('/reports/raffles/:id/buyers', { preHandler: requireRifero }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const raffle = await loadOwnedRaffle(id, request.auth!);
    const format = getFormat(request);
    await assertFeature(raffle.riferoId, format === 'pdf' ? 'allowReportsPdf' : 'allowReportsExcel');

    const orders = await prisma.order.findMany({
      where: { raffleId: id, status: { in: ['PAID', 'RESERVED', 'PENDING'] } },
      include: { buyer: true, tickets: true },
    });
    // Agrupar por comprador.
    const byBuyer = new Map<string, { name: string; phone: string; whatsapp: string; state: string; tickets: number; paid: number }>();
    for (const o of orders) {
      const k = o.buyer.id;
      const cur = byBuyer.get(k) ?? { name: o.buyer.fullName, phone: o.buyer.phone, whatsapp: o.buyer.whatsapp ?? '', state: o.buyer.state ?? '', tickets: 0, paid: 0 };
      cur.tickets += o.tickets.length;
      if (o.status === 'PAID') cur.paid += o.totalAmount;
      byBuyer.set(k, cur);
    }

    const columns: ReportColumn[] = [
      { header: 'Comprador', key: 'name', width: 24 },
      { header: 'Teléfono', key: 'phone', width: 16 },
      { header: 'WhatsApp', key: 'whatsapp', width: 16 },
      { header: 'Estado', key: 'state', width: 18 },
      { header: 'Boletos', key: 'tickets', width: 10 },
      { header: 'Pagado', key: 'paid', width: 12 },
    ];
    const rows: ReportRow[] = [...byBuyer.values()].map((b) => ({
      name: b.name,
      phone: b.phone,
      whatsapp: b.whatsapp,
      state: b.state,
      tickets: b.tickets,
      paid: b.paid,
    }));

    if (rows.length === 0) throw badRequest('No hay compradores para reportar todavía');
    return deliver(reply, format, `compradores-${raffle.eventNumber}`, `Compradores · ${raffle.title}`, `E${raffle.eventNumber}`, columns, rows);
  });
}
