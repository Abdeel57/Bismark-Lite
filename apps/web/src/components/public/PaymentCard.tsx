import { Copy, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

// Datos de pago del rifero (mismo shape en lookup y en la rifa).
export interface PaymentInfo {
  holderName: string | null;
  bank: string | null;
  clabe: string | null;
  cardNumber: string | null;
  concept: string | null;
  instructions: string | null;
  whatsapp: string | null;
}

export const paymentHasData = (p: PaymentInfo): boolean =>
  !!(p.holderName || p.bank || p.clabe || p.cardNumber || p.concept || p.instructions);

const BRAND_GRAD =
  'linear-gradient(135deg, var(--rifero-primary), color-mix(in srgb, var(--rifero-primary) 55%, #0a0a0a))';

function copyText(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copiado`))
    .catch(() => toast.error('No se pudo copiar'));
}

function PayRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span className={`truncate font-semibold ${mono ? 'font-ticket text-[13px] tracking-tight' : 'text-sm'}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => copyText(value, label)}
          aria-label={`Copiar ${label}`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--rifero-primary)] hover:text-white"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </dd>
    </div>
  );
}

// Tarjeta de métodos de pago (estilo tarjeta bancaria, con la marca del rifero).
export function PaymentCard({ pay }: { pay: PaymentInfo }) {
  if (!paymentHasData(pay)) return null;
  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm">
      <div className="relative overflow-hidden px-4 py-3.5 text-white" style={{ background: BRAND_GRAD }}>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl"
        />
        <div className="relative flex items-center justify-between">
          <span className="font-display text-sm font-extrabold uppercase tracking-wide">Métodos de pago</span>
          <CreditCard className="h-5 w-5 opacity-90" />
        </div>
        {pay.bank && <p className="relative mt-0.5 text-xs font-semibold opacity-90">{pay.bank}</p>}
      </div>
      <dl className="divide-y bg-card">
        {pay.holderName && <PayRow label="Titular" value={pay.holderName} />}
        {pay.clabe && <PayRow label="CLABE" value={pay.clabe} mono />}
        {pay.cardNumber && <PayRow label="Tarjeta" value={pay.cardNumber} mono />}
        {pay.concept && <PayRow label="Concepto" value={pay.concept} />}
      </dl>
      {pay.instructions && (
        <p className="whitespace-pre-line bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {pay.instructions}
        </p>
      )}
    </div>
  );
}
