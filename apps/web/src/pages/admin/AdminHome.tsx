import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Store,
  CheckCircle2,
  Ticket,
  Megaphone,
  Receipt,
  BadgeCheck,
  CircleDollarSign,
  CreditCard,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { formatMXN, type AdminMetricsDTO } from '@bismark/shared';
import { adminService } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { PageHeader } from '@/components/layout/DashboardLayout';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface MetricDef {
  key: keyof AdminMetricsDTO;
  label: string;
  icon: LucideIcon;
  tone: string;
  money?: boolean;
}

const METRICS: MetricDef[] = [
  { key: 'totalUsers', label: 'Usuarios', icon: Users, tone: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-300' },
  { key: 'totalRiferos', label: 'Riferos', icon: Store, tone: 'text-violet-600 bg-violet-100 dark:bg-violet-950 dark:text-violet-300' },
  { key: 'activeRiferos', label: 'Riferos activos', icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300' },
  { key: 'totalRaffles', label: 'Rifas', icon: Ticket, tone: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300' },
  { key: 'publishedRaffles', label: 'Rifas publicadas', icon: Megaphone, tone: 'text-sky-600 bg-sky-100 dark:bg-sky-950 dark:text-sky-300' },
  { key: 'totalOrders', label: 'Órdenes', icon: Receipt, tone: 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-300' },
  { key: 'paidOrders', label: 'Órdenes pagadas', icon: BadgeCheck, tone: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300' },
  { key: 'estimatedGmv', label: 'GMV estimado', icon: CircleDollarSign, tone: 'text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-300', money: true },
  { key: 'activeSubscriptions', label: 'Suscripciones activas', icon: CreditCard, tone: 'text-teal-600 bg-teal-100 dark:bg-teal-950 dark:text-teal-300' },
  { key: 'pendingSubscriptions', label: 'Suscripciones pendientes', icon: Clock, tone: 'text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-300' },
];

export default function AdminHome() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => adminService.metrics(),
  });

  const metrics = data?.metrics;

  return (
    <div>
      <PageHeader
        title="Métricas generales"
        description="Resumen en tiempo real de toda la plataforma Bismark."
      />

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {error instanceof ApiError ? error.message : 'No se pudieron cargar las métricas.'}
          </CardContent>
        </Card>
      )}

      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const value = metrics[m.key];
            return (
              <Card key={m.key} className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', m.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tracking-tight tabular-nums">
                      {m.money ? formatMXN(value) : value.toLocaleString('es-MX')}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">{m.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
