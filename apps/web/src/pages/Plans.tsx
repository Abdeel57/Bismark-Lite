import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, X, Star, Info, ArrowRight } from 'lucide-react';
import { formatMXN } from '@bismark/shared';
import type { PlanDTO } from '@bismark/shared';
import { planService } from '@/services/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/misc';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { cn } from '@/lib/cn';

// ── Capacidades del plan (booleans) en texto legible ────────
const CAPABILITIES: { key: keyof PlanDTO; label: string }[] = [
  { key: 'allowProofUpload', label: 'Subida de comprobantes de pago' },
  { key: 'allowMultipleWinners', label: 'Sorteos con varios ganadores' },
  { key: 'allowReportsExcel', label: 'Reportes en Excel' },
  { key: 'allowReportsPdf', label: 'Reportes en PDF' },
  { key: 'allowVerificationBadge', label: 'Insignia de rifero verificado' },
  { key: 'allowDigitalDraw', label: 'Tómbola digital para el sorteo' },
];

function limitLabel(value: number, singular: string, plural: string): string {
  if (value <= 0) return 'Ilimitado';
  return `${value.toLocaleString('es-MX')} ${value === 1 ? singular : plural}`;
}

export type BillingPeriod = 'monthly' | 'yearly';

export function BillingToggle({
  value,
  onChange,
  className,
}: {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center rounded-full border bg-card p-1', className)}>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
          value === 'monthly' ? 'bg-brand text-white' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Mensual
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
          value === 'yearly' ? 'bg-brand text-white' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Anual
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            value === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600',
          )}
        >
          2 meses gratis
        </span>
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  popular,
  period,
}: {
  plan: PlanDTO;
  popular: boolean;
  period: BillingPeriod;
}) {
  const yearly = period === 'yearly' && plan.priceYearly != null;
  const savings = yearly ? plan.price * 12 - (plan.priceYearly ?? 0) : 0;
  return (
    <Card
      className={cn(
        'relative flex flex-col overflow-hidden',
        popular ? 'border-brand shadow-xl shadow-brand/20 ring-2 ring-brand' : 'shadow-sm',
      )}
    >
      {popular && (
        <div className="absolute right-4 top-4">
          <Badge className="bg-brand text-white">
            <Star className="h-3 w-3" /> Más popular
          </Badge>
        </div>
      )}
      <CardContent className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-extrabold tracking-tight">{plan.name}</h3>
        <div className="mt-3 flex items-end gap-1">
          <span className="text-4xl font-extrabold tracking-tight">
            {formatMXN(yearly ? (plan.priceYearly ?? plan.price) : plan.price)}
          </span>
          <span className="mb-1 text-sm text-muted-foreground">{yearly ? '/ año' : '/ mes'}</span>
        </div>
        {yearly && savings > 0 && (
          <p className="mt-1.5 text-sm font-medium text-emerald-600">
            Equivale a {formatMXN(Math.round((plan.priceYearly ?? 0) / 12))} al mes · ahorras{' '}
            {formatMXN(savings)} al año
          </p>
        )}

        {/* Límites */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Rifas activas</p>
            <p className="text-sm font-bold">{limitLabel(plan.maxActiveRaffles, 'rifa', 'rifas')}</p>
          </div>
          <div className="rounded-xl bg-muted px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Boletos por rifa</p>
            <p className="text-sm font-bold">
              {limitLabel(plan.maxTicketsPerRaffle, 'boleto', 'boletos')}
            </p>
          </div>
        </div>

        {/* Features del plan */}
        {plan.features.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-foreground/90">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Capacidades (incluido / no incluido) */}
        <div className="mt-6 border-t pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Funciones
          </p>
          <ul className="space-y-2.5">
            {CAPABILITIES.map((cap) => {
              const enabled = Boolean(plan[cap.key]);
              return (
                <li
                  key={cap.key}
                  className={cn(
                    'flex items-start gap-2.5 text-sm',
                    enabled ? 'text-foreground/90' : 'text-muted-foreground/70',
                  )}
                >
                  {enabled ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={cn(!enabled && 'line-through')}>{cap.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex-1" />
        <Button asChild variant={popular ? 'brand' : 'outline'} size="lg" className="mt-7 w-full">
          <Link to="/registro">Crear mi página</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PlanSkeleton() {
  return (
    <Card className="flex flex-col p-6">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-4 h-10 w-36" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <Skeleton className="mt-6 h-12 w-full" />
    </Card>
  );
}

export default function Plans() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.list,
  });
  const plans = data?.items ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          </Button>
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-12 sm:py-16">
        {/* ── Encabezado ── */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Planes para cada rifero
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Elige el plan que se ajusta a tus rifas. Puedes cambiar de plan cuando lo necesites.
          </p>
          <BillingToggle value={period} onChange={setPeriod} className="mt-6" />
        </div>

        {/* ── Tarjetas ── */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <PlanSkeleton key={i} />)
            : plans.map((plan, i) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  popular={plans.length === 3 ? i === 1 : false}
                  period={period}
                />
              ))}
        </div>

        {/* ── Aviso de activación manual ── */}
        <div className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div>
            <p className="font-semibold">La activación inicial es personalizada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando eliges un plan, el equipo Bismark lo activa de forma manual desde el panel. Así
              nos aseguramos de que tu página quede lista y sin contratiempos antes de publicar tus
              rifas.
            </p>
          </div>
        </div>

        {/* ── Ideal para ── */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border bg-card p-6 text-center">
          <h2 className="text-lg font-bold">¿No sabes cuál elegir?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            El plan básico es ideal para tus primeras rifas y para probar la plataforma, aunque tiene
            límites en la cantidad de rifas activas y boletos, y no incluye todas las funciones
            avanzadas. El plan intermedio es perfecto si ya vendes con frecuencia, y el plan superior
            está pensado para riferos con alto volumen que quieren todas las funciones, reportes e
            insignia de verificado.
          </p>
        </div>

        {/* ── CTA ── */}
        <div className="mt-12 text-center">
          <Button asChild variant="brand" size="xl">
            <Link to="/registro">
              Crear mi página <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            Regístrate gratis y elige tu plan cuando estés listo.
          </p>
        </div>
      </main>
    </div>
  );
}
