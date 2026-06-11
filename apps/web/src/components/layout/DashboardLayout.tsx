import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Ticket, FileBarChart, Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/dashboard/ordenes', label: 'Órdenes', icon: Receipt, end: false },
  { to: '/dashboard/rifas', label: 'Rifas', icon: Ticket, end: false },
  { to: '/dashboard/reportes', label: 'Reportes', icon: FileBarChart, end: false },
  { to: '/dashboard/mas', label: 'Más', icon: Menu, end: false },
];

export function DashboardLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <NavLink to="/dashboard">
            <Logo />
          </NavLink>
          <ThemeToggle />
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-3xl px-4 py-5 pb-28 animate-fade-in">
        <Outlet />
      </main>

      {/* Bottom navigation (móvil tipo app) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {NAV.map((item) => {
            const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'fill-primary/10')} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Encabezado de página reutilizable dentro del dashboard.
export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {back}
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
