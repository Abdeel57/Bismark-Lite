import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Ticket,
  Sparkles,
  ArrowRight,
  Check,
  MessageCircle,
  Smartphone,
  Wallet,
  Trophy,
  Palette,
  ShieldCheck,
  BadgeCheck,
  Star,
  ChevronDown,
  Crown,
  Zap,
  PartyPopper,
  CalendarCheck,
} from 'lucide-react';
import { formatMXN, type PlanDTO } from '@bismark/shared';
import { planService } from '@/services/plans';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { useInView } from '@/hooks/useInView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';

// Revela hijos al entrar al viewport.
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={cn(inView ? 'animate-reveal' : 'opacity-0', className)}
      style={inView ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

const WORD = (n: string) => (
  <span className="relative whitespace-nowrap text-brand-gold">
    {n}
    <svg className="absolute -bottom-2 left-0 h-3 w-full" viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden>
      <path d="M2 8 Q 30 2, 60 7 T 118 6" fill="none" stroke="#ffb627" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </span>
);

// ── Mockup de teléfono (pieza central del hero) ──────────────
function PhoneMockup() {
  const ticketColors = [
    '#3b63ff', '#22c55e', '#22c55e', '#eab308', '#3b63ff', '#22c55e',
    '#22c55e', '#3b63ff', '#22c55e', '#22c55e', '#eab308', '#22c55e',
    '#3b63ff', '#22c55e', '#ffb627', '#22c55e', '#22c55e', '#3b63ff',
  ];
  return (
    <div className="relative mx-auto w-[270px] sm:w-[300px]">
      {/* Glow detrás */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-brand/40 blur-[70px] animate-glow" />

      {/* Stub flotante: ganador */}
      <div className="absolute -left-12 top-16 z-20 hidden rotate-[-8deg] animate-float-slow sm:block">
        <div className="flex items-center gap-2 rounded-xl border border-brand-gold/30 bg-[#0d1426]/90 px-3 py-2 shadow-2xl backdrop-blur">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gold/20 text-brand-gold">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gold">¡Ganaste!</p>
            <p className="font-ticket text-xs text-white">Boleto 0427</p>
          </div>
        </div>
      </div>

      {/* Stub flotante: monto */}
      <div className="absolute -right-8 bottom-24 z-20 hidden rotate-[7deg] animate-float sm:block">
        <div className="rounded-xl border border-white/10 bg-[#0d1426]/90 px-3 py-2 shadow-2xl backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Recaudado hoy</p>
          <p className="font-ticket text-base font-bold text-emerald-400">$24,500</p>
        </div>
      </div>

      {/* Cuerpo del teléfono */}
      <div className="relative rounded-[2.6rem] border border-white/10 bg-[#0b1120] p-2.5 shadow-[0_30px_80px_-20px_rgba(39,81,251,0.6)]">
        <div className="overflow-hidden rounded-[2.1rem] bg-[#0e1424]">
          {/* Notch */}
          <div className="relative h-7 bg-[#0e1424]">
            <div className="absolute left-1/2 top-1.5 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
          </div>
          {/* Cover de la rifa */}
          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand via-brand-deep to-[#0b1120]">
            <div className="grain absolute inset-0 opacity-20" />
            <Smartphone className="absolute right-3 top-3 h-16 w-16 rotate-12 text-white/15" />
            <div className="absolute bottom-3 left-3">
              <span className="rounded-md bg-brand-gold px-2 py-0.5 font-ticket text-[10px] font-bold text-[#1a1300]">
                E1 · RIFA ACTIVA
              </span>
            </div>
          </div>
          {/* Contenido */}
          <div className="space-y-3 p-3.5">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-sm font-bold text-white">iPhone 15 Pro Max</h3>
              <BadgeCheck className="h-3.5 w-3.5 text-brand-electric" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-ticket text-lg font-bold text-white">$50</span>
              <span className="text-[10px] text-white/50">por boleto</span>
            </div>
            {/* Progreso */}
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-white/60">
                <span className="font-ticket">350/1000 vendidos</span>
                <span>35%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[35%] rounded-full bg-gradient-to-r from-brand-electric to-brand-gold" />
              </div>
            </div>
            {/* Mini grid de boletos */}
            <div className="grid grid-cols-6 gap-1">
              {ticketColors.map((c, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[3px]"
                  style={{ backgroundColor: c, opacity: c === '#3b63ff' ? 1 : 0.9 }}
                />
              ))}
            </div>
            {/* WhatsApp */}
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-[11px] font-semibold text-white">
              <MessageCircle className="h-3.5 w-3.5" />
              Apartar por WhatsApp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Datos de contenido ───────────────────────────────────────
const BENEFITS = [
  { icon: Palette, title: 'Crea tu página de rifas', desc: 'Tu marca, tus colores, tu logo. Una página que se siente 100% tuya.' },
  { icon: Smartphone, title: 'Administra desde el celular', desc: 'Controla boletos, órdenes y pagos sin estar pegado a la compu.' },
  { icon: MessageCircle, title: 'Recibe órdenes por WhatsApp', desc: 'Mensajes prellenados con folio, boletos y total. Cero fricción.' },
  { icon: Wallet, title: 'Controla pagos manuales', desc: 'Transferencia o depósito directo a ti. Confirma con un toque.' },
  { icon: Ticket, title: 'Entrega boletos digitales', desc: 'PDF con QR verificable. Tu comprador descarga su boleto al instante.' },
  { icon: Trophy, title: 'Sorteos con tómbola digital', desc: 'Varios ganadores, aleatorio y transparente. Publica si quieres.' },
  { icon: ShieldCheck, title: 'Más confianza, más ventas', desc: 'Palomita de verificación y una página profesional que da seguridad.' },
  { icon: Zap, title: 'Publica según tu plan', desc: 'Sube de plan cuando crezcas. Sin amarres, cancela cuando quieras.' },
];

const STEPS = [
  { t: 'Regístrate gratis', d: 'Crea tu cuenta en segundos, sin tarjeta.' },
  { t: 'Crea tu perfil de rifero', d: 'Nombre, logo, redes y tu subdominio propio.' },
  { t: 'Personaliza tu página', d: 'Colores, portada e instrucciones de pago.' },
  { t: 'Crea tu evento/rifa', d: 'Premio, precio, boletos y fecha del sorteo.' },
  { t: 'Visualiza cómo quedará', d: 'Una vista previa real antes de publicar.' },
  { t: 'Activa un plan', d: 'Elige el que va con tu volumen de ventas.' },
  { t: 'Publica y vende', d: 'Comparte tu link y empieza a recibir compradores.' },
];

const FAQS = [
  { q: '¿Necesito saber de tecnología?', a: 'No. Bismark está pensado para que cualquier persona arme su página y administre sus rifas desde el celular, sin complicaciones.' },
  { q: '¿Bismark cobra comisión por boleto?', a: 'No. Pagas una mensualidad según tu plan y el dinero de tus boletos llega directo a ti. Sin comisiones por venta.' },
  { q: '¿Cómo reciben el pago mis compradores?', a: 'Configuras tus datos (transferencia o depósito) y el comprador te paga directo. Tú confirmas el pago desde tu panel.' },
  { q: '¿Mis compradores necesitan cuenta?', a: 'No. Pueden apartar sus boletos sin registrarse y descargar su boleto digital al instante.' },
  { q: '¿Puedo personalizar mi página?', a: 'Sí. Logo, portada, colores, descripción, redes y tu propio subdominio tunombre.bismark.com.' },
  { q: '¿Cómo se hace el sorteo?', a: 'Con la tómbola digital, de forma aleatoria entre boletos pagados. Puedes tener varios ganadores y publicarlos si quieres.' },
];

const PLAN_META: Record<string, { ideal: string; icon: typeof Crown; popular?: boolean }> = {
  basico: { ideal: 'Para tu primera rifa profesional', icon: Sparkles },
  pro: { ideal: 'Para vender de forma frecuente', icon: Zap, popular: true },
  verificado: { ideal: 'Para riferos serios con más volumen', icon: Crown },
};

const FALLBACK_PLANS: Pick<PlanDTO, 'name' | 'slug' | 'price' | 'features'>[] = [
  { name: 'Plan Básico', slug: 'basico', price: 499, features: ['1 rifa activa', 'Hasta 500 boletos', 'Página personalizada', 'Subdominio propio', 'Boleto digital', 'Pagos manuales'] },
  { name: 'Plan Pro', slug: 'pro', price: 999, features: ['Hasta 5 rifas activas', 'Hasta 3,000 boletos', 'Subida de comprobantes', 'Varios ganadores', 'Reportes Excel y PDF', 'Mensajes de WhatsApp'] },
  { name: 'Plan Verificado', slug: 'verificado', price: 1999, features: ['Hasta 15 rifas activas', 'Hasta 10,000 boletos', 'Palomita azul de verificación', 'Tómbola digital', 'Publicación de ganadores', 'Personalización premium'] },
];

// ── Página ───────────────────────────────────────────────────
export default function Landing() {
  useDocumentTitle('Bismark — Crea tu página de rifas');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { data } = useQuery({ queryKey: ['plans'], queryFn: planService.list });
  const plans = data?.items?.length ? data.items : FALLBACK_PLANS;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b18]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-brand/40">B</span>
            Bismark
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
            <a href="#beneficios" className="transition-colors hover:text-white">Beneficios</a>
            <a href="#como" className="transition-colors hover:text-white">Cómo funciona</a>
            <a href="#planes" className="transition-colors hover:text-white">Planes</a>
            <a href="#faq" className="transition-colors hover:text-white">Preguntas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden text-sm font-semibold text-white/80 transition-colors hover:text-white sm:block">
              Entrar
            </Link>
            <Button asChild variant="brand" size="sm" className="rounded-full">
              <Link to="/registro">Crear mi página</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO (lienzo oscuro) ── */}
      <section className="relative overflow-hidden bg-[#070b18] text-white">
        {/* Mesh de gradientes */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/30 blur-[120px]" />
          <div className="absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-brand-deep/40 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-gold/10 blur-[100px]" />
        </div>
        {/* Cuadrícula sutil */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '46px 46px' }}
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-[0.15]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 lg:grid-cols-2 lg:gap-6 lg:pb-28 lg:pt-20">
          {/* Columna texto */}
          <div className="text-center lg:text-left">
            <div className="animate-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-gold" />
              </span>
              Hecho en México 🇲🇽 · Para riferos
            </div>

            <h1 className="animate-reveal font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl" style={{ animationDelay: '80ms' }}>
              Crea tu propia
              <br />
              página de {WORD('rifas')}
              <br />
              <span className="text-gradient-brand">desde el celular</span>
            </h1>

            <p className="animate-reveal mx-auto mt-6 max-w-md text-base leading-relaxed text-white/70 lg:mx-0 sm:text-lg" style={{ animationDelay: '160ms' }}>
              Ten tu página personalizada, recibe órdenes, controla boletos, confirma pagos y organiza sorteos de forma profesional. Todo en un solo lugar.
            </p>

            <div className="animate-reveal mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start" style={{ animationDelay: '240ms' }}>
              <Button asChild variant="brand" size="xl" className="w-full rounded-full shadow-[0_10px_40px_-8px_rgba(39,81,251,0.8)] sm:w-auto">
                <Link to="/registro">
                  Crear mi página de rifas <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto">
                <Link to="/planes">Ver planes</Link>
              </Button>
            </div>

            <div className="animate-reveal mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/55 lg:justify-start" style={{ animationDelay: '320ms' }}>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Sin comisión por boleto</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Pagas mensual</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Cancela cuando quieras</span>
            </div>
          </div>

          {/* Columna mockup */}
          <div className="animate-reveal" style={{ animationDelay: '200ms' }}>
            <PhoneMockup />
          </div>
        </div>

        {/* Marquee inferior */}
        <div className="relative border-y border-white/10 bg-white/[0.03] py-3.5">
          <div className="marquee-fade overflow-hidden">
            <div className="flex w-max animate-marquee gap-8 pr-8">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex shrink-0 items-center gap-8 font-ticket text-sm font-bold uppercase tracking-wider text-white/40">
                  {['Boletos digitales', '★', 'Pagos directos', '★', 'Tómbola digital', '★', 'Reportes Excel y PDF', '★', 'WhatsApp', '★', 'Subdominio propio', '★', 'Verificación azul', '★'].map((w, i) => (
                    <span key={i} className={w === '★' ? 'text-brand-gold' : ''}>{w}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-b bg-background">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-10 sm:grid-cols-4">
          {[
            { n: '100%', l: 'Tuyo el dinero' },
            { n: '3', l: 'Planes accesibles' },
            { n: '10,000', l: 'Boletos por rifa' },
            { n: '24/7', l: 'Vende sin parar' },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 80} className="text-center">
              <p className="font-display text-3xl font-extrabold text-brand sm:text-4xl">{s.n}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section id="beneficios" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 font-ticket text-sm font-bold uppercase tracking-widest text-brand">Todo incluido</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Una plataforma completa para organizar rifas como profesional
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 70}>
              <div className="group relative h-full overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como" className="border-y bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
          <Reveal className="mb-12 text-center">
            <p className="mb-2 font-ticket text-sm font-bold uppercase tracking-widest text-brand">7 pasos</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">De cero a tu primera rifa publicada</h2>
          </Reveal>
          <div className="relative">
            <div className="absolute bottom-4 left-[1.45rem] top-4 w-px bg-gradient-to-b from-brand via-brand/40 to-transparent sm:left-7" />
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <Reveal key={s.t} delay={i * 50}>
                  <div className="flex items-start gap-4">
                    <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border bg-card font-ticket text-lg font-bold text-brand shadow-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 rounded-2xl border bg-card p-4">
                      <h3 className="font-display font-bold">{s.t}</h3>
                      <p className="text-sm text-muted-foreground">{s.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANES (boletos) ── */}
      <section id="planes" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 font-ticket text-sm font-bold uppercase tracking-widest text-brand">Planes mensuales</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Elige tu boleto de entrada</h2>
          <p className="mt-3 text-muted-foreground">Precios accesibles. Sin comisión por boleto. Cambia de plan cuando crezcas.</p>
        </Reveal>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const meta = PLAN_META[plan.slug] ?? { ideal: '', icon: Sparkles };
            const Icon = meta.icon;
            const popular = meta.popular;
            return (
              <Reveal key={plan.slug} delay={i * 90}>
                <div
                  className={cn(
                    'relative rounded-3xl border p-7 transition-all',
                    popular
                      ? 'border-brand bg-card shadow-2xl shadow-brand/20 lg:-translate-y-3 lg:scale-[1.03]'
                      : 'border-border bg-card hover:-translate-y-1 hover:shadow-xl',
                  )}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 font-ticket text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-brand/40">
                      ★ Más popular
                    </span>
                  )}
                  <div className="mb-5 flex items-center gap-3">
                    <div className={cn('grid h-10 w-10 place-items-center rounded-xl', popular ? 'bg-brand text-white' : 'bg-brand/10 text-brand')}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold leading-none">{plan.name.replace('Plan ', '')}</h3>
                      <p className="text-xs text-muted-foreground">{meta.ideal}</p>
                    </div>
                  </div>

                  <div className="mb-1 flex items-end gap-1">
                    <span className="font-display text-4xl font-extrabold tracking-tight">{formatMXN(plan.price)}</span>
                    <span className="mb-1 text-sm text-muted-foreground">/mes</span>
                  </div>

                  {/* Línea perforada de boleto */}
                  <div className="my-5 border-t border-dashed border-border" />

                  <ul className="space-y-2.5">
                    {plan.features.slice(0, 7).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full', popular ? 'bg-brand text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400')}>
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild size="lg" variant={popular ? 'brand' : 'outline'} className="mt-7 w-full rounded-full">
                    <Link to="/registro">Empezar con {plan.name.replace('Plan ', '')}</Link>
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
          La activación inicial de tu plan la realiza el equipo Bismark de forma manual desde el panel.
          Creas y configuras todo gratis; activas un plan cuando estés listo para publicar.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-y bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
          <Reveal className="mb-10 text-center">
            <p className="mb-2 font-ticket text-sm font-bold uppercase tracking-widest text-brand">Preguntas frecuentes</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Lo que quieres saber</h2>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={f.q} delay={i * 40}>
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="font-display font-bold">{f.q}</span>
                      <ChevronDown className={cn('h-5 w-5 shrink-0 text-brand transition-transform', open && 'rotate-180')} />
                    </button>
                    <div className={cn('grid transition-all duration-300', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-background px-4 py-20 sm:py-24">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-[#070b18] px-6 py-16 text-center text-white sm:px-12">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand/40 blur-[90px]" />
              <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-brand-gold/15 blur-[90px]" />
            </div>
            <div className="grain pointer-events-none absolute inset-0 opacity-10" />
            <div className="relative">
              <PartyPopper className="mx-auto mb-5 h-10 w-10 text-brand-gold" />
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Crea tu página de rifas profesional con Bismark
              </h2>
              <p className="mx-auto mt-4 max-w-md text-white/70">
                Empieza gratis hoy. Arma tu página, crea tu rifa y mira cómo queda antes de publicar.
              </p>
              <Button asChild variant="brand" size="xl" className="mt-8 rounded-full shadow-[0_10px_50px_-8px_rgba(39,81,251,0.9)]">
                <Link to="/registro">
                  Crear mi página gratis <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/50">
                <CalendarCheck className="h-4 w-4" /> Sin tarjeta · Listo en minutos
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#070b18] text-white/60">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <div className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold text-white">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white">B</span>
                Bismark
              </div>
              <p className="text-sm">La forma más fácil de organizar tus rifas y sorteos desde el celular.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
              <div className="space-y-2">
                <p className="mb-1 font-semibold text-white">Producto</p>
                <a href="#beneficios" className="block transition-colors hover:text-white">Beneficios</a>
                <a href="#como" className="block transition-colors hover:text-white">Cómo funciona</a>
                <Link to="/planes" className="block transition-colors hover:text-white">Planes</Link>
              </div>
              <div className="space-y-2">
                <p className="mb-1 font-semibold text-white">Cuenta</p>
                <Link to="/login" className="block transition-colors hover:text-white">Entrar</Link>
                <Link to="/registro" className="block transition-colors hover:text-white">Crear página</Link>
                <span className="flex items-center gap-1.5"><Star className="h-3 w-3 text-brand-gold" /> Hecho en México</span>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs sm:flex-row">
            <p>© {new Date().getFullYear()} Bismark. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
