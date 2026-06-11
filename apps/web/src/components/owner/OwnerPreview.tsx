import { Link } from 'react-router-dom';
import { Facebook, Instagram, Music2, Ticket, Trophy, Plus, Eye, Sparkles, ArrowRight } from 'lucide-react';
import {
  RaffleStatus,
  eventLabel,
  formatMXN,
  formatDateMX,
  buildWhatsappLink,
  type RiferoProfileDTO,
  type RaffleDTO,
} from '@bismark/shared';
import { apiAssetUrl } from '@/lib/api';
import { RiferoTheme } from '@/components/brand/RiferoTheme';
import { VerifiedBadge } from '@/components/brand/VerifiedBadge';
import { PoweredBy } from '@/components/brand/PoweredBy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'muted' | 'warning' }> = {
  PUBLISHED: { label: 'Disponible', variant: 'success' },
  FINISHED: { label: 'Finalizada', variant: 'muted' },
  DRAFT: { label: 'Borrador', variant: 'warning' },
  CANCELLED: { label: 'Cancelada', variant: 'muted' },
};

function RaffleCard({ raffle, slug }: { raffle: RaffleDTO; slug: string }) {
  const cover = raffle.images[0]?.url ? apiAssetUrl(raffle.images[0].url) : null;
  const pct = raffle.totalTickets > 0 ? Math.min(100, Math.round((raffle.soldCount / raffle.totalTickets) * 100)) : 0;
  const badge = STATUS_BADGE[raffle.status] ?? STATUS_BADGE.DRAFT;
  const isPublic = raffle.status === RaffleStatus.PUBLISHED || raffle.status === RaffleStatus.FINISHED;

  const inner = (
    <div className="overflow-hidden rounded-2xl border bg-card transition-transform active:scale-[0.99]">
      {cover ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <img src={cover} alt={raffle.title} className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute left-3 top-3">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </span>
        </div>
      ) : (
        <div
          className="relative grid aspect-[16/9] w-full place-items-center"
          style={{ background: 'linear-gradient(135deg, var(--rifero-primary), var(--rifero-secondary))' }}
        >
          <Ticket className="h-10 w-10 text-white/40" />
          <span className="absolute left-3 top-3">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </span>
        </div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[var(--rifero-primary)] px-2 py-0.5 text-[11px] font-extrabold text-white">
            {eventLabel(raffle.eventNumber)}
          </span>
          {raffle.drawDate && <span className="text-xs text-muted-foreground">Sorteo: {formatDateMX(raffle.drawDate)}</span>}
        </div>
        <h3 className="font-bold leading-tight">{raffle.title}</h3>
        {raffle.prize && <p className="line-clamp-1 text-sm text-muted-foreground">{raffle.prize}</p>}
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-[var(--rifero-primary)]">{formatMXN(raffle.ticketPrice)}</span>
          <span className="text-xs font-medium text-muted-foreground">
            {raffle.soldCount}/{raffle.totalTickets} vendidos
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-[var(--rifero-primary)]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );

  if (isPublic) {
    return (
      <a href={`/r/${slug}/e${raffle.eventNumber}`} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return <Link to={`/panel/admin/rifas/${raffle.id}/editar`} className="block">{inner}</Link>;
}

export function OwnerPreview({ profile, raffles }: { profile: RiferoProfileDTO; raffles: RaffleDTO[] }) {
  const slug = profile.slug;
  const social = [
    profile.facebook && { icon: Facebook, href: profile.facebook },
    profile.instagram && { icon: Instagram, href: profile.instagram },
    profile.tiktok && { icon: Music2, href: profile.tiktok },
  ].filter(Boolean) as { icon: typeof Facebook; href: string }[];

  const active = raffles.filter((r) => r.status === 'PUBLISHED');
  const others = raffles.filter((r) => r.status !== 'PUBLISHED');

  return (
    <RiferoTheme primaryColor={profile.primaryColor} secondaryColor={profile.secondaryColor}>
      <div className="min-h-screen bg-background pb-28">
        {/* Aviso de vista previa */}
        {!profile.hasActivePlan && (
          <div className="sticky top-0 z-20 flex items-center gap-3 bg-[#070b18] px-4 py-2.5 text-white">
            <Eye className="h-4 w-4 shrink-0 text-brand-gold" />
            <p className="flex-1 text-xs sm:text-sm">
              <span className="font-semibold">Vista previa.</span> Activa un plan para que tu página sea pública.
            </p>
            <Button asChild size="sm" variant="brand" className="shrink-0 rounded-full">
              <Link to="/panel/admin/plan">Activar plan</Link>
            </Button>
          </div>
        )}

        {/* Portada */}
        <div
          className="relative h-40 w-full bg-cover bg-center sm:h-56"
          style={{
            backgroundColor: 'var(--rifero-secondary)',
            backgroundImage: profile.coverUrl ? `url(${apiAssetUrl(profile.coverUrl)})` : undefined,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="mx-auto max-w-2xl px-4">
          {/* Encabezado del rifero */}
          <div className="-mt-12 flex flex-col items-center text-center">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl bg-card shadow-xl ring-4 ring-background">
              {profile.logoUrl ? (
                <img src={apiAssetUrl(profile.logoUrl)} alt={profile.publicName} className="h-full w-full object-cover" />
              ) : (
                <span
                  className="grid h-full w-full place-items-center text-4xl font-black text-white"
                  style={{ backgroundColor: 'var(--rifero-primary)' }}
                >
                  {profile.publicName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <h1 className="text-2xl font-extrabold">{profile.publicName}</h1>
              {profile.verified && <VerifiedBadge size={22} />}
            </div>
            {profile.description && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{profile.description}</p>
            )}

            {/* Contacto */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {profile.whatsapp && (
                <Button asChild className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                  <a
                    href={buildWhatsappLink(profile.whatsapp, `Hola ${profile.publicName}, vi tu página de rifas.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
              )}
              {social.map((s, i) => (
                <a
                  key={i}
                  href={s.href.startsWith('http') ? s.href : `https://${s.href}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Rifas */}
          <div className="mt-8">
            {raffles.length === 0 ? (
              <div className="rounded-3xl border border-dashed bg-card p-8 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--rifero-primary)]/10 text-[var(--rifero-primary)]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-bold">Tu página está casi lista</h2>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  Crea tu primera rifa para que aparezca aquí. Toca la tuerca ⚙ o el botón de abajo.
                </p>
                <Button asChild variant="brand" size="lg" className="mt-5 rounded-full">
                  <Link to="/panel/admin/rifas/nueva">
                    <Plus className="h-5 w-5" /> Crear mi primera rifa
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {active.length > 0 && (
                  <section className="mb-8">
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
                      <Ticket className="h-5 w-5 text-[var(--rifero-primary)]" /> Rifas activas
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {active.map((r) => (
                        <RaffleCard key={r.id} raffle={r} slug={slug} />
                      ))}
                    </div>
                  </section>
                )}
                {others.length > 0 && (
                  <section className="mb-8">
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
                      <Trophy className="h-5 w-5 text-muted-foreground" /> Otras rifas
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {others.map((r) => (
                        <RaffleCard key={r.id} raffle={r} slug={slug} />
                      ))}
                    </div>
                  </section>
                )}
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link to="/panel/admin/rifas/nueva">
                    <Plus className="h-4 w-4" /> Crear otra rifa <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          <footer className="mt-12 flex justify-center border-t pt-6">
            <PoweredBy />
          </footer>
        </div>
      </div>
    </RiferoTheme>
  );
}
