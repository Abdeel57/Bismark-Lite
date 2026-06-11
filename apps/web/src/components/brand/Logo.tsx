import { cn } from '@/lib/cn';

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-black tracking-tight', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-brand/30">
        B
      </span>
      {withText && <span className="text-xl">Bismark</span>}
    </span>
  );
}
