import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Ticket, Clock, ChevronDown, ArrowRight, PlayCircle } from 'lucide-react';
import {
  RaffleStatus,
  eventLabel,
  formatMXN,
  formatDateMX,
  buildWhatsappLink,
  type PublicRaffleSummaryDTO,
} from '@bismark/shared';
import { apiAssetUrl } from '@/lib/api';
import { publicService, type PublicRiferoWinner } from '@/services/publicSite';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader, EmptyState } from '@/components/ui/misc';
import { RiferoTheme } from '@/components/brand/RiferoTheme';
import { VerifiedBadge } from '@/components/brand/VerifiedBadge';
import { FacebookIcon, InstagramIcon, TiktokIcon, WhatsappIcon } from '@/components/brand/SocialIcons';
import { PoweredBy } from '@/components/brand/PoweredBy';
import { LazyImage } from '@/components/public/LazyImage';
import { SafeSeal } from '@/components/public/SafeSeal';

interface Props {
  subdomain?: string;
  // Si se pasa, NO hace fetch público: renderiza con estos datos. Lo usa el panel
  // del rifero para verse a sí mismo (vista previa) aunque no tenga plan activo.
  previewData?: Awaited<ReturnType<typeof publicService.riferoBySubdomain>>;
}

const BRAND = 'var(--rifero-primary)';
const BRAND_SOFT = 'color-mix(in srgb, var(--rifero-primary) 10%, transparent)';

interface MiniRifero {
  publicName: string;
  logoUrl: string | null;
  verified: boolean;
}

// ── Rifa como "publicación" del rifero (estilo feed) ────────────
function RafflePost({
  raffle,
  basePath,
  rifero,
}: {
  raffle: PublicRaffleSummaryDTO;
  basePath: string;
  rifero: MiniRifero;
}) {
  const cover = raffle.coverUrl ? apiAssetUrl(raffle.coverUrl) : null;
  const pct = raffle.totalTickets > 0 ? Math.min(100, Math.round((raffle.soldCount / raffle.totalTickets) * 100)) : 0;
  const finished = raffle.status === RaffleStatus.FINISHED;
  const href = `${basePath}/e${raffle.eventNumber}`;

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Cabecera tipo post */}
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        {rifero.logoUrl ? (
          <img src={apiAssetUrl(rifero.logoUrl)} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-border" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--rifero-primary)] text-sm font-black text-white">
            {rifero.publicName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-bold leading-tight">
            <span className="truncate">{rifero.publicName}</span>
            {rifero.verified && <VerifiedBadge size={13} />}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {raffle.drawDate ? `Sorteo: ${formatDateMX(raffle.drawDate)}` : 'Rifa publicada'}
          </p>
        </div>
        <Badge variant={finished ? 'muted' : 'success'}>{finished ? 'Finalizada' : 'Disponible'}</Badge>
      </div>

      {/* Portada de la rifa */}
      <Link to={href} className="block active:opacity-95">
        {cover ? (
          <div className="aspect-[16/9] w-full bg-muted">
            <LazyImage src={cover} alt={raffle.title} className="h-full w-full" width={640} height={360} />
          </div>
        ) : (
          <div className="grid aspect-[16/9] w-full place-items-center bg-muted">
            <Ticket className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
      </Link>

      {/* Cuerpo */}
      <div className="p-3.5">
        <span
          className="inline-block rounded-md px-2 py-0.5 font-display text-[11px] font-extrabold text-white"
          style={{ background: BRAND }}
        >
          {eventLabel(raffle.eventNumber)}
        </span>
        <h3 className="mt-1.5 font-display text-lg font-extrabold uppercase leading-tight tracking-tight">
          {raffle.title}
        </h3>
        {raffle.prize && <p className="line-clamp-1 text-sm text-muted-foreground">{raffle.prize}</p>}

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Por boleto</p>
            <p className="font-ticket text-xl font-bold" style={{ color: BRAND }}>
              {formatMXN(raffle.ticketPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vendidos</p>
            <p className="font-ticket text-sm font-bold tabular-nums">
              {raffle.soldCount}/{raffle.totalTickets}
            </p>
          </div>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: BRAND }} />
        </div>

        <Button
          asChild
          className={`mt-3.5 w-full font-display font-extrabold uppercase tracking-wide text-white ${
            finished ? '' : 'attn-pulse'
          }`}
          style={{ background: BRAND }}
        >
          <Link to={href}>
            {finished ? 'Ver resultado' : 'Comprar boletos'} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

// ── Tarjeta de ganador ──────────────────────────────────────────
function WinnerCard({ w }: { w: PublicRiferoWinner }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm">
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-lg font-extrabold"
        style={{ background: BRAND_SOFT, color: BRAND }}
      >
        {w.position}°
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {w.eventLabel} · {w.raffleTitle}
        </p>
        <p className="font-ticket text-xl font-bold leading-tight" style={{ color: BRAND }}>
          {w.ticketDisplayNumber}
        </p>
        {w.prizeDescription && <p className="line-clamp-1 text-sm text-muted-foreground">{w.prizeDescription}</p>}
      </div>
      {w.evidenceUrl && (
        <a
          href={apiAssetUrl(w.evidenceUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold"
          style={{ background: BRAND_SOFT, color: BRAND }}
        >
          <PlayCircle className="h-4 w-4" /> Video
        </a>
      )}
    </div>
  );
}

// ── Pregunta frecuente (acordeón nativo) ────────────────────────
function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border bg-card px-4 py-3.5 shadow-sm [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-sm font-extrabold uppercase tracking-tight">
        {q}
        <ChevronDown
          className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
          style={{ color: BRAND }}
        />
      </summary>
      <div className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-center">
      <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">{children}</h2>
      <span className="mx-auto mt-2 block h-1 w-12 rounded-full" style={{ background: BRAND }} />
    </div>
  );
}

export default function PublicRifero({ subdomain, previewData }: Props) {
  const params = useParams<{ slug: string }>();
  const slug = subdomain ?? params.slug ?? previewData?.rifero?.slug ?? '';
  const basePath = subdomain ? '' : `/r/${slug}`;
  const verificarHref = `${basePath}/verificar`;

  const query = useQuery({
    queryKey: ['public-rifero', slug],
    queryFn: () => publicService.riferoBySubdomain(slug),
    enabled: !!slug && !previewData,
  });
  const data = previewData ?? query.data;
  const isError = query.isError;

  useDocumentTitle(data?.rifero?.publicName ?? data?.publicName);

  if (!previewData && query.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <PageLoader label="Cargando página..." />
      </div>
    );
  }

  if (isError || !data || data.active === false || !data.rifero) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-muted">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold">Esta página aún no está activa</h1>
          <p className="mt-2 text-muted-foreground">
            {data?.publicName ? `${data.publicName} ` : ''}
            está preparando sus rifas. Vuelve pronto para participar.
          </p>
          <div className="mt-8">
            <PoweredBy />
          </div>
        </div>
      </div>
    );
  }

  const rifero = data.rifero;
  const winners = data.winners ?? [];
  const cover = rifero.coverUrl ? apiAssetUrl(rifero.coverUrl) : null;
  const logo = rifero.logoUrl ? apiAssetUrl(rifero.logoUrl) : null;
  // Foto de perfil (estilo FB), ajustable desde Apariencia, con tope para no romper el layout.
  const photoPx = Math.min(Math.round((120 * (rifero.logoScale ?? 100)) / 100), 168);
  const mini: MiniRifero = { publicName: rifero.publicName, logoUrl: rifero.logoUrl, verified: rifero.verified };

  const active = rifero.raffles.filter((r) => r.status === RaffleStatus.PUBLISHED);
  const finished = rifero.raffles.filter((r) => r.status === RaffleStatus.FINISHED);

  return (
    <RiferoTheme primaryColor={rifero.primaryColor} secondaryColor={rifero.secondaryColor}>
      <div className="min-h-screen bg-muted/40 pb-16">
        {/* ── Portada (banner) ── */}
        <div className="relative h-44 w-full overflow-hidden sm:h-60">
          {cover ? (
            <LazyImage src={cover} alt="" className="h-full w-full" loading="eager" />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: 'linear-gradient(135deg, var(--rifero-primary), var(--rifero-secondary))' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: BRAND }} />
        </div>

        <div className="mx-auto max-w-2xl px-4">
          {/* ── Foto de perfil centrada (sobre la portada) ── */}
          <div className="flex justify-center" style={{ marginTop: -photoPx / 2 }}>
            <div className="relative shrink-0">
              <div
                className="overflow-hidden rounded-full border-4 border-background bg-card shadow-xl"
                style={{
                  height: photoPx,
                  width: photoPx,
                  boxShadow: rifero.logoGlow
                    ? '0 0 0 4px hsl(var(--background)), 0 0 14px color-mix(in srgb, var(--rifero-primary) 35%, transparent), 0 12px 28px rgba(0,0,0,0.2)'
                    : undefined,
                }}
              >
                {logo ? (
                  <img src={logo} alt={rifero.publicName} className="h-full w-full object-contain" />
                ) : (
                  <div
                    className="grid h-full w-full place-items-center font-black text-white"
                    style={{ background: BRAND, fontSize: Math.round(photoPx * 0.38) }}
                  >
                    {rifero.publicName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {rifero.verified && (
                <span className="absolute bottom-1 right-1 grid place-items-center rounded-full bg-background p-0.5 shadow-md">
                  <VerifiedBadge size={26} />
                </span>
              )}
            </div>
          </div>

          {/* ── Nombre + bio ── */}
          <div className="mt-3 text-center">
            <h1 className="flex items-center justify-center gap-1.5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {rifero.publicName}
              {rifero.verified && <VerifiedBadge size={22} />}
            </h1>
            {rifero.description && (
              <p className="mx-auto mt-2 max-w-md whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {rifero.description}
              </p>
            )}
          </div>

          {/* ── Estadísticas ── */}
          <div className="mt-4 grid grid-cols-3 divide-x rounded-2xl border bg-card py-3 text-center shadow-sm">
            <Stat value={active.length} label="Disponibles" />
            <Stat value={finished.length} label="Finalizadas" />
            <Stat value={winners.length} label="Ganadores" />
          </div>

          {/* ── Redes y contacto (logos oficiales) ── */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {rifero.facebook && (
              <a
                href={rifero.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid h-11 w-11 place-items-center rounded-full border bg-card text-[#1877F2] shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <FacebookIcon className="h-[22px] w-[22px]" />
              </a>
            )}
            {rifero.instagram && (
              <a
                href={rifero.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-11 w-11 place-items-center rounded-full border bg-card shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <InstagramIcon className="h-[22px] w-[22px]" />
              </a>
            )}
            {rifero.tiktok && (
              <a
                href={rifero.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="grid h-11 w-11 place-items-center rounded-full border bg-card text-foreground shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <TiktokIcon className="h-[21px] w-[21px]" />
              </a>
            )}
            {rifero.whatsapp && (
              <a
                href={buildWhatsappLink(
                  rifero.whatsapp,
                  `Hola ${rifero.publicName}, vi tu página de rifas y tengo una pregunta.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <WhatsappIcon className="h-5 w-5" />
                WhatsApp
              </a>
            )}
          </div>

          {/* ── Rifas disponibles (feed) ── */}
          <section className="mt-8">
            <SectionTitle>Rifas disponibles</SectionTitle>
            {active.length > 0 ? (
              <div className="grid gap-4">
                {active.map((r) => (
                  <RafflePost key={r.id} raffle={r} basePath={basePath} rifero={mini} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Ticket className="h-10 w-10" />}
                title="Aún no hay rifas disponibles"
                description="Este rifero todavía no publica rifas. Síguelo en redes para enterarte primero."
              />
            )}
          </section>

          {/* ── Ganadores ── */}
          {winners.length > 0 && (
            <section className="mt-10">
              <SectionTitle>Ganadores</SectionTitle>
              <div className="grid gap-3">
                {winners.map((w) => (
                  <WinnerCard key={w.id} w={w} />
                ))}
              </div>
            </section>
          )}

          {/* ── Preguntas frecuentes ── */}
          <section className="mt-10">
            <SectionTitle>Preguntas frecuentes</SectionTitle>
            <div className="grid gap-2.5">
              <Faq q="¿Cómo participo?">
                Entra a la rifa, elige tus números disponibles, apártalos con tu nombre y teléfono, y realiza tu pago.
              </Faq>
              <Faq q="¿Cómo pago mis boletos?">
                Haz tu transferencia o depósito a los datos del rifero (los ves en “Métodos de pago”) y sube tu
                comprobante. El organizador confirma tu pago.
              </Faq>
              <Faq q="¿Dónde veo mis boletos?">
                En{' '}
                <Link to={verificarHref} className="font-semibold underline" style={{ color: BRAND }}>
                  Verificar mis boletos
                </Link>{' '}
                buscas con tu teléfono tus boletos apartados o pagados, subes tu comprobante y abres tu boleto digital.
              </Faq>
              <Faq q="¿Cuándo se realiza el sorteo?">
                En la fecha indicada en cada rifa. Tu boleto pagado es tu boleto participante.
              </Faq>
              <Faq q="¿Es confiable?">
                {rifero.verified ? 'Este rifero está verificado. ' : ''}
                Cada boleto pagado genera un boleto digital con código QR para validarlo el día del sorteo.
              </Faq>
            </div>
          </section>

          {/* ── Pie ── */}
          <footer className="mt-14 flex flex-col items-center gap-3 border-t pt-6">
            {rifero.verified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <VerifiedBadge size={15} /> Rifero verificado
              </span>
            )}
            <PoweredBy />
          </footer>
        </div>
      </div>
      <SafeSeal />
    </RiferoTheme>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-2">
      <p className="font-ticket text-xl font-bold" style={{ color: BRAND }}>
        {value}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
