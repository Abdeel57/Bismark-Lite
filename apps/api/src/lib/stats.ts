import { prisma } from './prisma.js';
import type { RaffleStats } from './serializers.js';

// Cuenta boletos por estado para una rifa.
export async function getRaffleStats(raffleId: string, totalTickets: number): Promise<RaffleStats> {
  const grouped = await prisma.ticketNumber.groupBy({
    by: ['status'],
    where: { raffleId },
    _count: { _all: true },
  });
  const map = new Map(grouped.map((g) => [g.status, g._count._all]));
  // Los ganadores siguen contando como vendidos (eran boletos pagados).
  const soldCount = (map.get('PAID') ?? 0) + (map.get('WINNER') ?? 0);
  const reservedCount = (map.get('RESERVED') ?? 0) + (map.get('PENDING_PAYMENT') ?? 0);
  const available = map.get('AVAILABLE') ?? totalTickets - (soldCount + reservedCount);
  return { soldCount, reservedCount, availableCount: available };
}

// Cuenta sólo boletos pagados (para resúmenes públicos) en muchas rifas.
export async function getPaidCounts(raffleIds: string[]): Promise<Map<string, number>> {
  if (raffleIds.length === 0) return new Map();
  const grouped = await prisma.ticketNumber.groupBy({
    by: ['raffleId'],
    where: { raffleId: { in: raffleIds }, status: { in: ['PAID', 'WINNER'] } },
    _count: { _all: true },
  });
  return new Map(grouped.map((g) => [g.raffleId, g._count._all]));
}
