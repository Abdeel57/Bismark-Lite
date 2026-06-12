import { useEffect, useState, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Receipt, Ticket, Menu, type LucideIcon } from 'lucide-react';
import { PageLoader } from '@/components/ui/misc';
import { cn } from '@/lib/cn';
import { useNotificationsSummary } from '@/lib/pwa/useNotificationsSummary';
import { MoreMenu } from './MoreMenu';

function sectionTitle(pathname: string): string {
  if (pathname.startsWith('/panel/admin/ordenes')) return 'Órdenes';
  if (pathname.startsWith('/panel/admin/rifas')) return 'Rifas';
  if (pathname.startsWith('/panel/admin/diseno')) return 'Apariencia';
  if (pathname.startsWith('/panel/admin/perfil')) return 'Perfil';
  if (pathname.startsWith('/panel/admin/pagos')) return 'Datos de pago';
  if (pathname.startsWith('/panel/admin/reportes')) return 'Reportes';
  if (pathname.startsWith('/panel/admin/plan')) return 'Mi plan';
  if (pathname.startsWith('/panel/admin/configuracion')) return 'Ajustes';
  if (pathname.startsWith('/panel/admin/inicio')) return 'Inicio';
  return 'Administrador';
}

function Tab({
  label,
  icon: Icon,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-1 flex-col items-center justify-center gap-1"
      aria-current={active ? 'page' : undefined}
    >
      <span className={cn('absolute top-0 h-[3px] w-9 rounded-full transition-colors', active ? 'bg-brand' : 'bg-transparent')} />
      <span className="relative">
        <Icon
          className={cn('h-[22px] w-[22px] transition-colors', active ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground')}
          strokeWidth={active ? 2.4 : 2}
        />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-2.5 -top-2 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className={cn('text-[11px] tracking-tight transition-colors', active ? 'font-bold text-brand' : 'font-medium text-muted-foreground')}>
        {label}
      </span>
    </button>
  );
}

export function AdminDrawer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { total: pendingTotal } = useNotificationsSummary();
  const [moreOpen, setMoreOpen] = useState(false);

  const close = () => navigate('/panel');

  // Cerrar con Escape + bloquear scroll del fondo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onInicio = location.pathname.startsWith('/panel/admin/inicio');
  const onOrdenes = location.pathname.startsWith('/panel/admin/ordenes');
  const onRifas = location.pathname.startsWith('/panel/admin/rifas');
  const inicioActive = !moreOpen && onInicio;
  const ordenesActive = !moreOpen && onOrdenes;
  const rifasActive = !moreOpen && onRifas;
  const masActive = moreOpen || (!onInicio && !onOrdenes && !onRifas);

  const goTab = (to: string) => {
    setMoreOpen(false);
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop (desktop): deja ver la página detrás, click cierra */}
      <button
        aria-label="Cerrar administrador"
        onClick={close}
        className="hidden flex-1 animate-fade-in-fast cursor-default bg-black/40 backdrop-blur-[2px] lg:block"
      />

      {/* Panel */}
      <aside className="flex h-full w-full animate-slide-in-right flex-col border-l bg-background shadow-2xl sm:max-w-lg lg:max-w-xl">
        {/* Barra superior: título de sección + cerrar */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4 safe-top">
          <h2 className="truncate font-display text-xl font-extrabold tracking-tight">
            {moreOpen ? 'Más' : sectionTitle(location.pathname)}
          </h2>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Cerrar
          </button>
        </header>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {moreOpen ? (
            <MoreMenu onPick={goTab} />
          ) : (
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          )}
        </div>

        {/* Menú inferior: 4 pestañas (único lugar con iconos) */}
        <nav className="flex h-16 shrink-0 items-stretch border-t bg-background/95 backdrop-blur safe-bottom">
          <Tab label="Inicio" icon={Home} active={inicioActive} onClick={() => goTab('/panel/admin/inicio')} />
          <Tab label="Órdenes" icon={Receipt} active={ordenesActive} badge={pendingTotal} onClick={() => goTab('/panel/admin/ordenes')} />
          <Tab label="Rifas" icon={Ticket} active={rifasActive} onClick={() => goTab('/panel/admin/rifas')} />
          <Tab label="Más" icon={Menu} active={masActive} onClick={() => setMoreOpen(true)} />
        </nav>
      </aside>
    </div>
  );
}
