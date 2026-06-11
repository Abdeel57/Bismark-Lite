import { Badge, type BadgeProps } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, TICKET_STATUS_LABELS, type OrderStatus, type TicketStatus } from '@bismark/shared';

const ORDER_VARIANT: Record<OrderStatus, BadgeProps['variant']> = {
  PENDING: 'warning',
  RESERVED: 'warning',
  PAID: 'success',
  REJECTED: 'danger',
  CANCELLED: 'muted',
  EXPIRED: 'muted',
};

const TICKET_VARIANT: Record<TicketStatus, BadgeProps['variant']> = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  RIFERO_RESERVED: 'secondary',
  CANCELLED: 'muted',
  WINNER: 'default',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_VARIANT[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={TICKET_VARIANT[status]}>{TICKET_STATUS_LABELS[status]}</Badge>;
}
