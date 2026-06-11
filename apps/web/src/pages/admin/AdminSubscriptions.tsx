import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import {
  formatDateMX,
  SUBSCRIPTION_STATUS_LABELS,
  SubscriptionStatus,
  type SubscriptionStatus as SubStatus,
} from '@bismark/shared';
import { adminService, type AdminSubscriptionRow } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PageLoader, EmptyState } from '@/components/ui/misc';
import { PageHeader } from '@/components/layout/DashboardLayout';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';

const SUB_VARIANT: Record<SubStatus, BadgeProps['variant']> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  EXPIRED: 'muted',
  SUSPENDED: 'danger',
  CANCELLED: 'muted',
};

const STATUS_OPTIONS = Object.values(SubscriptionStatus);

function SubBadge({ status }: { status: string }) {
  const s = status as SubStatus;
  return <Badge variant={SUB_VARIANT[s] ?? 'muted'}>{SUBSCRIPTION_STATUS_LABELS[s] ?? status}</Badge>;
}

export default function AdminSubscriptions() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | SubStatus>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => adminService.subscriptions(),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.updateSubscription(id, status),
    onSuccess: () => {
      toast.success('Estado de suscripción actualizado');
      void qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'metrics'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'riferos'] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Algo salió mal'),
  });

  const items = data?.items ?? [];
  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((s) => s.status === filter)),
    [items, filter],
  );

  return (
    <div>
      <PageHeader title="Suscripciones" description="Controla los planes activos de cada rifero." />

      <div className="mb-4 max-w-xs">
        <Label htmlFor="filter">Filtrar por estado</Label>
        <Select id="filter" value={filter} onChange={(e) => setFilter(e.target.value as 'all' | SubStatus)}>
          <option value="all">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {SUBSCRIPTION_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-10 w-10" />}
          title="Sin suscripciones"
          description={filter === 'all' ? 'Aún no hay suscripciones.' : 'No hay suscripciones con ese estado.'}
        />
      ) : (
        <>
          {/* Tabla en escritorio */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Rifero</th>
                    <th className="px-4 py-3 font-semibold">Correo</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Inicio</th>
                    <th className="px-4 py-3 font-semibold">Fin</th>
                    <th className="px-4 py-3 font-semibold">Cambiar estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold">{s.riferoName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.userEmail}</td>
                      <td className="px-4 py-3">{s.planName}</td>
                      <td className="px-4 py-3">
                        <SubBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.startsAt ? formatDateMX(s.startsAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.endsAt ? formatDateMX(s.endsAt) : '—'}</td>
                      <td className="px-4 py-3">
                        <Select
                          className="h-9 text-sm"
                          value={s.status}
                          disabled={update.isPending && update.variables?.id === s.id}
                          onChange={(e) => update.mutate({ id: s.id, status: e.target.value })}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {SUBSCRIPTION_STATUS_LABELS[opt]}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tarjetas en móvil */}
          <div className="grid gap-3 lg:hidden">
            {filtered.map((s) => (
              <SubscriptionCard
                key={s.id}
                sub={s}
                pending={update.isPending && update.variables?.id === s.id}
                onChange={(status) => update.mutate({ id: s.id, status })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SubscriptionCard({
  sub,
  pending,
  onChange,
}: {
  sub: AdminSubscriptionRow;
  pending: boolean;
  onChange: (status: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold">{sub.riferoName}</p>
            <p className="truncate text-xs text-muted-foreground">{sub.userEmail}</p>
          </div>
          <SubBadge status={sub.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">{sub.planName}</Badge>
          <Badge variant="muted">Inicio: {sub.startsAt ? formatDateMX(sub.startsAt) : '—'}</Badge>
          <Badge variant="muted">Fin: {sub.endsAt ? formatDateMX(sub.endsAt) : '—'}</Badge>
        </div>
        <div>
          <Label htmlFor={`sub-${sub.id}`}>Cambiar estado</Label>
          <Select
            id={`sub-${sub.id}`}
            value={sub.status}
            disabled={pending}
            onChange={(e) => onChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {SUBSCRIPTION_STATUS_LABELS[opt]}
              </option>
            ))}
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
