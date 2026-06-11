import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowLeft, Ticket, Star } from 'lucide-react';
import { ThemeToggle } from '@/components/brand/ThemeToggle';

interface Props {
  children: ReactNode;
  badge: string;
  sideTitle: ReactNode;
  sideSubtitle: string;
  bullets: string[];
}

// Layout de autenticación: panel de marca eléctrico (izq, desktop) + formulario (der, según tema).
export function AuthLayout({ children, badge, sideTitle, sideSubtitle, bullets }: Props) {
  return (
    <div className="min-h-screen font-body lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Panel de marca ── */}
      <aside className="relative hidden overflow-hidden bg-[#070b18] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Atmósfera */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand/30 blur-[120px]" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-brand-deep/40 blur-[110px]" />
          <div className="absolute bottom-1/3 left-1/4 h-60 w-60 rounded-full bg-brand-gold/10 blur-[90px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-[0.15]" />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex w-fit items-center gap-2 font-display text-xl font-extrabold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-brand/40">B</span>
          Bismark
        </Link>

        {/* Mensaje */}
        <div className="relative z-10 max-w-md">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-brand-gold" />
            {badge}
          </span>
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">{sideTitle}</h2>
          <p className="mt-4 text-white/70">{sideSubtitle}</p>

          <ul className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-gold/20 text-brand-gold">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          {/* Stub decorativo de boleto */}
          <div className="mt-10 w-fit rotate-[-3deg] animate-float-slow">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="border-l border-dashed border-white/20 pl-3">
                <p className="font-ticket text-[10px] uppercase tracking-widest text-white/50">Boleto digital</p>
                <p className="font-ticket text-base font-bold text-white">E1 · 0427</p>
              </div>
              <Star className="ml-1 h-4 w-4 text-brand-gold" />
            </div>
          </div>
        </div>

        {/* Pie */}
        <p className="relative z-10 flex items-center gap-2 text-xs text-white/40">
          <Star className="h-3 w-3 text-brand-gold" /> Hecho en México · Sin comisión por boleto
        </p>
      </aside>

      {/* ── Área del formulario ── */}
      <main className="relative flex min-h-screen flex-col bg-background">
        <div className="flex items-center justify-between p-4 lg:justify-end lg:p-5">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold lg:hidden">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm text-white">B</span>
            Bismark
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" /> Inicio
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-6">
          <div className="w-full max-w-sm animate-reveal">{children}</div>
        </div>
      </main>
    </div>
  );
}
