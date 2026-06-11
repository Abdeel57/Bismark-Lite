import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, X } from 'lucide-react';
import {
  TICKET_STATUS_COLORS,
  TICKET_STATUS_LABELS,
  formatMXN,
  type TicketLiteDTO,
  type TicketStatus,
} from '@bismark/shared';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CONFETTI_COLORS = ['#ff004c', '#ff8a00', '#ffe600', '#00d084', '#00b4ff', '#7c4dff', '#ff5fa2'];

// Estallido de confeti desde un punto (x, y) de la pantalla.
function LuckyConfetti({ burst }: { burst: { id: number; x: number; y: number } | null }) {
  const pieces = useMemo(() => {
    if (!burst) return [];
    return Array.from({ length: 70 }, (_, i) => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 230;
      const round = Math.random() > 0.5;
      const size = 6 + Math.random() * 7;
      return {
        i,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist + 50,
        rot: (Math.random() * 2 - 1) * 540,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: size,
        h: round ? size : size * 0.55,
        round,
        delay: Math.random() * 90,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst?.id]);

  if (!burst) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={`${burst.id}-${p.i}`}
          className="lucky-confetti absolute"
          style={
            {
              left: burst.x,
              top: burst.y,
              width: p.w,
              height: p.h,
              backgroundColor: p.color,
              borderRadius: p.round ? '9999px' : '2px',
              animationDelay: `${p.delay}ms`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--rot': `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

type Filter = 'all' | 'AVAILABLE' | 'RESERVED' | 'PAID' | 'RIFERO_RESERVED' | 'WINNER';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'AVAILABLE', label: 'Disponibles' },
  { key: 'RESERVED', label: 'Apartados' },
  { key: 'PAID', label: 'Pagados' },
  { key: 'RIFERO_RESERVED', label: 'Reservados' },
];

interface Props {
  tickets: TicketLiteDTO[];
  selectable?: boolean;
  selected?: number[];
  onSelectionChange?: (numbers: number[]) => void;
  maxSelectable?: number | null;
  ticketPrice?: number;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmLoading?: boolean;
  onTicketClick?: (ticket: TicketLiteDTO) => void;
  cellSize?: number;
  minimal?: boolean; // oculta filtros y leyenda (vista pública de comprador)
}

const SELECTABLE_STATUSES: TicketStatus[] = ['AVAILABLE'];

export function TicketGrid({
  tickets,
  selectable = false,
  selected = [],
  onSelectionChange,
  maxSelectable,
  ticketPrice = 0,
  onConfirm,
  confirmLabel = 'Apartar boletos',
  confirmLoading = false,
  onTicketClick,
  cellSize = 48,
  minimal = false,
}: Props) {
  const [filter, setFilter] = useState<Filter>(minimal ? 'AVAILABLE' : 'all');
  const [search, setSearch] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(6);
  // Maquinita de la suerte
  const [luckyOpen, setLuckyOpen] = useState(false);
  const [luckyQty, setLuckyQty] = useState(5);
  const [justPicked, setJustPicked] = useState<Set<number>>(() => new Set());
  const [burst, setBurst] = useState<{ id: number; x: number; y: number } | null>(null);
  const [spinText, setSpinText] = useState<string | null>(null); // números girando en el botón
  const luckyBtnRef = useRef<HTMLButtonElement>(null);
  const spinRef = useRef<number | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Calcular columnas según el ancho disponible.
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const cols = Math.max(4, Math.min(12, Math.floor((w - 4) / cellSize)));
      setColumns(cols);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cellSize]);

  const filtered = useMemo(() => {
    let list = tickets;
    if (filter !== 'all') list = list.filter((t) => t.status === filter);
    const q = search.trim();
    if (q) list = list.filter((t) => t.displayNumber.includes(q) || String(t.number) === q);
    return list;
  }, [tickets, filter, search]);

  const rowCount = Math.ceil(filtered.length / columns);
  const gap = 5;
  const rowHeight = Math.round(cellSize * 0.62); // celdas rectangulares (más anchas que altas)
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + gap,
    overscan: 8,
  });

  const toggle = (t: TicketLiteDTO) => {
    if (onTicketClick) {
      onTicketClick(t);
      return;
    }
    if (!selectable) return;
    if (!SELECTABLE_STATUSES.includes(t.status)) return;
    const next = new Set(selectedSet);
    if (next.has(t.number)) {
      next.delete(t.number);
    } else {
      if (maxSelectable && next.size >= maxSelectable) return;
      next.add(t.number);
    }
    onSelectionChange?.([...next].sort((a, b) => a - b));
  };

  const total = selected.length * ticketPrice;
  const brand = 'var(--rifero-primary, hsl(var(--primary)))';

  // Elige N boletos disponibles al azar (sin aplicarlos todavía).
  const computePicks = (n: number): number[] | null => {
    if (!selectable || !onSelectionChange) return null;
    const avail = tickets.filter((t) => t.status === 'AVAILABLE' && !selectedSet.has(t.number));
    const room = maxSelectable ? Math.max(0, maxSelectable - selected.length) : avail.length;
    const count = Math.max(0, Math.min(n, avail.length, room));
    if (count === 0) {
      toast.error(
        maxSelectable && selected.length >= maxSelectable
          ? `Ya alcanzaste el máximo de ${maxSelectable} boletos`
          : 'No hay más boletos disponibles para agregar',
      );
      return null;
    }
    const pool = avail.slice();
    const picked: number[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool[idx].number);
      pool.splice(idx, 1);
    }
    return picked;
  };

  // Aplica los boletos elegidos: selección + confeti (lento) desde el botón + "pop".
  const applyPicks = (picked: number[]) => {
    onSelectionChange?.([...selected, ...picked].sort((a, b) => a - b));
    const rect = luckyBtnRef.current?.getBoundingClientRect();
    setBurst((b) => ({
      id: (b?.id ?? 0) + 1,
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top + rect.height / 2 : Math.round(window.innerHeight * 0.4),
    }));
    window.setTimeout(() => setBurst(null), 2700);
    setJustPicked(new Set(picked));
    window.setTimeout(() => setJustPicked(new Set()), 800);
    const idx0 = filtered.findIndex((t) => t.number === picked[0]);
    if (idx0 >= 0) rowVirtualizer.scrollToIndex(Math.floor(idx0 / columns), { align: 'center' });
    toast.success(picked.length === 1 ? '¡1 boleto de la suerte!' : `¡${picked.length} boletos de la suerte!`);
  };

  // "¡A girar!": el botón muestra números girando ~1s, se frena y dispara el confeti.
  const roll = (n: number) => {
    if (spinText !== null) return; // ya está girando
    const picked = computePicks(n);
    if (!picked) return;
    const display = tickets.find((t) => t.number === picked[0])?.displayNumber ?? String(picked[0]);
    const len = display.length;
    setSpinText('0'.repeat(len));
    spinRef.current = window.setInterval(() => {
      setSpinText(Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join(''));
    }, 70);
    window.setTimeout(() => {
      if (spinRef.current) window.clearInterval(spinRef.current);
      spinRef.current = null;
      setSpinText(display); // se frena en el número
      window.setTimeout(() => {
        setSpinText(null);
        applyPicks(picked);
      }, 280);
    }, 1000);
  };

  // Limpia el intervalo si se desmonta a media tirada.
  useEffect(() => () => void (spinRef.current && window.clearInterval(spinRef.current)), []);

  return (
    <div className="flex flex-col">
      <LuckyConfetti burst={burst} />
      {/* Buscador */}
      <div className="relative mb-3">
        {!minimal && (
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          inputMode="numeric"
          placeholder={minimal ? 'BUSCAR' : 'Buscar número de boleto...'}
          className={cn(minimal ? 'border-2 text-center font-bold uppercase tracking-wide' : 'pl-9')}
          style={minimal ? { borderColor: brand } : undefined}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!minimal && (
        <>
          {/* Filtros */}
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  filter === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Leyenda de colores */}
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            {(['AVAILABLE', 'RESERVED', 'PAID', 'RIFERO_RESERVED', 'WINNER'] as TicketStatus[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TICKET_STATUS_COLORS[s] }} />
                {TICKET_STATUS_LABELS[s]}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Maquinita de la suerte (glow arcoíris + cantidad + confeti) */}
      {minimal && selectable && (
        <div className="mb-3">
          <button
            ref={luckyBtnRef}
            type="button"
            onClick={() => {
              if (spinText === null) setLuckyOpen((o) => !o);
            }}
            className="lucky-glow attn-pulse flex w-full items-center justify-center rounded-xl border-2 bg-card py-3 font-display text-sm font-extrabold uppercase tracking-wide active:scale-[0.99]"
            style={{ borderColor: brand }}
          >
            {spinText !== null ? (
              <span className="font-ticket text-lg font-bold tracking-[0.3em]" style={{ color: brand }}>
                {spinText}
              </span>
            ) : (
              'Maquinita de la suerte'
            )}
          </button>

          {luckyOpen && (
            <div className="mt-2 animate-slide-up rounded-xl border-2 bg-card p-3" style={{ borderColor: brand }}>
              <p className="mb-2 text-center text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                ¿Cuántos boletos de la suerte?
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setLuckyQty((q) => Math.max(1, q - 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border-2 text-xl font-bold leading-none"
                  style={{ borderColor: brand, color: brand }}
                  aria-label="Menos"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={luckyQty}
                  onChange={(e) => setLuckyQty(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                  className="h-9 w-16 rounded-lg border-2 text-center font-ticket text-base font-bold outline-none"
                  style={{ borderColor: brand }}
                />
                <button
                  type="button"
                  onClick={() => setLuckyQty((q) => Math.min(999, q + 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border-2 text-xl font-bold leading-none"
                  style={{ borderColor: brand, color: brand }}
                  aria-label="Más"
                >
                  +
                </button>
              </div>
              <div className="mt-2 flex justify-center gap-1.5">
                {[1, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLuckyQty(n)}
                    className="rounded-full border px-3 py-1 text-xs font-bold tabular-nums"
                    style={{ borderColor: brand, color: brand }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  roll(luckyQty);
                  setLuckyOpen(false);
                }}
                className="lucky-glow mt-3 w-full rounded-xl py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-white"
                style={{ background: brand }}
              >
                ¡A girar!
              </button>
            </div>
          )}
        </div>
      )}

      {/* Encabezado "Blancos - Disponibles" (vista de comprador) */}
      {minimal && (
        <div className="mb-2 flex items-center gap-2 text-sm font-extrabold">
          <span
            className="grid h-6 min-w-[2.5rem] place-items-center rounded border px-1.5 text-xs tabular-nums"
            style={{ borderColor: 'var(--rifero-primary, hsl(var(--primary)))' }}
          >
            {filtered.length}
          </span>
          <span>Blancos · Disponibles</span>
        </div>
      )}

      {/* Cuadrícula virtualizada */}
      <div
        ref={parentRef}
        className="relative h-[min(64vh,540px)] overflow-y-auto overscroll-contain rounded-xl border bg-background p-1.5"
      >
        {filtered.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Sin boletos para mostrar</div>
        ) : (
          <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            {rowVirtualizer.getVirtualItems().map((vRow) => {
              const start = vRow.index * columns;
              const rowTickets = filtered.slice(start, start + columns);
              return (
                <div
                  key={vRow.key}
                  className="absolute left-0 top-0 grid w-full"
                  style={{
                    transform: `translateY(${vRow.start}px)`,
                    height: rowHeight,
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap,
                    padding: '0 2px',
                  }}
                >
                  {rowTickets.map((t) => {
                    const isSelected = selectedSet.has(t.number);
                    const selectableNow = selectable && SELECTABLE_STATUSES.includes(t.status);
                    const isAvailable = t.status === 'AVAILABLE';
                    const color = TICKET_STATUS_COLORS[t.status];
                    return (
                      <button
                        key={t.number}
                        onClick={() => toggle(t)}
                        disabled={!onTicketClick && selectable && !selectableNow}
                        className={cn(
                          'relative flex items-center justify-center rounded-[4px] border text-[11px] tabular-nums transition-all sm:text-xs',
                          isSelected ? 'z-[1] font-extrabold shadow-md' : 'font-bold',
                          justPicked.has(t.number) ? 'lucky-pop' : '',
                          selectableNow || onTicketClick ? 'cursor-pointer active:scale-95' : 'cursor-default',
                        )}
                        style={
                          isSelected
                            ? {
                                backgroundColor: brand,
                                borderColor: brand,
                                color: '#fff',
                                boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.85)',
                              }
                            : isAvailable
                              ? { backgroundColor: '#fff', borderColor: brand, color: '#111827' }
                              : { backgroundColor: color, borderColor: color, color: '#fff' }
                        }
                        title={`${t.displayNumber} · ${TICKET_STATUS_LABELS[t.status]}`}
                      >
                        {/* Al seleccionar, el número desaparece y queda el bloque de color. */}
                        {isSelected ? null : t.displayNumber}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen fijo inferior (sólo vista no-minimal; el comprador usa el panel superior) */}
      {selectable && !minimal && selected.length > 0 && (
        <div className="sticky bottom-0 z-20 mt-3 animate-slide-up rounded-2xl border bg-card p-3 shadow-lg safe-bottom">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {selected.length} boleto{selected.length !== 1 ? 's' : ''} seleccionado{selected.length !== 1 ? 's' : ''}
              </p>
              <p className="text-lg font-bold">{formatMXN(total)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onSelectionChange?.([])}>
                Limpiar
              </Button>
              <Button onClick={onConfirm} loading={confirmLoading} size="lg">
                {confirmLabel}
              </Button>
            </div>
          </div>
          <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">
            {selected.map((n) => tickets.find((t) => t.number === n)?.displayNumber ?? n).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
