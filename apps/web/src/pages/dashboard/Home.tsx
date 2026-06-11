import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Receipt,
  CheckCircle2,
  Ticket,
  Wallet,
  Megaphone,
  CalendarClock,
  Plus,
  ExternalLink,
  FileBarChart,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { formatMXN } from '@bismark/shared';
import { raffleService } from '@/services/raffles';
import { riferoService } from '@/services/riferos';
import { useAuthStore } from '@/store/auth';
import { PageLoader } from '@/components/ui/misc';
import { PanelHeader, StatTile, SectionLabel, PANEL_CARD } from '@/components/owner/PanelKit';
import { cn } from '@/lib/cn';

const QUICK_ACTIONS: { to: string; label: string; icon: LucideIcon; accent?: boolean }[] = [
  { to: '/panel/admin/rifas/nueva', label: 'Nueva rifa', icon: Plus, accent: true },
  { to: '/panel/admin/ordenes', label: 'Órdenes', icon: Receipt },
  { to: '/panel', label: 'Ver mi página', icon: ExternalLink },
  { to: '/panel/admin/reportes', label: 'Reportes', icon: FileBarChart },
];

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'rifero';

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: raffleService.dashboardSummary,
  });

  const profileQuery = useQuery({
    queryKey: ['rifero-me'],
    queryFn: riferoService.me,
  });

  const summary = summaryQuery.data?.summary;
  const hasActivePlan = profileQuery.data?.profile.hasActivePlan ?? true;

  return (
    <div>
      <PanelHeader title={`Hola, ${firstName}`} description="Este es el resumen de tus rifas." />

      {!profileQuery.isLoading && !hasActivePlan && (
        <Link to="/panel/admin/plan" className="mb-5 block">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-[0_12px_28px_-18px_rgba(180,120,0,0.35)] transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/90 text-amber-950">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">Activa un plan para publicar</p>
              <p className="text-sm opacity-90">Tu página está lista, pero necesitas un plan para recibir compradores.</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </div>
        </Link>
      )}

      {summaryQuery.isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={Receipt}
              label="Órdenes pendientes"
              value={summary?.pendingOrders ?? 0}
              to="/panel/admin/ordenes/pendientes"
              accent
            />
            <StatTile icon={CheckCircle2} label="Órdenes pagadas" value={summary?.paidOrders ?? 0} />
            <StatTile icon={Ticket} label="Boletos vendidos" value={summary?.soldTickets ?? 0} />
            <StatTile icon={Wallet} label="Ingresos estimados" value={formatMXN(summary?.estimatedRevenue ?? 0)} />
            <StatTile icon={Megaphone} label="Rifas activas" value={summary?.activeRaffles ?? 0} />
            <StatTile icon={CalendarClock} label="Próximos sorteos" value={summary?.upcomingDraws ?? 0} />
          </div>

          <SectionLabel>Accesos rápidos</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className={cn(
                    'flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 active:translate-y-0',
                    action.accent
                      ? 'rounded-2xl border border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : PANEL_CARD,
                  )}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                      action.accent ? 'bg-white/20' : 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="truncate text-sm font-bold">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
