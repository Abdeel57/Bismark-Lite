import { ArrowRight } from 'lucide-react';
import { BRAND } from '@bismark/shared';
import { buildHomeUrl } from '@/lib/site';
import { LogoMark } from './LogoMark';
import { cn } from '@/lib/cn';

// Cierre de marca a todo el ancho para el final de las páginas públicas. Una
// banda oscura y sobria que "desconecta" de la página de la rifa e invita a
// crear las propias. El botón lleva a la landing (/), donde está toda la info.
export function BismarkCta({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'relative isolate w-full overflow-hidden border-t border-white/10 bg-brand-dark px-6 py-12 text-center',
        className,
      )}
    >
      {/* Brillo azul muy tenue, centrado en la base */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 opacity-40"
        style={{ background: 'radial-gradient(55% 100% at 50% 100%, rgba(26,77,255,0.3), transparent 75%)' }}
      />

      <div className="mx-auto max-w-md">
        {/* Logo + nombre de marca */}
        <div className="mb-3 inline-flex items-center gap-2">
          <LogoMark variant="white" className="h-7 w-7" />
          <span className="font-display text-lg font-bold uppercase tracking-[0.22em] text-white">BISMARK</span>
        </div>

        <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
          Empieza a rifar aquí
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-white/55">
          Crea tus propias rifas digitales: cobros en línea, boletos con QR y sorteos transparentes.
        </p>

        <a
          href={buildHomeUrl()}
          className="group mt-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-white/40 hover:bg-white/20"
        >
          Conoce Bismark
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>

        <p className="mt-6 font-ticket text-[10px] uppercase tracking-[0.3em] text-white/30">
          {BRAND.poweredBy}
        </p>
      </div>
    </section>
  );
}
