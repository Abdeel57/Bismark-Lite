import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Download, ShieldCheck, Ticket as TicketIcon, AlertCircle, Home, WifiOff } from 'lucide-react';
import { BRAND, formatMXN, formatDateTimeMX } from '@bismark/shared';
import { apiAssetUrl } from '@/lib/api';
import { publicService } from '@/services/publicSite';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandLoader } from '@/components/brand/BrandLoader';
import { OrderStatusBadge } from '@/lib/statusBadges';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { QrCode } from '@/components/public/QrCode';
import { PaymentSection } from '@/components/public/PaymentSection';
import { useOfflineTicket } from '@/lib/offline/useOfflineTicket';

export default function DigitalTicket() {
  const { code = '' } = useParams<{ code: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['digital-ticket', code],
    queryFn: () => publicService.digitalTicket(code),
    enabled: !!code,
    // Sin señal no insistas: caemos rápido a la copia offline (IndexedDB).
    retry: 1,
    networkMode: 'always',
  });

  // Offline-first: guarda el boleto al cargarlo con red y lo recupera sin señal.
  const { ticket, savedAt, fromCache, checking } = useOfflineTicket(code, {
    online: data?.ticket,
    networkFailed: isError,
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Encabezado de plataforma */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        {(isLoading || checking) && !ticket ? (
          <BrandLoader fullScreen={false} />
        ) : !ticket ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-extrabold">Boleto no disponible</h1>
              <p className="max-w-xs text-base text-muted-foreground">
                No encontramos este boleto digital. Revisa que el enlace sea correcto.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Ir al inicio
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Indicador: guardado para verlo sin internet (tranquiliza al comprador) */}
            {fromCache ? (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <WifiOff className="h-7 w-7 shrink-0" />
                <p className="text-base font-bold leading-tight">
                  Estás sin internet. Te mostramos tu boleto guardado.
                </p>
              </div>
            ) : (
              savedAt && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <ShieldCheck className="h-7 w-7 shrink-0" />
                  <p className="text-base font-bold leading-tight">
                    Guardado para verlo sin internet
                  </p>
                </div>
              )
            )}

            {/* Boleto digital con borde perforado */}
            <div className="overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border">
              {/* Parte superior */}
              <div className="bg-brand px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold opacity-90">
                    <TicketIcon className="h-4 w-4" />
                    Boleto digital
                  </span>
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-extrabold">
                    {ticket.eventLabel}
                  </span>
                </div>
                <h1 className="mt-2 text-xl font-extrabold leading-tight">{ticket.raffleTitle}</h1>
                <p className="text-sm opacity-90">{ticket.riferoPublicName}</p>
              </div>

              {/* Línea perforada */}
              <div className="relative">
                <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-muted/30" />
                <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-muted/30" />
                <div className="mx-5 border-t-2 border-dashed border-border" />
              </div>

              {/* Cuerpo */}
              <div className="px-6 py-5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Números de boleto</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ticket.ticketNumbers.map((n) => (
                    <span
                      key={n}
                      className="rounded-lg bg-brand/10 px-3 py-1.5 text-lg font-extrabold tabular-nums text-brand"
                    >
                      {n}
                    </span>
                  ))}
                </div>

                <dl className="mt-5 space-y-3 text-sm">
                  <Row label="A nombre de" value={ticket.buyerName} />
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Estado</dt>
                    <dd>
                      <OrderStatusBadge status={ticket.status} />
                    </dd>
                  </div>
                  <Row label="Total" value={<span className="font-extrabold">{formatMXN(ticket.totalAmount)}</span>} />
                  <Row label="Fecha" value={formatDateTimeMX(ticket.createdAt)} />
                  <Row label="Folio" value={<span className="tabular-nums tracking-wide">{ticket.code}</span>} />
                </dl>

                {/* Código QR para mostrar/escanear en el sorteo (funciona sin internet) */}
                {ticket.verifyUrl && (
                  <div className="mt-6 flex flex-col items-center gap-2 border-t pt-5">
                    <div className="rounded-2xl bg-white p-3 ring-1 ring-border">
                      <QrCode value={ticket.verifyUrl} size={208} />
                    </div>
                    <p className="text-center text-sm font-semibold text-muted-foreground">
                      Muestra este código en el sorteo
                    </p>
                  </div>
                )}
              </div>

              {/* Pie del boleto */}
              <div className="border-t bg-muted/40 px-6 py-4">
                {/* El PDF y la verificación necesitan internet: se ocultan sin señal. */}
                {ticket.pdfUrl && !fromCache && (
                  <Button asChild size="lg" className="w-full">
                    <a href={apiAssetUrl(ticket.pdfUrl)} target="_blank" rel="noopener noreferrer">
                      <Download className="h-5 w-5" />
                      Descargar PDF
                    </a>
                  </Button>
                )}
                {!fromCache && (
                  <a
                    href={ticket.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Verificar autenticidad de este boleto
                  </a>
                )}
              </div>
            </div>

            {/* ── Pago: resumen + datos del rifero + subir comprobante ── */}
            <PaymentSection ticket={ticket} offline={fromCache} />

            {/* Nota de marca discreta */}
            <p className="mt-6 text-center text-xs text-muted-foreground/70">{BRAND.generatedBy}</p>
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

// La sección de pago vive en `@/components/public/PaymentSection` (reutilizada
// por el boleto Bismark y por la página de pago del rifero).
