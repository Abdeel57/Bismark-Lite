import { useEffect, useState } from 'react';
import { formatDateTimeMX, RaffleStatus } from '@bismark/shared';

// Cuenta regresiva al sorteo. Si la rifa sigue activa y la fecha es futura,
// muestra un cronómetro (días/horas/min/seg) que corre en vivo. Si ya finalizó
// o no hay cuenta regresiva, sólo muestra la fecha del sorteo.
// Sin fondo propio (transparente): vive dentro del hero y hereda su fondo blanco,
// para que la sombra del marco de la imagen fluya hacia abajo sin cortarse.

function breakdown(target: Date, now: number) {
  const ms = Math.max(0, target.getTime() - now);
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1_000),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

function Segment({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[60px] flex-col items-center rounded-xl border border-black/[0.08] bg-muted/40 px-2.5 py-2 shadow-sm sm:min-w-[72px]">
      <span className="font-mono text-2xl font-black leading-none tabular-nums text-foreground sm:text-[2rem]">
        {pad(value)}
      </span>
      <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
    </div>
  );
}

interface Props {
  drawDate: string | null;
  status: RaffleStatus;
}

export function RaffleCountdown({ drawDate, status }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const target = drawDate ? new Date(drawDate) : null;
  const finished = status === RaffleStatus.FINISHED || status === RaffleStatus.CANCELLED;
  const live = !!target && !finished && target.getTime() > now;

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

  // Sin fecha y sin finalizar: nada que mostrar.
  if (!target && !finished) return null;

  if (live && target) {
    const { d, h, m, s } = breakdown(target, now);
    return (
      <section className="px-4 pb-6 pt-6 text-foreground">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--rifero-primary)]">
            Faltan para el sorteo
          </p>
          <div className="flex items-stretch justify-center gap-1.5 sm:gap-2.5">
            <Segment value={d} label={d === 1 ? 'Día' : 'Días'} />
            <Segment value={h} label="Horas" />
            <Segment value={m} label="Min" />
            <Segment value={s} label="Seg" />
          </div>
          {drawDate && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sorteo · {formatDateTimeMX(drawDate)}
            </p>
          )}
        </div>
      </section>
    );
  }

  // Finalizado, cancelado o fecha ya pasada: sólo la fecha del sorteo.
  return (
    <section className="bg-background px-4 pb-6 pt-2 text-foreground">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {finished ? 'Sorteo realizado' : 'Fecha del sorteo'}
        </p>
        {drawDate && (
          <p className="mt-2 text-lg font-black uppercase tracking-wide text-foreground sm:text-xl">
            {formatDateTimeMX(drawDate)}
          </p>
        )}
      </div>
    </section>
  );
}
