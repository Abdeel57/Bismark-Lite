import { prisma } from './prisma.js';
import { formatTicketNumber } from '@bismark/shared';

// Genera las filas TicketNumber para una rifa, en chunks para soportar miles.
export async function generateTickets(
  raffleId: string,
  start: number,
  count: number,
  format: number,
): Promise<void> {
  const CHUNK = 2000;
  let buffer: { raffleId: string; number: number; displayNumber: string }[] = [];
  for (let i = 0; i < count; i++) {
    const n = start + i;
    buffer.push({ raffleId, number: n, displayNumber: formatTicketNumber(n, format) });
    if (buffer.length >= CHUNK) {
      await prisma.ticketNumber.createMany({ data: buffer, skipDuplicates: true });
      buffer = [];
    }
  }
  if (buffer.length > 0) {
    await prisma.ticketNumber.createMany({ data: buffer, skipDuplicates: true });
  }
}

// ¿Tiene la rifa boletos comprometidos (apartados/pagados/reservados)?
export async function hasCommittedTickets(raffleId: string): Promise<boolean> {
  const n = await prisma.ticketNumber.count({
    where: {
      raffleId,
      status: { in: ['RESERVED', 'PENDING_PAYMENT', 'PAID', 'RIFERO_RESERVED', 'WINNER'] },
    },
  });
  return n > 0;
}
