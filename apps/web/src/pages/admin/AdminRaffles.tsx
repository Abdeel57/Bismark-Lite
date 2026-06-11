import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Ticket, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMXN, formatDateMX, RAFFLE_STATUS_LABELS, type RaffleStatus } from '@bismark/shared';
import { adminService, type AdminRaffleRow } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { PageLoader, EmptyState } from '@/components/ui/misc';
import { PageHeader } from '@/components/layout/DashboardLayout';

const RAFFLE_VARIANT: Record<RaffleStatus, BadgeProps['variant']> = {
  DRAFT: 'muted',
  PUBLISHED: 'success',
  FINISHED: 'info',
  CANCELLED: 'danger',
};

function RaffleStatusBadge({ status }: { status: string }) {
  const s = status as RaffleStatus;
  return <Badge variant={RAFFLE_VARIANT[s] ?? 'muted'}>{RAFFLE_STATUS_LABELS[s] ?? status}</Badge>;
}

export default function AdminRaffles() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'raffles'],
    queryFn: () => adminService.raffles(),
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.riferoName.toLowerCase().includes(q) ||
        r.eventLabel.toLowerCase().includes(q) ||
        r.riferoSlug.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div>
      <PageHeader title="Rifas" description="Todas las rifas creadas en la plataforma." />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, rifero o evento"
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Ticket className="h-10 w-10" />}
          title="Sin rifas"
          description={search ? 'No hay resultados para tu búsqueda.' : 'Aún no se han creado rifas.'}
        />
      ) : (
        <>
          {/* Tabla en escritorio */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Evento</th>
                    <th className="px-4 py-3 font-semibold">Rifa</th>
                    <th className="px-4 py-3 font-semibold">Rifero</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Precio</th>
                    <th className="px-4 py-3 text-right font-semibold">Boletos</th>
                    <th className="px-4 py-3 font-semibold">Sorteo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{r.eventLabel}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">{r.title}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/r/${r.riferoSlug}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {r.riferoName} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <RaffleStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMXN(r.ticketPrice)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.totalTickets.toLocaleString('es-MX')}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.drawDate ? formatDateMX(r.drawDate) : 'Sin fecha'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tarjetas en móvil */}
          <div className="grid gap-3 lg:hidden">
            {filtered.map((r) => (
              <RaffleCard key={r.id} raffle={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RaffleCard({ raffle }: { raffle: AdminRaffleRow }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="secondary">{raffle.eventLabel}</Badge>
              <RaffleStatusBadge status={raffle.status} />
            </div>
            <p className="truncate font-bold">{raffle.title}</p>
            <Link
              to={`/r/${raffle.riferoSlug}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {raffle.riferoName} <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="info">{formatMXN(raffle.ticketPrice)}</Badge>
          <Badge variant="muted">{raffle.totalTickets.toLocaleString('es-MX')} boletos</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Sorteo: {raffle.drawDate ? formatDateMX(raffle.drawDate) : 'Sin fecha'}
        </p>
      </CardContent>
    </Card>
  );
}
