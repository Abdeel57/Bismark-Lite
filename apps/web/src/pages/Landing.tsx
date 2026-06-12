import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Ticket,
  Sparkles,
  ArrowRight,
  Check,
  MessageCircle,
  Wallet,
  Trophy,
  BadgeCheck,
  Star,
  ChevronDown,
  Crown,
  Zap,
  CalendarCheck,
} from 'lucide-react';
import { formatMXN, type PlanDTO } from '@bismark/shared';
import { planService } from '@/services/plans';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { VerifiedBadge } from '@/components/brand/VerifiedBadge';
import { LogoMark } from '@/components/brand/LogoMark';
import { useInView } from '@/hooks/useInView';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { WhatsappIcon } from '@/components/brand/SocialIcons';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';

// ── Tokens del concepto "Boleto Bismark" ─────────────────────
// Identidad oficial (bismarkdigital.com): blanco/tinta + azul eléctrico, tintes
// azul suave en secciones claras, menta como acento y seriales en Space Mono.
const PAPER = 'bg-[#F5F7FF] dark:bg-background';
const PAPER_CARD = 'bg-white dark:bg-card';
const PAPER_BORDER = 'border-[#E3E9F8] dark:border-border';
const DEMO_URL = '/r/rifasdelasuerte';

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

// Etiqueta de sección estilo folio de boleto.
function Folio({ n, label, dark = false }: { n: string; label: string; dark?: boolean }) {
  return (
    <p
      className={cn(
        'mb-3 inline-flex items-center gap-2 font-ticket text-xs font-bold uppercase tracking-[0.25em]',
        dark ? 'text-brand-mint' : 'text-brand',
      )}
    >
      <span className={cn('h-px w-8', dark ? 'bg-brand-mint/60' : 'bg-brand/50')} />
      Folio {n} — {label}
    </p>
  );
}

// ── Burbuja flotante de WhatsApp: dudas de prospectos directo al equipo ──
const BISMARK_WA = 'https://wa.me/5216629480105?text=' +
  encodeURIComponent('Hola 👋 Vengo de la página de Bismark y tengo una pregunta sobre el sistema de rifas.');

function WhatsAppFab() {
  const hidden = useHideOnScroll();
  return (
    <a
      href={BISMARK_WA}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={cn(
        'group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-[#25D366] py-3.5 pl-4 pr-4 text-white shadow-[0_14px_36px_-10px_rgba(37,211,102,0.65)] transition-all duration-300 hover:scale-105 active:scale-95 safe-bottom sm:pr-5',
        hidden && 'pointer-events-none translate-y-[150%] opacity-0',
      )}
    >
      <span className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/35" style={{ animationDuration: '3.2s' }} />
      <WhatsappIcon className="h-6 w-6" />
      <span className="hidden text-sm font-bold sm:inline">¿Dudas? Escríbenos</span>
    </a>
  );
}

// ── Boleto de rifa del titular: la palabra RIFAS dentro de un ticket rojo
// troquelado con talón y serial (referencia: boleto clásico de admisión).
function TicketWord() {
  return (
    <span className="ticket-float inline-block align-[-0.18em] drop-shadow-[0_10px_26px_rgba(211,47,47,0.45)]">
      <svg viewBox="0 0 200 64" className="h-[1.32em] w-auto" aria-label="rifas" role="img">
        <defs>
          <linearGradient id="tw-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E04040" />
            <stop offset="55%" stopColor="#D32F2F" />
            <stop offset="100%" stopColor="#B02323" />
          </linearGradient>
          <mask id="tw-teeth">
            <rect width="200" height="64" rx="9" fill="#fff" />
            {[10, 26, 42, 58].map((y) => (
              <g key={y}>
                <circle cx="0" cy={y} r="4.5" fill="#000" />
                <circle cx="200" cy={y} r="4.5" fill="#000" />
              </g>
            ))}
          </mask>
        </defs>
        {/* Cuerpo del boleto con dientes troquelados */}
        <rect width="200" height="64" rx="9" fill="url(#tw-red)" mask="url(#tw-teeth)" />
        {/* Marco interior */}
        <rect x="10" y="7" width="137" height="50" rx="6" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        {/* Línea punteada del talón */}
        <line x1="156" y1="7" x2="156" y2="57" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeDasharray="4 5" />
        {/* RIFAS en blanco */}
        <text
          x="78"
          y="33"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          style={{ font: '900 30px Archivo, Inter, sans-serif', fontStretch: '125%', letterSpacing: '1px' }}
        >
          RIFAS
        </text>
        {/* Serial rotado en el talón */}
        <text
          x="178"
          y="32"
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.9)"
          transform="rotate(90 178 32)"
          style={{ font: "700 13px 'Space Mono', monospace", letterSpacing: '1px' }}
        >
          578271
        </text>
      </svg>
    </span>
  );
}

// ── Teléfono con el producto REAL (captura de la página demo) ─
// Por defecto la isla dinámica vive en su propia barra de estado (no tapa el
// encabezado/logo de la captura). Con `overlayIsland` la isla flota sobre la
// imagen (look más limpio para el hero, donde la captura tiene aire arriba).
function PhoneReal({
  src,
  alt,
  className,
  overlayIsland = false,
}: {
  src: string;
  alt: string;
  className?: string;
  overlayIsland?: boolean;
}) {
  return (
    <div className={cn('overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#101216] p-2 shadow-[0_30px_80px_-20px_rgba(26,77,255,0.55)]', className)}>
      <div className="relative overflow-hidden rounded-[1.9rem] bg-[#15171c]">
        {overlayIsland ? (
          <div className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
        ) : (
          <div className="flex h-6 items-center justify-center bg-black">
            <div className="h-3.5 w-16 rounded-full bg-[#23262e] ring-1 ring-white/10" />
          </div>
        )}
        <img src={src} alt={alt} loading={overlayIsland ? 'eager' : 'lazy'} decoding="async" className="block w-full" />
      </div>
    </div>
  );
}

function HeroPhone() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[290px]">
      <div className="absolute -inset-10 -z-10 rounded-full bg-brand/40 blur-[70px] animate-glow" />

      {/* Stub flotante: ganador */}
      <div className="absolute -left-14 top-16 z-20 hidden rotate-[-8deg] animate-float-slow sm:block">
        <div className="ticket-edge flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-2xl">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-mint/30 text-[#067647]">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <p className="font-ticket text-[10px] font-bold uppercase tracking-wide text-[#067647]">¡Ganaste!</p>
            <p className="font-ticket text-xs font-bold text-brand-ink">Boleto 0427</p>
          </div>
        </div>
      </div>

      {/* Stub flotante: monto */}
      <div className="absolute -right-10 bottom-28 z-20 hidden rotate-[7deg] animate-float sm:block">
        <div className="rounded-xl border border-white/10 bg-[#101216]/90 px-3.5 py-2 shadow-2xl backdrop-blur">
          <p className="font-ticket text-[10px] font-semibold uppercase tracking-wide text-white/50">Recaudado hoy</p>
          <p className="font-ticket text-base font-bold text-emerald-400">$24,500</p>
        </div>
      </div>

      <PhoneReal src="/demo-rifero.webp?v=3" alt="Página real de un rifero hecha con Bismark" overlayIsland />

      <p className="mt-4 text-center text-xs text-white/45">
        Página real hecha con Bismark ·{' '}
        <a href={DEMO_URL} target="_blank" rel="noopener" className="font-semibold text-white/80 underline underline-offset-2 hover:text-white">
          explórala
        </a>
      </p>
    </div>
  );
}

// ── Mini-vistas de producto para el bento de beneficios ──────
// Conversación de WhatsApp: la orden llega sola (con "escribiendo…" vivo).
function MiniWhatsApp() {
  return (
    <div className="pointer-events-none mt-5 select-none rounded-2xl bg-[#E9F8EE] p-3 dark:bg-emerald-950/30" aria-hidden>
      <div className="max-w-[280px] rounded-2xl rounded-tl-md bg-white px-3 py-2.5 shadow-sm dark:bg-zinc-800">
        <p className="text-[11px] font-bold leading-snug">🎟️ Quiero apartar — GMC Denali · E2</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {['0045', '0112', '0309'].map((n) => (
            <span key={n} className="rounded-md border border-brand/30 bg-brand/5 px-1.5 py-0.5 font-ticket text-[10px] font-bold text-brand">
              {n}
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <p className="font-ticket text-[11px] font-bold">Total: $600 MXN</p>
          <span className="text-[9px] font-semibold text-sky-500">10:42 ✓✓</span>
        </div>
      </div>
      <div className="mt-2 flex w-fit items-center gap-1 rounded-2xl rounded-tl-md bg-white px-3 py-2.5 shadow-sm dark:bg-zinc-800">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

// Boleto digital oscuro con QR "escaneándose" y sello de pagado.
function MiniTicketQR() {
  return (
    <div className="ticket-edge pointer-events-none mt-5 flex select-none items-center gap-3 rounded-xl bg-brand-ink px-4 py-3.5 text-white" aria-hidden>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white p-1.5">
        <svg viewBox="0 0 56 56" className="h-full w-full text-brand-ink">
          <path fill="currentColor" d="M0 0h16v16H0zM40 0h16v16H40zM0 40h16v16H0z" />
          <path fill="#fff" d="M4 4h8v8H4zM44 4h8v8H44zM4 44h8v8H4z" />
          <path fill="currentColor" d="M6 6h4v4H6zM46 6h4v4H46zM6 46h4v4H6z" />
          {[[22, 2], [30, 2], [22, 10], [34, 10], [2, 22], [10, 22], [18, 22], [30, 22], [42, 22], [50, 22], [6, 30], [22, 30], [38, 30], [50, 30], [22, 38], [30, 38], [46, 38], [22, 46], [34, 46], [50, 46]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="5" height="5" fill="currentColor" />
          ))}
        </svg>
        <span className="qr-scan absolute inset-x-1 top-0 h-5 bg-gradient-to-b from-transparent via-brand-mint/70 to-transparent" />
      </div>
      <div className="min-w-0">
        <p className="font-ticket text-[11px] font-bold tracking-wide">BSK-7Q2F-0045</p>
        <p className="text-[10px] text-white/55">Boleto digital · GMC Denali E2</p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-mint px-2 py-0.5 font-ticket text-[9px] font-bold uppercase tracking-wide text-brand-ink">
          ✓ Pagado
        </span>
      </div>
    </div>
  );
}

// Tómbola: jaula girando con bolitas numeradas y trofeo al centro.
function MiniTombola() {
  return (
    <div className="pointer-events-none relative mx-auto mt-6 h-24 w-24 select-none" aria-hidden>
      <span className="drum-spin absolute inset-0 rounded-full border-[3px] border-dashed border-brand/45" />
      <span className="absolute inset-3 rounded-full border border-brand/15 bg-brand/5" />
      <span className="animate-float absolute -top-1 left-7 grid h-6 w-6 place-items-center rounded-full bg-brand font-ticket text-[9px] font-bold text-white shadow-md">
        07
      </span>
      <span
        className="animate-float absolute -right-1 top-9 grid h-6 w-6 place-items-center rounded-full bg-[#D32F2F] font-ticket text-[9px] font-bold text-white shadow-md"
        style={{ animationDelay: '0.6s' }}
      >
        23
      </span>
      <span
        className="animate-float absolute bottom-0 left-2 grid h-6 w-6 place-items-center rounded-full bg-brand-mint font-ticket text-[9px] font-bold text-brand-ink shadow-md"
        style={{ animationDelay: '1.1s' }}
      >
        45
      </span>
      <Trophy className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-brand" />
    </div>
  );
}

// Tarjeta de beneficio: icono con profundidad, número de folio discreto y
// mini-interfaz anclada abajo. Pausa sus animaciones cuando sale de pantalla
// (rendimiento en equipos modestos).
function BentoCard({
  item,
  index,
}: {
  item: { icon: typeof MessageCircle; title: string; desc: string; visual: ReactNode };
  index: number;
}) {
  const { ref, inView } = useInView();
  const Icon = item.icon;
  return (
    <div ref={ref} className={cn('h-full', inView ? 'animate-reveal' : 'opacity-0')} style={{ animationDelay: `${index * 80}ms` }}>
      <div
        className={cn(
          'group flex h-full flex-col rounded-3xl border p-6 transition-shadow duration-300 hover:shadow-[0_22px_50px_-24px_rgba(26,77,255,0.35)]',
          !inView && 'anim-paused',
          PAPER_CARD,
          PAPER_BORDER,
        )}
      >
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-electric to-brand-deep text-white shadow-[0_10px_22px_-10px_rgba(26,77,255,0.65)]">
            <Icon className="h-[22px] w-[22px]" strokeWidth={2.2} />
          </div>
          <span className="font-ticket text-[10px] font-bold tracking-[0.2em] text-muted-foreground/35">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <h3 className="mt-5 font-display text-lg font-extrabold tracking-tight">{item.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
        <div className="mt-auto">{item.visual}</div>
      </div>
    </div>
  );
}

// ── Datos de contenido ───────────────────────────────────────
// Tres beneficios protagonistas, cada uno con su mini-interfaz animada.
const BENTO = [
  {
    icon: MessageCircle,
    title: 'Recibe órdenes por WhatsApp',
    desc: 'Tu comprador aparta y te llega el mensaje con folio, boletos y total. Cero capturas a mano.',
    visual: <MiniWhatsApp />,
  },
  {
    icon: Ticket,
    title: 'Boletos digitales con QR',
    desc: 'Cada pago confirmado genera un boleto verificable que tu comprador descarga al instante.',
    visual: <MiniTicketQR />,
  },
  {
    icon: Trophy,
    title: 'Tómbola digital',
    desc: 'Sorteos aleatorios y transparentes entre boletos pagados, con varios ganadores si quieres.',
    visual: <MiniTombola />,
  },
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

// JSON-LD del FAQ para resultados enriquecidos en Google.
const FAQ_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

// ── Página ───────────────────────────────────────────────────
export default function Landing() {
  useDocumentTitle('Bismark — Crea tu página de rifas');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { data } = useQuery({ queryKey: ['plans'], queryFn: planService.list });
  const plans = data?.items?.length ? data.items : FALLBACK_PLANS;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_LD }} />

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-ink/85 backdrop-blur-xl">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand/70 to-transparent" />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
            <LogoMark variant="white" className="h-8 w-8" />
            Bismark
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
            <a href="#beneficios" className="transition-colors hover:text-white">Beneficios</a>
            <a href="#como" className="transition-colors hover:text-white">Cómo funciona</a>
            <a href="#planes" className="transition-colors hover:text-white">Planes</a>
            <a href={DEMO_URL} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-mint" /> Ejemplo en vivo
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-semibold text-white/80 transition-colors hover:text-white">
              Entrar
            </Link>
            <Button asChild variant="brand" size="sm" className="rounded-full">
              <Link to="/registro">Crear mi página</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO (tinta) ── */}
      <section className="relative overflow-hidden bg-brand-ink text-white">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/30 blur-[120px]" />
          <div className="absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-brand-deep/40 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-mint/10 blur-[100px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '46px 46px' }}
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-[0.15]" />
        {/* Serial gigante decorativo */}
        <p className="pointer-events-none absolute -right-6 top-24 hidden select-none font-ticket text-[9rem] font-bold leading-none text-white/[0.04] lg:block" aria-hidden>
          Nº001
        </p>

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-10 lg:grid-cols-[1.05fr,0.95fr] lg:gap-6 lg:pb-16 lg:pt-14">
          <div className="text-center lg:text-left">
            <div className="animate-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-mint opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-mint" />
              </span>
              Hecho en México 🇲🇽 · Para riferos
            </div>

            <h1
              className="animate-reveal font-wide text-[1.7rem] font-black uppercase leading-[1.08] tracking-tight sm:text-[2.7rem] lg:text-[3rem]"
              style={{ animationDelay: '80ms', fontStretch: '125%' }}
            >
              Crea tu propia
              <br />
              página de{' '}
              <TicketWord />
              <br />
              <span className="text-gradient-brand">desde el celular</span>
            </h1>

            <p className="animate-reveal mx-auto mt-6 max-w-md text-base leading-relaxed text-white/70 lg:mx-0 sm:text-lg" style={{ animationDelay: '160ms' }}>
              Ten tu página personalizada, recibe órdenes, controla boletos, confirma pagos y organiza sorteos de forma profesional. Todo en un solo lugar.
            </p>

            <div className="animate-reveal mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start" style={{ animationDelay: '240ms' }}>
              <Button asChild variant="brand" size="xl" className="w-full rounded-full shadow-[0_10px_40px_-8px_rgba(26,77,255,0.8)] sm:w-auto">
                <Link to="/registro">
                  Crear mi página de rifas <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto">
                <a href={DEMO_URL} target="_blank" rel="noopener">
                  Mira una página de ejemplo
                </a>
              </Button>
            </div>

            <div className="animate-reveal mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/55 lg:justify-start" style={{ animationDelay: '320ms' }}>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Sin comisión por boleto</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Pagas mensual</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Cancela cuando quieras</span>
            </div>
          </div>

          <div className="animate-reveal" style={{ animationDelay: '200ms' }}>
            <HeroPhone />
          </div>
        </div>

        {/* Marquee inferior */}
        <div className="relative border-y border-white/10 bg-white/[0.03] py-3.5">
          <div className="marquee-fade overflow-hidden">
            <div className="flex w-max animate-marquee gap-8 pr-8">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex shrink-0 items-center gap-8 font-ticket text-sm font-bold uppercase tracking-wider text-white/40">
                  {['Boletos digitales', '★', 'Pagos directos', '★', 'Tómbola digital', '★', 'Reportes Excel y PDF', '★', 'WhatsApp', '★', 'Subdominio propio', '★', 'Verificación azul', '★'].map((w, i) => (
                    <span key={i} className={w === '★' ? 'text-brand-mint' : ''}>{w}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TALÓN DE STATS (boleto perforado que se encima al hero) ── */}
      <section className={cn('relative px-4', PAPER)}>
        <Reveal className="relative z-10 mx-auto -mt-0 max-w-4xl translate-y-0 lg:-mt-8">
          <div className="ticket-edge mt-6 grid grid-cols-2 gap-y-6 rounded-2xl bg-white px-8 py-7 shadow-[0_18px_50px_-18px_rgba(13,20,43,0.35)] dark:bg-card sm:grid-cols-4 lg:mt-0">
            {[
              { n: '0%', l: 'Comisión por boleto' },
              { n: '100%', l: 'Del dinero directo a ti' },
              { n: '10,000', l: 'Boletos por rifa' },
              { n: '24/7', l: 'Tu página vende sola' },
            ].map((s, i) => (
              <div key={s.l} className={cn('text-center', i > 0 && 'sm:border-l sm:border-dashed', PAPER_BORDER)}>
                <p className="font-ticket text-3xl font-bold tracking-tight text-brand sm:text-4xl">{s.n}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">{s.l}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── SHOWCASE: el producto real ── */}
      <section className={cn('relative overflow-hidden', PAPER)}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-14 lg:grid-cols-2">
          <Reveal>
            <Folio n="01" label="El producto" />
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Así se ve una página hecha con Bismark
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground sm:text-lg">
              No es un dibujo: es una página real, corriendo ahora mismo. Portada, marca, boletos en vivo,
              cuenta regresiva al sorteo y órdenes por WhatsApp.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {['Tu logo, tus colores y tu subdominio', 'Tu rifa con cuenta regresiva al sorteo', 'Boletera para apartar y pagos por WhatsApp'].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Button asChild variant="brand" size="lg" className="mt-8 rounded-full">
              <a href={DEMO_URL} target="_blank" rel="noopener">
                Explorar la página demo <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </Reveal>

          <Reveal delay={120} className="relative">
            <div className="relative mx-auto flex max-w-md items-end justify-center gap-4">
              <PhoneReal src="/demo-rifa.webp?v=4" alt="Página de la rifa con cuenta regresiva al sorteo" className="w-1/2 rotate-[-3deg]" />
              <PhoneReal src="/demo-boletera.webp?v=3" alt="Boletera de la rifa: el comprador elige y aparta sus números" className="w-1/2 translate-y-6 rotate-[4deg]" />
            </div>
            <p className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-ticket text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
              ★ Páginas reales · sin retoques ★
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── ADMINISTRADOR: así de sencillo se maneja ── */}
      <section className={cn('relative overflow-hidden border-t', PAPER, PAPER_BORDER)}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-14 lg:grid-cols-2">
          {/* Teléfonos primero en desktop (alterna el ritmo con el showcase) */}
          <Reveal delay={120} className="relative order-last lg:order-first">
            <div className="relative mx-auto flex max-w-md items-end justify-center gap-4">
              <div className="absolute -inset-10 -z-10 rounded-full bg-brand/15 blur-[70px]" />
              <PhoneReal
                src="/demo-admin.webp?v=3"
                alt="Administrador de Bismark: primeros pasos, cobros e ingresos"
                className="w-1/2 rotate-[-3deg]"
              />
              <PhoneReal
                src="/demo-ordenes.webp?v=3"
                alt="Órdenes por cobrar: confirma cada pago con un toque"
                className="w-1/2 translate-y-6 rotate-[4deg]"
              />
            </div>
            <p className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-ticket text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
              ★ Tu administrador real ★
            </p>
          </Reveal>

          <Reveal>
            <Folio n="02" label="El administrador" />
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Manejarlo es así de sencillo
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground sm:text-lg">
              Sin manuales y sin tecnicismos: tu panel te guía paso a paso y todo lo importante
              está a un toque, desde el celular.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                'Una guía de primeros pasos te lleva de cero a vender',
                'Confirmas pagos con un toque: “Marcar pagado” y listo',
                'Ves tus ingresos, boletos vendidos y órdenes por cobrar de un vistazo',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Button asChild variant="brand" size="lg" className="mt-8 rounded-full">
              <Link to="/registro">
                Quiero mi administrador <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── BENEFICIOS (bento sobre papel) ── */}
      <section id="beneficios" className={cn('border-t', PAPER, PAPER_BORDER)}>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
          <Reveal className="mb-8 max-w-2xl">
            <Folio n="03" label="Todo incluido" />
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Una plataforma completa para organizar rifas como profesional
            </h2>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {BENTO.map((b, i) => (
              <BentoCard key={b.title} item={b} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA (banda de tinta, editorial) ── */}
      <section id="como" className="relative overflow-hidden bg-brand-ink text-white">
        <div className="grain pointer-events-none absolute inset-0 opacity-10" />
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand/25 blur-[110px]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-14 lg:grid-cols-[1fr,1.3fr]">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Folio n="04" label="El camino" dark />
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              De cero a tu primera rifa publicada
            </h2>
            <p className="mt-4 max-w-sm text-white/60">
              Siete pasos, sin tecnicismos. Configuras todo gratis y pagas solo cuando estés listo para publicar.
            </p>
            <Button asChild variant="brand" size="lg" className="mt-8 rounded-full">
              <Link to="/registro">
                Empezar ahora <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>

          <div className="relative">
            <div className="absolute bottom-5 left-[1.35rem] top-5 w-px bg-gradient-to-b from-brand-mint/70 via-white/15 to-transparent" />
            <div className="space-y-2">
              {STEPS.map((s, i) => (
                <Reveal key={s.t} delay={i * 50}>
                  <div className="group flex items-start gap-5 rounded-2xl p-3 transition-colors hover:bg-white/[0.04]">
                    <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-[#101216] font-ticket text-sm font-bold text-brand-mint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="pt-1">
                      <h3 className="font-display font-bold">{s.t}</h3>
                      <p className="mt-0.5 text-sm text-white/55">{s.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANES (boletos de entrada) ── */}
      <section id="planes" className={cn(PAPER)}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <Folio n="05" label="Planes mensuales" />
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Elige tu boleto de entrada</h2>
            <p className="mt-3 text-muted-foreground">Sin comisión por boleto. Cambia de plan cuando crezcas.</p>
          </Reveal>

          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {plans.map((plan, i) => {
              const meta = PLAN_META[plan.slug] ?? { ideal: '' };
              const popular = meta.popular;
              const verified = plan.slug === 'verificado';
              return (
                <Reveal key={plan.slug} delay={i * 90} className="h-full">
                  <div
                    className={cn(
                      'relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 transition-shadow duration-300',
                      popular
                        ? 'border-white/10 bg-brand-ink text-white shadow-[0_30px_70px_-28px_rgba(26,77,255,0.55)] lg:-translate-y-3'
                        : cn(PAPER_CARD, PAPER_BORDER, 'hover:shadow-[0_22px_50px_-24px_rgba(26,77,255,0.3)]'),
                    )}
                  >
                    {popular && (
                      <>
                        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/40 blur-[80px]" />
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-xl bg-brand-mint px-3.5 py-1 font-ticket text-[10px] font-bold uppercase tracking-[0.18em] text-brand-ink">
                          ★ Más popular
                        </span>
                      </>
                    )}

                    <div className="relative flex items-start justify-between gap-3 pt-2">
                      <div>
                        <h3 className="flex items-center gap-1.5 font-display text-xl font-extrabold tracking-tight">
                          {plan.name.replace('Plan ', '')}
                          {verified && <VerifiedBadge size={18} />}
                        </h3>
                        <p className={cn('mt-1 text-xs', popular ? 'text-white/60' : 'text-muted-foreground')}>{meta.ideal}</p>
                      </div>
                      <span
                        className={cn(
                          'font-ticket text-[10px] font-bold uppercase tracking-[0.18em]',
                          popular ? 'text-white/30' : 'text-muted-foreground/35',
                        )}
                      >
                        Serie {plan.slug.slice(0, 3)}-{String(i + 1).padStart(3, '0')}
                      </span>
                    </div>

                    <div className="relative mt-6 flex items-end gap-1.5">
                      <span className="font-wide text-[2.6rem] font-black leading-none tracking-tight" style={{ fontStretch: '125%' }}>
                        {formatMXN(plan.price)}
                      </span>
                      <span className={cn('mb-1 text-sm font-medium', popular ? 'text-white/55' : 'text-muted-foreground')}>/mes</span>
                    </div>

                    {/* Perforación con muescas */}
                    <div className="relative -mx-7 my-6">
                      <div className={cn('border-t-2 border-dashed', popular ? 'border-white/15' : PAPER_BORDER)} />
                      <span className={cn('absolute -left-3.5 -top-3.5 h-7 w-7 rounded-full', PAPER)} aria-hidden />
                      <span className={cn('absolute -right-3.5 -top-3.5 h-7 w-7 rounded-full', PAPER)} aria-hidden />
                    </div>

                    <ul className="relative space-y-3">
                      {plan.features.slice(0, 7).map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <span
                            className={cn(
                              'mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full',
                              popular ? 'bg-brand-mint text-brand-ink' : 'bg-brand/10 text-brand',
                            )}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          <span className={popular ? 'text-white/85' : 'text-foreground/90'}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      size="lg"
                      className={cn(
                        'relative mt-8 w-full rounded-full font-bold',
                        popular
                          ? 'bg-brand text-white shadow-[0_14px_30px_-10px_rgba(26,77,255,0.7)] hover:bg-brand-electric'
                          : 'bg-brand-ink text-white hover:bg-black dark:bg-white dark:text-brand-ink dark:hover:bg-white/90',
                      )}
                    >
                      <Link to="/registro">Empezar con {plan.name.replace('Plan ', '')}</Link>
                    </Button>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <p className="mx-auto mt-9 max-w-xl text-center text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Crea y configura todo gratis.</span> Activas tu plan solo
            cuando estés listo para publicar — el equipo Bismark lo activa contigo, en persona.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className={cn('border-t', PAPER, PAPER_BORDER)}>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-14">
          <Reveal className="mb-8">
            <Folio n="06" label="Preguntas frecuentes" />
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Lo que quieres saber</h2>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={f.q} delay={i * 40}>
                  <div className={cn('overflow-hidden rounded-2xl border', PAPER_CARD, open ? 'border-brand/40' : PAPER_BORDER)}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left"
                    >
                      <span className={cn('font-ticket text-xs font-bold', open ? 'text-brand' : 'text-muted-foreground/50')}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-display font-bold">{f.q}</span>
                      <ChevronDown className={cn('h-5 w-5 shrink-0 text-brand transition-transform', open && 'rotate-180')} />
                    </button>
                    <div className={cn('grid transition-all duration-300', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 pl-12 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL: el boleto Bismark (azul eléctrico) ── */}
      <section className={cn('px-4 py-12 sm:py-14', PAPER)}>
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-electric via-brand to-brand-deep text-white shadow-[0_30px_80px_-24px_rgba(26,77,255,0.6)]">
            <div className="grain pointer-events-none absolute inset-0 opacity-[0.12]" />
            <p className="pointer-events-none absolute -right-4 -top-7 select-none font-ticket text-[8rem] font-bold leading-none text-white/[0.06]" aria-hidden>
              Nº1
            </p>

            <div className="relative grid md:grid-cols-[1fr,auto]">
              {/* Cuerpo del boleto */}
              <div className="px-7 py-12 sm:px-12 sm:py-14">
                <p className="font-ticket text-[11px] font-bold uppercase tracking-[0.3em] text-brand-mint">
                  Boleto de entrada · Válido hoy
                </p>
                <h2 className="mt-3 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                  Tu página de rifas profesional empieza hoy
                </h2>
                <p className="mt-4 max-w-md font-medium text-white/75">
                  Empieza gratis. Arma tu página, crea tu rifa y mira cómo queda antes de publicar.
                </p>
                <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Button asChild size="xl" className="rounded-full bg-white text-brand-ink shadow-xl hover:bg-[#EEF3FF]">
                    <Link to="/registro">
                      Crear mi página gratis <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/65">
                    <CalendarCheck className="h-4 w-4" /> Sin tarjeta · Listo en minutos
                  </span>
                </div>
              </div>

              {/* Talón perforado */}
              <div className="relative flex items-center justify-between gap-4 border-t-2 border-dashed border-white/30 px-7 py-5 md:w-36 md:flex-col md:border-l-2 md:border-t-0 md:py-10">
                <span className="pointer-events-none absolute -left-3.5 -top-3.5 hidden h-7 w-7 rounded-full bg-[#F5F7FF] dark:bg-background md:block" aria-hidden />
                <span className="pointer-events-none absolute -bottom-3.5 -left-3.5 hidden h-7 w-7 rounded-full bg-[#F5F7FF] dark:bg-background md:block" aria-hidden />
                <p className="font-ticket text-xs font-bold uppercase tracking-[0.2em] md:[writing-mode:vertical-rl]">
                  Nº 000001 · Admite: 1 rifero
                </p>
                <BadgeCheck className="h-6 w-6 shrink-0 text-brand-mint" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-brand-ink text-white/60">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <div className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold text-white">
                <LogoMark variant="white" className="h-8 w-8" />
                Bismark
              </div>
              <p className="text-sm">La forma más fácil de organizar tus rifas y sorteos desde el celular.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
              <div className="space-y-2">
                <p className="mb-1 font-semibold text-white">Producto</p>
                <a href="#beneficios" className="block transition-colors hover:text-white">Beneficios</a>
                <a href="#como" className="block transition-colors hover:text-white">Cómo funciona</a>
                <Link to="/planes" className="block transition-colors hover:text-white">Planes</Link>
                <a href={DEMO_URL} target="_blank" rel="noopener" className="block transition-colors hover:text-white">
                  Página de ejemplo
                </a>
              </div>
              <div className="space-y-2">
                <p className="mb-1 font-semibold text-white">Cuenta</p>
                <Link to="/login" className="block transition-colors hover:text-white">Entrar</Link>
                <Link to="/registro" className="block transition-colors hover:text-white">Crear página</Link>
              </div>
              <div className="space-y-2">
                <p className="mb-1 font-semibold text-white">Legal</p>
                <Link to="/terminos" className="block transition-colors hover:text-white">Términos y Condiciones</Link>
                <Link to="/privacidad" className="block transition-colors hover:text-white">Aviso de Privacidad</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs sm:flex-row">
            <p className="flex items-center gap-1.5">
              © {new Date().getFullYear()} Bismark. Todos los derechos reservados.
              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-brand-mint" /> Hecho en México</span>
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppFab />
    </div>
  );
}
