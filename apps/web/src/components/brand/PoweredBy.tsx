import { BRAND } from '@bismark/shared';
import { LogoMark } from './LogoMark';
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
      <LogoMark className="h-4 w-4" />
      {BRAND.poweredBy}
    </a>
  );
}
