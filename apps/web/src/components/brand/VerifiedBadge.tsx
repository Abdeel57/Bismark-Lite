import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

// Palomita azul de verificación / confianza: círculo azul con check blanco.
export function VerifiedBadge({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full bg-blue-500 text-white', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Verificado"
    >
      <Check strokeWidth={3.5} style={{ width: Math.round(size * 0.62), height: Math.round(size * 0.62) }} />
    </span>
  );
}
