import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Eye } from 'lucide-react';
import { riferoService } from '@/services/riferos';
import { raffleService } from '@/services/raffles';
import { ApiError } from '@/lib/api';
import { PageLoader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { useNotificationsSummary } from '@/lib/pwa/useNotificationsSummary';
import PublicRifero from '@/pages/public/PublicRifero';

// Botón flotante de la tuerca (abre el administrador). Muestra un badge con el
// total de avisos pendientes (órdenes + comprobantes). Sondea cada 30 s.
function FloatingGear() {
  const { total: pending } = useNotificationsSummary();
  return (
    <Link
      to="/panel/admin/ordenes"
      aria-label={pending > 0 ? `Abrir administrador, ${pending} avisos` : 'Abrir administrador'}
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand px-4 py-3.5 text-white shadow-2xl shadow-brand/40 transition-transform hover:scale-105 active:scale-95 safe-bottom"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand/40" style={{ animationDuration: '3s' }} />
      <Settings className="h-6 w-6 transition-transform group-hover:rotate-90" />
      <span className="hidden text-sm font-semibold sm:inline">Administrar</span>
      {pending > 0 && (
        <span
          aria-hidden
          className="absolute -right-1.5 -top-1.5 grid h-6 min-w-[24px] place-items-center rounded-full border-2 border-background bg-red-500 px-1.5 text-xs font-extrabold leading-none text-white shadow-lg"
        >
          {pending > 99 ? '99+' : pending}
        </span>
      )}
    </Link>
  );
}

// Aviso de vista previa (cuando aún no hay plan activo). Barra superior fija.
function PreviewBanner() {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-[#070b18] px-4 py-2.5 text-white">
      <Eye className="h-4 w-4 shrink-0 text-brand-gold" />
      <p className="flex-1 text-xs sm:text-sm">
        <span className="font-semibold">Vista previa.</span> Activa un plan para que tu página sea pública.
      </p>
      <Button asChild size="sm" variant="brand" className="shrink-0 rounded-full">
        <Link to="/panel/admin/plan">Activar plan</Link>
      </Button>
    </div>
  );
}

export function OwnerShell() {
  const location = useLocation();
  const qc = useQueryClient();
  const drawerOpen = location.pathname.startsWith('/panel/admin');

  const profileQ = useQuery({ queryKey: ['rifero', 'me'], queryFn: () => riferoService.me() });
  const rafflesQ = useQuery({ queryKey: ['raffles'], queryFn: () => raffleService.list() });

  // Al cerrar el administrador (volver a /panel), refrescar para ver los cambios.
  useEffect(() => {
    if (location.pathname === '/panel') {
      void qc.invalidateQueries({ queryKey: ['rifero', 'me'] });
      void qc.invalidateQueries({ queryKey: ['raffles'] });
    }
  }, [location.pathname, qc]);

  const profile = profileQ.data?.profile;
  const raffles = useMemo(() => rafflesQ.data?.items ?? [], [rafflesQ.data]);

  // Construye los MISMOS datos que consume la página pública (PublicRifero),
  // pero a partir de los datos del dueño → se ve igual aunque no tenga plan.
  const previewData = useMemo(() => {
    if (!profile) return undefined;
    return {
      active: true,
      rifero: {
        id: profile.id,
        publicName: profile.publicName,
        slug: profile.slug,
        logoUrl: profile.logoUrl,
        coverUrl: profile.coverUrl,
        description: profile.description,
        whatsapp: profile.whatsapp,
        facebook: profile.facebook,
        instagram: profile.instagram,
        tiktok: profile.tiktok,
        primaryColor: profile.primaryColor,
        secondaryColor: profile.secondaryColor,
        templateKey: profile.templateKey,
        logoScale: profile.logoScale,
        logoGlow: profile.logoGlow,
        verified: profile.verified,
        raffles: raffles.map((r) => ({
          id: r.id,
          eventNumber: r.eventNumber,
          eventLabel: r.eventLabel,
          title: r.title,
          prize: r.prize,
          ticketPrice: r.ticketPrice,
          totalTickets: r.totalTickets,
          soldCount: r.soldCount,
          coverUrl: r.images[0]?.url ?? null,
          status: r.status,
          drawDate: r.drawDate,
        })),
      },
      winners: [],
    };
  }, [profile, raffles]);

  if (profileQ.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <PageLoader label="Cargando tu página..." />
      </div>
    );
  }

  // Caso raro: super admin sin perfil de rifero entra a /panel.
  if (profileQ.isError || !profile || !previewData) {
    const isForbidden = profileQ.error instanceof ApiError && profileQ.error.status === 403;
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="text-xl font-bold">Esta sección es para riferos</h1>
          <p className="mt-2 text-muted-foreground">
            {isForbidden ? 'Tu cuenta no tiene una página de rifas.' : 'No pudimos cargar tu página.'}
          </p>
          <Button asChild className="mt-6">
            <Link to="/admin">Ir al panel de administración</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!profile.hasActivePlan && <PreviewBanner />}
      <PublicRifero previewData={previewData} />
      {!drawerOpen && <FloatingGear />}
      <Outlet />
    </>
  );
}
