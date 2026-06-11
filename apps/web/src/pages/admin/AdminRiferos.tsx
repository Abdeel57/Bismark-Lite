import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Store, ExternalLink, Ban, RotateCcw, Sparkles } from 'lucide-react';
import {
  formatMXN,
  SUBSCRIPTION_STATUS_LABELS,
  type AdminRiferoDTO,
  type RiferoStatus,
  type SubscriptionStatus,
} from '@bismark/shared';
import { adminService } from '@/services/admin';
import { planService } from '@/services/plans';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageLoader, EmptyState } from '@/components/ui/misc';
import { VerifiedBadge } from '@/components/brand/VerifiedBadge';
import { PageHeader } from '@/components/layout/DashboardLayout';
import { Link } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';

const RIFERO_STATUS: Record<RiferoStatus, { label: string; variant: BadgeProps['variant'] }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  SUSPENDED: { label: 'Suspendido', variant: 'danger' },
  PENDING: { label: 'Pendiente', variant: 'warning' },
  DELETED: { label: 'Eliminado', variant: 'muted' },
};

const SUB_VARIANT: Record<SubscriptionStatus, BadgeProps['variant']> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  EXPIRED: 'muted',
  SUSPENDED: 'danger',
  CANCELLED: 'muted',
};

function SubscriptionBadge({ status }: { status: SubscriptionStatus | null }) {
  if (!status) return <Badge variant="muted">Sin plan</Badge>;
  return <Badge variant={SUB_VARIANT[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>;
}

export default function AdminRiferos() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [planFor, setPlanFor] = useState<AdminRiferoDTO | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'riferos'],
    queryFn: () => adminService.riferos(),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'riferos'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'metrics'] });
  };

  const suspend = useMutation({
    mutationFn: (id: string) => adminService.suspendRifero(id),
    onSuccess: () => {
      toast.success('Rifero suspendido');
      invalidate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Algo salió mal'),
  });

  const reactivate = useMutation({
    mutationFn: (id: string) => adminService.reactivateRifero(id),
    onSuccess: () => {
      toast.success('Rifero reactivado');
      invalidate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Algo salió mal'),
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        r.publicName.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div>
      <PageHeader title="Riferos" description="Administra a todos los organizadores de rifas." />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, slug o correo"
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Store className="h-10 w-10" />}
          title="Sin riferos"
          description={search ? 'No hay resultados para tu búsqueda.' : 'Aún no hay riferos registrados.'}
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
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Suscripción</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 text-right font-semibold">Rifas</th>
                    <th className="px-4 py-3 text-right font-semibold">Ingreso est.</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {r.publicName}
                          {r.verified && <VerifiedBadge size={16} />}
                        </div>
                        <Link
                          to={`/r/${r.slug}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          /{r.slug} <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={RIFERO_STATUS[r.status].variant}>{RIFERO_STATUS[r.status].label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <SubscriptionBadge status={r.subscriptionStatus} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.activePlanName ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.raffleCount}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatMXN(r.estimatedRevenue)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setPlanFor(r)}>
                            <Sparkles className="h-4 w-4" /> Plan
                          </Button>
                          {r.status === 'SUSPENDED' ? (
                            <Button
                              size="sm"
                              variant="success"
                              loading={reactivate.isPending && reactivate.variables === r.id}
                              onClick={() => reactivate.mutate(r.id)}
                            >
                              <RotateCcw className="h-4 w-4" /> Reactivar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              loading={suspend.isPending && suspend.variables === r.id}
                              onClick={() => suspend.mutate(r.id)}
                            >
                              <Ban className="h-4 w-4" /> Suspender
                            </Button>
                          )}
                        </div>
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
              <Card key={r.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="truncate">{r.publicName}</span>
                        {r.verified && <VerifiedBadge size={16} />}
                      </div>
                      <Link
                        to={`/r/${r.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        /{r.slug} <ExternalLink className="h-3 w-3" />
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{r.userName} · {r.userEmail}</p>
                    </div>
                    <Badge variant={RIFERO_STATUS[r.status].variant}>{RIFERO_STATUS[r.status].label}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <SubscriptionBadge status={r.subscriptionStatus} />
                    {r.activePlanName && <Badge variant="secondary">{r.activePlanName}</Badge>}
                    <Badge variant="muted">{r.raffleCount} rifas</Badge>
                    <Badge variant="info">{formatMXN(r.estimatedRevenue)}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPlanFor(r)}>
                      <Sparkles className="h-4 w-4" /> Activar plan
                    </Button>
                    {r.status === 'SUSPENDED' ? (
                      <Button
                        size="sm"
                        variant="success"
                        loading={reactivate.isPending && reactivate.variables === r.id}
                        onClick={() => reactivate.mutate(r.id)}
                      >
                        <RotateCcw className="h-4 w-4" /> Reactivar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        loading={suspend.isPending && suspend.variables === r.id}
                        onClick={() => suspend.mutate(r.id)}
                      >
                        <Ban className="h-4 w-4" /> Suspender
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ActivatePlanDialog rifero={planFor} onClose={() => setPlanFor(null)} onDone={invalidate} />
    </div>
  );
}

function ActivatePlanDialog({
  rifero,
  onClose,
  onDone,
}: {
  rifero: AdminRiferoDTO | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [planId, setPlanId] = useState('');
  const [months, setMonths] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => planService.adminList(),
    enabled: Boolean(rifero),
  });

  const activate = useMutation({
    mutationFn: () => adminService.activateSubscription(rifero!.id, planId, months),
    onSuccess: () => {
      toast.success('Suscripción activada');
      onDone();
      onClose();
      setPlanId('');
      setMonths(1);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Algo salió mal'),
  });

  const plans = data?.items ?? [];

  return (
    <Dialog open={Boolean(rifero)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activar plan</DialogTitle>
          <DialogDescription>
            Asigna un plan a {rifero?.publicName} y define la vigencia en meses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="plan">Plan</Label>
            <Select
              id="plan"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading ? 'Cargando planes...' : 'Selecciona un plan'}
              </option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {formatMXN(p.price)}/mes
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="months">Meses de vigencia</Label>
            <Input
              id="months"
              type="number"
              min={1}
              max={36}
              value={months}
              onChange={(e) => setMonths(Math.max(1, Math.min(36, Number(e.target.value) || 1)))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="brand"
            disabled={!planId}
            loading={activate.isPending}
            onClick={() => activate.mutate()}
          >
            Activar suscripción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
