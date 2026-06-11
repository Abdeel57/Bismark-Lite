import type { FastifyInstance } from 'fastify';
import { activateSubscriptionSchema, SubscriptionStatus } from '@bismark/shared';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../lib/http.js';
import { notFound, badRequest } from '../../lib/errors.js';
import { requireAdmin } from '../../middlewares/auth.js';
import { logActivity } from '../../lib/activity.js';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default async function subscriptionsRoutes(app: FastifyInstance): Promise<void> {
  // GET /admin/subscriptions
  app.get('/admin/subscriptions', { preHandler: requireAdmin }, async (request) => {
    const q = request.query as { status?: string };
    const subs = await prisma.subscription.findMany({
      where: q.status ? { status: q.status as keyof typeof SubscriptionStatus } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { plan: true, rifero: { include: { user: true } } },
      take: 500,
    });
    return {
      items: subs.map((s) => ({
        id: s.id,
        riferoId: s.riferoId,
        riferoName: s.rifero.publicName,
        userEmail: s.rifero.user.email,
        planId: s.planId,
        planName: s.plan.name,
        status: s.status,
        startsAt: s.startsAt?.toISOString() ?? null,
        endsAt: s.endsAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  });

  // POST /admin/subscriptions/activate — activación manual de plan a un rifero
  app.post('/admin/subscriptions/activate', { preHandler: requireAdmin }, async (request, reply) => {
    const data = validate(activateSubscriptionSchema, request.body);

    const rifero = await prisma.riferoProfile.findUnique({ where: { id: data.riferoId } });
    if (!rifero) throw notFound('Rifero no encontrado');
    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan) throw notFound('Plan no encontrado');

    const now = new Date();
    const endsAt = addMonths(now, data.months);

    const result = await prisma.$transaction(async (tx) => {
      // Cancelar suscripciones activas previas.
      await tx.subscription.updateMany({
        where: { riferoId: data.riferoId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });
      const sub = await tx.subscription.create({
        data: { riferoId: data.riferoId, planId: data.planId, status: 'ACTIVE', startsAt: now, endsAt },
        include: { plan: true },
      });
      // Reflejar verificación según plan y activar el perfil.
      await tx.riferoProfile.update({
        where: { id: data.riferoId },
        data: { verified: plan.allowVerificationBadge, status: 'ACTIVE' },
      });
      return sub;
    });

    await logActivity({
      userId: request.auth!.userId,
      type: 'SUBSCRIPTION',
      action: 'activate',
      meta: { riferoId: data.riferoId, planId: data.planId, months: data.months },
    });

    reply.code(201).send({
      subscription: {
        id: result.id,
        riferoId: result.riferoId,
        planId: result.planId,
        status: result.status,
        startsAt: result.startsAt?.toISOString() ?? null,
        endsAt: result.endsAt?.toISOString() ?? null,
        createdAt: result.createdAt.toISOString(),
      },
    });
  });

  // PATCH /admin/subscriptions/:id — cambiar estado (suspend/expire/cancel/activate)
  app.patch('/admin/subscriptions/:id', { preHandler: requireAdmin }, async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status?: string };
    const valid = ['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'];
    if (!status || !valid.includes(status)) throw badRequest('Estado inválido');

    const sub = await prisma.subscription.update({
      where: { id },
      data: { status: status as keyof typeof SubscriptionStatus },
      include: { plan: true },
    });

    // Si deja de estar activa, quitar verificación.
    if (status !== 'ACTIVE') {
      await prisma.riferoProfile.update({ where: { id: sub.riferoId }, data: { verified: false } });
    } else {
      await prisma.riferoProfile.update({ where: { id: sub.riferoId }, data: { verified: sub.plan.allowVerificationBadge, status: 'ACTIVE' } });
    }

    await logActivity({ userId: request.auth!.userId, type: 'SUBSCRIPTION', action: 'update_status', meta: { subscriptionId: id, status } });
    return {
      subscription: {
        id: sub.id,
        riferoId: sub.riferoId,
        planId: sub.planId,
        status: sub.status,
        startsAt: sub.startsAt?.toISOString() ?? null,
        endsAt: sub.endsAt?.toISOString() ?? null,
        createdAt: sub.createdAt.toISOString(),
      },
    };
  });
}
