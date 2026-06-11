import { prisma } from './prisma.js';
import { planLimit, forbidden } from './errors.js';
import type { Plan, Subscription } from '@prisma/client';

export interface PlanContext {
  hasActivePlan: boolean;
  plan: Plan | null;
  subscription: Subscription | null;
  subscriptionStatus: Subscription['status'] | null;
}

// Resuelve el plan activo de un rifero. Una suscripción cuenta como activa si
// status === ACTIVE y (endsAt es null o futuro).
export async function getPlanContext(riferoId: string): Promise<PlanContext> {
  const sub = await prisma.subscription.findFirst({
    where: { riferoId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  if (!sub) {
    return { hasActivePlan: false, plan: null, subscription: null, subscriptionStatus: null };
  }

  const notExpired = !sub.endsAt || sub.endsAt.getTime() > Date.now();
  const active = sub.status === 'ACTIVE' && notExpired;

  return {
    hasActivePlan: active,
    plan: active ? sub.plan : null,
    subscription: sub,
    subscriptionStatus: sub.status,
  };
}

export async function assertActivePlan(riferoId: string): Promise<Plan> {
  const ctx = await getPlanContext(riferoId);
  if (!ctx.hasActivePlan || !ctx.plan) {
    throw planLimit(
      'Tu página ya está lista. Para que los cambios sean visibles públicamente y puedas recibir compradores, activa un plan de Bismark.',
    );
  }
  return ctx.plan;
}

// Verifica que el rifero pueda PUBLICAR una rifa (hacerla pública). Requiere plan
// activo y respeta los límites del plan: boletos por rifa y nº de rifas públicas a
// la vez. Crear/editar borradores NO pasa por aquí — es libre y no exige plan.
export async function assertCanPublishRaffle(
  riferoId: string,
  raffleId: string,
  totalTickets: number,
): Promise<Plan> {
  const plan = await assertActivePlan(riferoId);
  assertTicketLimit(plan, totalTickets);
  const publishedCount = await prisma.raffle.count({
    where: { riferoId, status: 'PUBLISHED', id: { not: raffleId } },
  });
  if (publishedCount >= plan.maxActiveRaffles) {
    throw planLimit(
      `Tu plan permite hasta ${plan.maxActiveRaffles} rifa(s) pública(s) a la vez. Finaliza una o mejora tu plan para publicar más.`,
    );
  }
  return plan;
}

export function assertTicketLimit(plan: Plan, totalTickets: number): void {
  if (totalTickets > plan.maxTicketsPerRaffle) {
    throw planLimit(
      `Tu plan permite hasta ${plan.maxTicketsPerRaffle} boletos por rifa. Reduce la cantidad o mejora tu plan.`,
    );
  }
}

export type PlanFeature =
  | 'allowProofUpload'
  | 'allowMultipleWinners'
  | 'allowReportsExcel'
  | 'allowReportsPdf'
  | 'allowVerificationBadge'
  | 'allowDigitalDraw'
  | 'allowCustomDomainFuture';

const FEATURE_MESSAGES: Record<PlanFeature, string> = {
  allowProofUpload: 'La subida de comprobantes no está incluida en tu plan.',
  allowMultipleWinners: 'Los ganadores múltiples no están incluidos en tu plan.',
  allowReportsExcel: 'Los reportes en Excel no están incluidos en tu plan.',
  allowReportsPdf: 'Los reportes en PDF no están incluidos en tu plan.',
  allowVerificationBadge: 'La verificación azul no está incluida en tu plan.',
  allowDigitalDraw: 'La tómbola digital no está incluida en tu plan.',
  allowCustomDomainFuture: 'El dominio personalizado no está incluido en tu plan.',
};

export async function assertFeature(riferoId: string, feature: PlanFeature): Promise<Plan> {
  const plan = await assertActivePlan(riferoId);
  if (!plan[feature]) {
    throw forbidden(FEATURE_MESSAGES[feature]);
  }
  return plan;
}
