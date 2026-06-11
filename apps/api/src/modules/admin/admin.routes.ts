import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import { requireAdmin } from '../../middlewares/auth.js';
import { getPlanContext } from '../../lib/plan.js';
import { logActivity } from '../../lib/activity.js';

// Suma ingresos estimados (boletos pagados/ganadores) por rifero.
async function revenueByRifero(): Promise<Map<string, number>> {
  const paid = await prisma.ticketNumber.findMany({
    where: { status: { in: ['PAID', 'WINNER'] } },
    select: { raffle: { select: { riferoId: true, ticketPrice: true } } },
  });
  const map = new Map<string, number>();
  for (const t of paid) {
    const rid = t.raffle.riferoId;
    map.set(rid, (map.get(rid) ?? 0) + t.raffle.ticketPrice);
  }
  return map;
}

export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  // GET /admin/users
  app.get('/admin/users', { preHandler: requireAdmin }, async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { riferoProfile: true },
      take: 1000,
    });
    return {
      items: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        slug: u.riferoProfile?.slug ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  });

  // GET /admin/riferos
  app.get('/admin/riferos', { preHandler: requireAdmin }, async () => {
    const riferos = await prisma.riferoProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true, _count: { select: { raffles: true } } },
      take: 1000,
    });
    const revenue = await revenueByRifero();

    const items = await Promise.all(
      riferos.map(async (r) => {
        const ctx = await getPlanContext(r.id);
        return {
          id: r.id,
          userId: r.userId,
          userName: r.user.name,
          userEmail: r.user.email,
          publicName: r.publicName,
          slug: r.slug,
          status: r.status,
          verified: r.verified,
          subscriptionStatus: ctx.subscriptionStatus,
          activePlanName: ctx.plan?.name ?? null,
          raffleCount: r._count.raffles,
          estimatedRevenue: revenue.get(r.id) ?? 0,
          createdAt: r.createdAt.toISOString(),
        };
      }),
    );
    return { items };
  });

  // PATCH /admin/riferos/:id/suspend
  app.patch('/admin/riferos/:id/suspend', { preHandler: requireAdmin }, async (request) => {
    const { id } = request.params as { id: string };
    const rifero = await prisma.riferoProfile.findUnique({ where: { id } });
    if (!rifero) throw notFound('Rifero no encontrado');
    await prisma.$transaction([
      prisma.riferoProfile.update({ where: { id }, data: { status: 'SUSPENDED' } }),
      prisma.user.update({ where: { id: rifero.userId }, data: { status: 'SUSPENDED' } }),
    ]);
    await logActivity({ userId: request.auth!.userId, type: 'ADMIN', action: 'suspend_rifero', meta: { riferoId: id } });
    return { ok: true };
  });

  // PATCH /admin/riferos/:id/reactivate
  app.patch('/admin/riferos/:id/reactivate', { preHandler: requireAdmin }, async (request) => {
    const { id } = request.params as { id: string };
    const rifero = await prisma.riferoProfile.findUnique({ where: { id } });
    if (!rifero) throw notFound('Rifero no encontrado');
    await prisma.$transaction([
      prisma.riferoProfile.update({ where: { id }, data: { status: 'ACTIVE' } }),
      prisma.user.update({ where: { id: rifero.userId }, data: { status: 'ACTIVE' } }),
    ]);
    await logActivity({ userId: request.auth!.userId, type: 'ADMIN', action: 'reactivate_rifero', meta: { riferoId: id } });
    return { ok: true };
  });

  // GET /admin/raffles — todas las rifas
  app.get('/admin/raffles', { preHandler: requireAdmin }, async () => {
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { rifero: { select: { publicName: true, slug: true } } },
      take: 1000,
    });
    return {
      items: raffles.map((r) => ({
        id: r.id,
        title: r.title,
        eventLabel: `E${r.eventNumber}`,
        riferoName: r.rifero.publicName,
        riferoSlug: r.rifero.slug,
        status: r.status,
        ticketPrice: r.ticketPrice,
        totalTickets: r.totalTickets,
        drawDate: r.drawDate?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  });

  // GET /admin/metrics
  app.get('/admin/metrics', { preHandler: requireAdmin }, async () => {
    const [
      totalUsers,
      totalRiferos,
      activeRiferos,
      totalRaffles,
      publishedRaffles,
      totalOrders,
      paidOrders,
      activeSubscriptions,
      pendingSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.riferoProfile.count(),
      prisma.riferoProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.raffle.count(),
      prisma.raffle.count({ where: { status: 'PUBLISHED' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'PENDING' } }),
    ]);

    const revenue = await revenueByRifero();
    const estimatedGmv = [...revenue.values()].reduce((a, b) => a + b, 0);

    return {
      metrics: {
        totalUsers,
        totalRiferos,
        activeRiferos,
        totalRaffles,
        publishedRaffles,
        totalOrders,
        paidOrders,
        estimatedGmv,
        activeSubscriptions,
        pendingSubscriptions,
      },
    };
  });
}
