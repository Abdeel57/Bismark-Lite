import { VerifiedBadge } from '@/components/brand/VerifiedBadge';

// Sello de confianza pequeño y estático, pegado a la parte de abajo de la
// pantalla: "Estos sorteos son seguros" en azul, con un reflejo animado que
// cruza la etiqueta (toque profesional). No bloquea toques y respeta el área
// segura del teléfono.
export function SafeSeal() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="relative inline-flex items-center gap-1 overflow-hidden rounded-full border border-blue-200 bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 shadow-md backdrop-blur dark:border-blue-900/60 dark:bg-zinc-900/95 dark:text-blue-400">
        <VerifiedBadge size={12} />
        Estos sorteos son seguros
        {/* Reflejo/brillo que cruza la etiqueta cada pocos segundos. */}
        <span
          className="pointer-events-none absolute inset-0 animate-shine"
          style={{ background: 'linear-gradient(110deg, transparent 40%, rgba(37,99,235,0.22) 50%, transparent 60%)' }}
        />
      </div>
    </div>
  );
}
