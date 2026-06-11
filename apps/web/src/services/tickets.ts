import { apiFetch } from '@/lib/api';
import type { OrderReceiptDTO, ReserveTicketsInput, TicketStatus } from '@bismark/shared';

export const ticketService = {
  reserve: (raffleId: string, input: ReserveTicketsInput) =>
    apiFetch<{ receipt: OrderReceiptDTO }>(`/public/raffles/${raffleId}/reserve`, { method: 'POST', body: input }),
  reserveManual: (raffleId: string, ticketNumbers: number[], note?: string) =>
    apiFetch<{ reserved: number }>('/tickets/reserve-manual', {
      method: 'POST',
      body: { raffleId, ticketNumbers, note },
    }),
  setStatus: (ticketId: string, status: TicketStatus) =>
    apiFetch<{ ok: true }>(`/tickets/${ticketId}/status`, { method: 'PATCH', body: { status } }),
};
