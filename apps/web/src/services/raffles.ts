import { apiFetch } from '@/lib/api';
import type {
  RaffleDTO,
  CreateRaffleInput,
  UpdateRaffleInput,
  DashboardSummaryDTO,
  BuyerDTO,
} from '@bismark/shared';

export interface OwnerTicketDTO {
  id: string;
  number: number;
  displayNumber: string;
  status: string;
  reservedUntil: string | null;
  paidAt: string | null;
  orderId: string | null;
  buyer: BuyerDTO | null;
}

export const raffleService = {
  dashboardSummary: () => apiFetch<{ summary: DashboardSummaryDTO }>('/dashboard/summary'),
  list: () => apiFetch<{ items: RaffleDTO[] }>('/raffles'),
  get: (id: string) => apiFetch<{ raffle: RaffleDTO }>(`/raffles/${id}`),
  create: (input: CreateRaffleInput) => apiFetch<{ raffle: RaffleDTO }>('/raffles', { method: 'POST', body: input }),
  update: (id: string, input: UpdateRaffleInput) =>
    apiFetch<{ raffle: RaffleDTO }>(`/raffles/${id}`, { method: 'PATCH', body: input }),
  publish: (id: string) => apiFetch<{ raffle: RaffleDTO }>(`/raffles/${id}/publish`, { method: 'POST' }),
  cancel: (id: string) => apiFetch<{ raffle: RaffleDTO }>(`/raffles/${id}/cancel`, { method: 'POST' }),
  ownerTickets: (id: string) => apiFetch<{ items: OwnerTicketDTO[] }>(`/raffles/${id}/tickets`),
};
