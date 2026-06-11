import { BRAND } from '@bismark/shared';
import { cn } from '@/lib/cn';

// Marca discreta para páginas públicas de riferos.
export function PoweredBy({ className }: { className?: string }) {
  return (
    <a
      href="/"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground',
        className,
      )}
    >
      <span className="grid h-4 w-4 place-items-center rounded bg-brand text-[9px] font-black text-white">B</span>
      {BRAND.poweredBy}
    </a>
  );
}
