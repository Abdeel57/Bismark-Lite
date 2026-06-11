import { apiFetch } from '@/lib/api';
import type { PlanDTO, PlanInput } from '@bismark/shared';

export const planService = {
  list: () => apiFetch<{ items: PlanDTO[] }>('/plans'),
  adminList: () => apiFetch<{ items: PlanDTO[] }>('/admin/plans'),
  create: (input: PlanInput) => apiFetch<{ plan: PlanDTO }>('/admin/plans', { method: 'POST', body: input }),
  update: (id: string, input: Partial<PlanInput>) =>
    apiFetch<{ plan: PlanDTO }>(`/admin/plans/${id}`, { method: 'PATCH', body: input }),
  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    apiFetch<{ plan: PlanDTO }>(`/admin/plans/${id}/status`, { method: 'PATCH', body: { status } }),
};
