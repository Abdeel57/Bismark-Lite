import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Eye } from 'lucide-react';
import { riferoService } from '@/services/riferos';
import { raffleService } from '@/services/raffles';
import { ApiError } from '@/lib/api';
import { PageLoader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { useNotificationsSummary } from '@/lib/pwa/useNotificationsSummary';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/lib/cn';
import PublicRifero from '@/pages/public/PublicRifero';

// Botón flotante de la tuerca (abre el administrador). Muestra un badge con el
// total de avisos pendientes (órdenes + comprobantes). Sondea cada 30 s. Se
// esconde suavemente al desplazarse hacia abajo (despeja el contenido y evita
// el salto de los `fixed` al colapsar la barra de URL del navegador móvil).
function FloatingGear() {
  const { total: pending } = useNotificationsSummary();
  const hidden = useHideOnScroll();
  return (
    <Link
      to="/panel/admin/ordenes"
      aria-label={pending > 0 ? `Abrir administrador, ${pending} avisos` : 'Abrir administrador'}
      className={cn(
        'group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand px-4 py-3.5 text-white shadow-2xl shadow-brand/40 transition-all duration-300 hover:scale-105 active:scale-95 safe-bottom',
        hidden && 'pointer-events-none translate-y-[150%] opacity-0',
      )}
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

// Bienvenida de primera vez: explica que ESTA es su página pública y dónde está
// el administrador (la tuerca). Se muestra una sola vez (localStorage).
const INTRO_KEY = 'bsk-admin-intro';

function FirstTimeIntro({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const dismiss = () => {
    localStorage.setItem(INTRO_KEY, '1');
    onDone();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center">
      <div className="w-full max-w-sm animate-slide-up rounded-3xl border bg-card p-6 shadow-2xl">
        <p className="text-3xl">👋</p>
        <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight">¡Esta es tu página!</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Así la ven tus compradores. Para <strong className="text-foreground">crear rifas, cobrar y configurar todo</strong>,
          usa el botón <strong className="text-foreground">Administrar</strong> (la tuerca azul de abajo a la derecha).
        </p>
        <div className="mt-5 space-y-2">
          <Button
            variant="brand"
            size="lg"
            className="w-full rounded-xl"
            onClick={() => {
              dismiss();
              navigate('/panel/admin/inicio');
            }}
          >
            Abrir mi administrador
          </Button>
          <Button variant="ghost" size="lg" className="w-full rounded-xl" onClick={dismiss}>
            Ver mi página primero
          </Button>
        </div>
      </div>
    </div>
  );
}

// Aviso de vista previa (cuando aún no hay plan activo). Barra superior fija.
function PreviewBanner() {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-brand-ink px-4 py-2.5 text-white">
      <Eye className="h-4 w-4 shrink-0 text-brand-mint" />
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
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(INTRO_KEY));

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
      <div className="grid min-h-[100dvh] place-items-center">
        <PageLoader label="Cargando tu página..." />
      </div>
    );
  }

  // Caso raro: super admin sin perfil de rifero entra a /panel.
  if (profileQ.isError || !profile || !previewData) {
    const isForbidden = profileQ.error instanceof ApiError && profileQ.error.status === 403;
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6 text-center">
        <div className="w-full max-w-sm">
          {isForbidden ? (
            <>
              <h1 className="text-xl font-bold">Esta sección es para riferos</h1>
              <p className="mt-2 text-muted-foreground">Tu cuenta no tiene una página de rifas.</p>
              <Button asChild className="mt-6 w-full" size="lg">
                <Link to="/admin">Ir al panel de administración</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">No pudimos cargar tu página</h1>
              <p className="mt-2 text-muted-foreground">
                Revisa tu conexión a internet e inténtalo de nuevo.
              </p>
              <Button
                className="mt-6 w-full"
                size="lg"
                loading={profileQ.isFetching}
                onClick={() => void profileQ.refetch()}
              >
                Reintentar
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full" size="lg">
                <Link to="/login">Volver a iniciar sesión</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {!profile.hasActivePlan && <PreviewBanner />}
      <PublicRifero previewData={previewData} />
      {!drawerOpen && <FloatingGear />}
      {!drawerOpen && showIntro && <FirstTimeIntro onDone={() => setShowIntro(false)} />}
      <Outlet />
    </>
  );
}
