import { apiFetch } from '@/lib/api';
import type { AdminRiferoDTO, AdminMetricsDTO } from '@bismark/shared';

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  slug: string | null;
  createdAt: string;
}

export interface AdminRaffleRow {
  id: string;
  title: string;
  eventLabel: string;
  riferoName: string;
  riferoSlug: string;
  status: string;
  ticketPrice: number;
  totalTickets: number;
  drawDate: string | null;
  createdAt: string;
}

export interface AdminSubscriptionRow {
  id: string;
  riferoId: string;
  riferoName: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export const adminService = {
  metrics: () => apiFetch<{ metrics: AdminMetricsDTO }>('/admin/metrics'),
  users: () => apiFetch<{ items: AdminUserRow[] }>('/admin/users'),
  riferos: () => apiFetch<{ items: AdminRiferoDTO[] }>('/admin/riferos'),
  suspendRifero: (id: string) => apiFetch<{ ok: true }>(`/admin/riferos/${id}/suspend`, { method: 'PATCH' }),
  reactivateRifero: (id: string) => apiFetch<{ ok: true }>(`/admin/riferos/${id}/reactivate`, { method: 'PATCH' }),
  raffles: () => apiFetch<{ items: AdminRaffleRow[] }>('/admin/raffles'),
  subscriptions: () => apiFetch<{ items: AdminSubscriptionRow[] }>('/admin/subscriptions'),
  activateSubscription: (riferoId: string, planId: string, months: number) =>
    apiFetch<{ subscription: AdminSubscriptionRow }>('/admin/subscriptions/activate', {
      method: 'POST',
      body: { riferoId, planId, months },
    }),
  updateSubscription: (id: string, status: string) =>
    apiFetch<{ subscription: AdminSubscriptionRow }>(`/admin/subscriptions/${id}`, { method: 'PATCH', body: { status } }),
};
