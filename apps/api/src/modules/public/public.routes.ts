import type { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import { getPlanContext } from '../../lib/plan.js';
import { getRaffleStats, getPaidCounts } from '../../lib/stats.js';
import { env } from '../../config/env.js';
import {
  toPublicRiferoDTO,
  toPublicRaffleSummaryDTO,
  toRaffleDTO,
  toWinnerDTO,
} from '../../lib/serializers.js';

function parseEventNumber(raw: string): number {
  const cleaned = raw.replace(/^e/i, '');
  const n = Number(cleaned);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

// ── Helpers para vista previa de enlaces (Open Graph) ────────
// Convierte una URL de imagen (posiblemente relativa, p. ej. /uploads/..) en
// absoluta para que los crawlers de WhatsApp/Facebook puedan descargarla.
function absoluteImage(url: string | null | undefined, request: FastifyRequest): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const host = request.headers.host;
  if (!host) return null;
  return `${request.protocol}://${host}${url.startsWith('/') ? url : `/${url}`}`;
}

// URL pública canónica del rifero / la rifa (subdominio o ruta, según config).
function riferoWebUrl(slug: string): string {
  return env.useSubdomains
    ? `${env.publicUrlConfig.protocol}://${slug}.${env.rootDomain}`
    : `${env.publicWebUrl}/r/${slug}`;
}
function raffleWebUrl(slug: string, eventNumber: number): string {
  return env.useSubdomains
    ? `${riferoWebUrl(slug)}/e${eventNumber}`
    : `${env.publicWebUrl}/r/${slug}/e${eventNumber}`;
}

function moneyMxn(amount: number): string {
  return `$${amount.toLocaleString('es-MX')} MXN`;
}
function formatDrawDate(d: Date | null): string | null {
  if (!d) return null;
  try {
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return null;
  }
}

export default async function publicRoutes(app: FastifyInstance): Promise<void> {
  // GET /public/riferos/by-subdomain/:subdomain
  app.get('/public/riferos/by-subdomain/:subdomain', async (request) => {
    const { subdomain } = request.params as { subdomain: string };
    const profile = await prisma.riferoProfile.findFirst({
      where: { OR: [{ subdomain: subdomain.toLowerCase() }, { slug: subdomain.toLowerCase() }] },
    });
    if (!profile || profile.status === 'DELETED') throw notFound('Esta página no existe');

    const ctx = await getPlanContext(profile.id);
    if (!ctx.hasActivePlan || profile.status === 'SUSPENDED') {
      // La página pública sólo está disponible con plan activo.
      return { active: false, publicName: profile.publicName };
    }

    const raffles = await prisma.raffle.findMany({
      where: { riferoId: profile.id, status: { in: ['PUBLISHED', 'FINISHED'] } },
      orderBy: { eventNumber: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
    const paidCounts = await getPaidCounts(raffles.map((r) => r.id));
    const summaries = raffles.map((r) =>
      toPublicRaffleSummaryDTO(r, paidCounts.get(r.id) ?? 0, r.images[0]?.url ?? profile.coverUrl ?? null),
    );

    // Ganadores publicados (sin datos del comprador) para la sección del perfil.
    const winners = profile.showWinners
      ? (
          await prisma.winner.findMany({
            where: { published: true, raffle: { riferoId: profile.id, allowWinnerPublication: true } },
            orderBy: [{ createdAt: 'desc' }, { position: 'asc' }],
            include: {
              ticket: { select: { displayNumber: true } },
              raffle: { select: { title: true, eventNumber: true } },
            },
            take: 12,
          })
        ).map((w) => ({
          id: w.id,
          raffleTitle: w.raffle.title,
          eventLabel: `E${w.raffle.eventNumber}`,
          position: w.position,
          ticketDisplayNumber: w.ticket.displayNumber,
          prizeDescription: w.prizeDescription ?? null,
          evidenceUrl: w.evidenceUrl ?? null,
        }))
      : [];

    return { active: true, rifero: toPublicRiferoDTO(profile, summaries), winners };
  });

  // GET /public/raffles/by-event/:subdomain/:eventNumber
  app.get('/public/raffles/by-event/:subdomain/:eventNumber', async (request) => {
    const { subdomain, eventNumber } = request.params as { subdomain: string; eventNumber: string };
    const n = parseEventNumber(eventNumber);
    if (Number.isNaN(n)) throw notFound('Evento no encontrado');

    const profile = await prisma.riferoProfile.findFirst({
      where: { OR: [{ subdomain: subdomain.toLowerCase() }, { slug: subdomain.toLowerCase() }] },
    });
    if (!profile) throw notFound('Esta página no existe');

    const ctx = await getPlanContext(profile.id);
    if (!ctx.hasActivePlan || profile.status === 'SUSPENDED') {
      return { active: false };
    }

    const raffle = await prisma.raffle.findFirst({
      where: { riferoId: profile.id, eventNumber: n, status: { in: ['PUBLISHED', 'FINISHED'] } },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!raffle) throw notFound('Rifa no encontrada');

    const stats = await getRaffleStats(raffle.id, raffle.totalTickets);
    const base = toRaffleDTO(raffle, raffle.images, stats);

    // Ganadores: sólo si el perfil lo permite, la rifa lo permite y están publicados. Sin datos de comprador.
    let winners: ReturnType<typeof toWinnerDTO>[] = [];
    if (profile.showWinners && raffle.allowWinnerPublication) {
      const w = await prisma.winner.findMany({
        where: { raffleId: raffle.id, published: true },
        orderBy: { position: 'asc' },
        include: { ticket: true, buyer: false },
      });
      winners = w.map((x) => toWinnerDTO({ ...x, buyer: null }, false));
    }

    return {
      active: true,
      raffle: {
        ...base,
        rifero: toPublicRiferoDTO(profile, []),
        winners,
        paymentProfile: {
          holderName: profile.payHolderName,
          bank: profile.payBank,
          clabe: profile.payClabe,
          cardNumber: profile.payCardNumber,
          concept: profile.payConcept,
          instructions: profile.payInstructions ?? raffle.paymentInstructions,
          whatsapp: profile.payWhatsapp ?? profile.whatsapp,
        },
      },
    };
  });

  // GET /public/raffles/:raffleId/tickets — boletos ligeros para la cuadrícula (sin comprador)
  app.get('/public/raffles/:raffleId/tickets', async (request) => {
    const { raffleId } = request.params as { raffleId: string };
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle || raffle.status === 'DRAFT') throw notFound('Rifa no encontrada');

    const tickets = await prisma.ticketNumber.findMany({
      where: { raffleId },
      orderBy: { number: 'asc' },
      select: { number: true, displayNumber: true, status: true },
    });
    return { items: tickets };
  });

  // POST /public/orders/lookup — el comprador busca SUS órdenes por teléfono.
  // Devuelve sólo las órdenes de ese teléfono dentro de este rifero. El código del
  // boleto digital se expone SÓLO cuando la orden está PAGADA (de cara al comprador,
  // sólo "ve su boleto" una vez que el organizador confirmó el pago).
  app.post(
    '/public/orders/lookup',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request) => {
      const body = (request.body ?? {}) as { slug?: string; phone?: string };
      const slug = (body.slug ?? '').toLowerCase().trim();
      const phone = (body.phone ?? '').replace(/\D/g, '');
      if (slug.length < 3 || phone.length < 10) {
        return { orders: [], paymentProfile: null };
      }

      const profile = await prisma.riferoProfile.findFirst({
        where: { OR: [{ subdomain: slug }, { slug }] },
      });
      if (!profile) throw notFound('Esta página no existe');

      const orders = await prisma.order.findMany({
        where: {
          raffle: { riferoId: profile.id },
          // Incluye vencidas/rechazadas para que el comprador vea qué pasó con su
          // apartado (antes desaparecían sin explicación).
          status: { in: ['RESERVED', 'PENDING', 'PAID', 'EXPIRED', 'REJECTED'] },
          buyer: { OR: [{ phone: { contains: phone } }, { whatsapp: { contains: phone } }] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          raffle: { select: { eventNumber: true, title: true } },
          tickets: { select: { displayNumber: true }, orderBy: { number: 'asc' } },
          digitalTicket: { select: { code: true } },
          paymentProofs: { select: { id: true } },
        },
        take: 50,
      });

      return {
        paymentProfile: {
          holderName: profile.payHolderName,
          bank: profile.payBank,
          clabe: profile.payClabe,
          cardNumber: profile.payCardNumber,
          concept: profile.payConcept,
          instructions: profile.payInstructions,
          whatsapp: profile.payWhatsapp ?? profile.whatsapp,
        },
        orders: orders.map((o) => ({
          code: o.code,
          raffleTitle: o.raffle.title,
          eventLabel: `E${o.raffle.eventNumber}`,
          eventNumber: o.raffle.eventNumber,
          ticketNumbers: o.tickets.map((t) => t.displayNumber),
          totalAmount: o.totalAmount,
          status: o.status,
          paidAt: o.paidAt?.toISOString() ?? null,
          expiresAt: o.expiresAt?.toISOString() ?? null,
          createdAt: o.createdAt.toISOString(),
          hasProof: o.paymentProofs.length > 0,
          // Sólo pagadas exponen el boleto digital.
          digitalTicketCode: o.status === 'PAID' ? (o.digitalTicket?.code ?? null) : null,
        })),
      };
    },
  );

  // ── Vista previa de enlaces (Open Graph dinámico) ──────────
  // Lo consume la edge function de Netlify para inyectar <meta og:*> por rifa.
  // Devuelve SIEMPRE 200 con un meta utilizable (cae a genérico si no resuelve),
  // para que un fallo nunca rompa la vista previa del enlace compartido.
  const DEFAULT_META = {
    title: 'Bismark — Crea tu página de rifas',
    description:
      'Tu página de rifas personalizada: recibe órdenes, controla boletos, confirma pagos y organiza sorteos desde el celular.',
    image: null as string | null,
    url: env.publicWebUrl,
    siteName: 'Bismark',
  };

  async function buildMeta(
    request: FastifyRequest,
    subdomain: string,
    eventRaw?: string,
  ): Promise<typeof DEFAULT_META> {
    const sub = subdomain.toLowerCase();
    const profile = await prisma.riferoProfile.findFirst({
      where: { OR: [{ subdomain: sub }, { slug: sub }] },
    });
    if (!profile || profile.status === 'DELETED' || profile.status === 'SUSPENDED') return DEFAULT_META;

    const ctx = await getPlanContext(profile.id);
    if (!ctx.hasActivePlan) return DEFAULT_META;

    // Vista de una rifa concreta.
    if (eventRaw) {
      const n = parseEventNumber(eventRaw);
      if (!Number.isNaN(n)) {
        const raffle = await prisma.raffle.findFirst({
          where: { riferoId: profile.id, eventNumber: n, status: { in: ['PUBLISHED', 'FINISHED'] } },
          include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
        });
        if (raffle) {
          const draw = formatDrawDate(raffle.drawDate);
          const descParts = [
            `Boleto ${moneyMxn(raffle.ticketPrice)}`,
            draw ? `Sorteo ${draw}` : null,
            raffle.prize ? `Premio: ${raffle.prize}` : null,
          ].filter(Boolean);
          return {
            title: `${raffle.title} — ${profile.publicName}`,
            description:
              descParts.join(' · ') ||
              raffle.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ||
              DEFAULT_META.description,
            image: absoluteImage(raffle.images[0]?.url ?? profile.coverUrl ?? profile.logoUrl, request),
            url: raffleWebUrl(profile.slug, raffle.eventNumber),
            siteName: profile.publicName,
          };
        }
      }
    }

    // Vista del rifero (su página principal).
    return {
      title: `${profile.publicName} — Rifas y sorteos`,
      description:
        profile.description ??
        `Participa en las rifas de ${profile.publicName}: boletos en línea, pago fácil y boleto digital con QR.`,
      image: absoluteImage(profile.coverUrl ?? profile.logoUrl, request),
      url: riferoWebUrl(profile.slug),
      siteName: profile.publicName,
    };
  }

  // GET /public/meta/:subdomain        → meta del rifero
  // GET /public/meta/:subdomain/:event → meta de una rifa (e1, e2, …)
  app.get('/public/meta/:subdomain', async (request) => {
    const { subdomain } = request.params as { subdomain: string };
    return buildMeta(request, subdomain);
  });
  app.get('/public/meta/:subdomain/:event', async (request) => {
    const { subdomain, event } = request.params as { subdomain: string; event: string };
    return buildMeta(request, subdomain, event);
  });
}
