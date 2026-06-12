import type { FastifyInstance } from 'fastify';
import { planSchema, updatePlanSchema, slugify } from '@bismark/shared';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../lib/http.js';
import { requireAdmin } from '../../middlewares/auth.js';
import { toPlanDTO } from '../../lib/serializers.js';
import { logActivity } from '../../lib/activity.js';

export default async function plansRoutes(app: FastifyInstance): Promise<void> {
  // GET /plans — público (landing y pantalla de planes)
  app.get('/plans', async () => {
    const plans = await prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
    });
    return { items: plans.map(toPlanDTO) };
  });

  // GET /admin/plans — todos (incluye inactivos)
  app.get('/admin/plans', { preHandler: requireAdmin }, async () => {
    const plans = await prisma.plan.findMany({ orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] });
    return { items: plans.map(toPlanDTO) };
  });

  // POST /admin/plans
  app.post('/admin/plans', { preHandler: requireAdmin }, async (request, reply) => {
    const data = validate(planSchema, request.body);
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        slug: data.slug || slugify(data.name),
        price: data.price,
        priceYearly: data.priceYearly,
        currency: data.currency,
        billingPeriod: data.billingPeriod,
        maxActiveRaffles: data.maxActiveRaffles,
        maxTicketsPerRaffle: data.maxTicketsPerRaffle,
        allowProofUpload: data.allowProofUpload,
        allowMultipleWinners: data.allowMultipleWinners,
        allowReportsExcel: data.allowReportsExcel,
        allowReportsPdf: data.allowReportsPdf,
        allowVerificationBadge: data.allowVerificationBadge,
        allowDigitalDraw: data.allowDigitalDraw,
        allowCustomDomainFuture: data.allowCustomDomainFuture,
        features: data.features,
        sortOrder: data.sortOrder,
      },
    });
    await logActivity({ userId: request.auth!.userId, type: 'ADMIN', action: 'create_plan', meta: { planId: plan.id } });
    return reply.code(201).send({ plan: toPlanDTO(plan) });
  });

  // PATCH /admin/plans/:id
  app.patch('/admin/plans/:id', { preHandler: requireAdmin }, async (request) => {
    const { id } = request.params as { id: string };
    const data = validate(updatePlanSchema, request.body);
    const plan = await prisma.plan.update({ where: { id }, data });
    await logActivity({ userId: request.auth!.userId, type: 'ADMIN', action: 'update_plan', meta: { planId: id } });
    return { plan: toPlanDTO(plan) };
  });

  // PATCH /admin/plans/:id/status — activar/desactivar plan
  app.patch('/admin/plans/:id/status', { preHandler: requireAdmin }, async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status?: 'ACTIVE' | 'INACTIVE' };
    const plan = await prisma.plan.update({
      where: { id },
      data: { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' },
    });
    return { plan: toPlanDTO(plan) };
  });
}
