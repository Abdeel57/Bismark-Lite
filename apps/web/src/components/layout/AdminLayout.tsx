import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Gauge, Users, Store, Ticket, CreditCard, BadgeDollarSign } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/admin', label: 'Métricas', icon: Gauge, end: true },
  { to: '/admin/riferos', label: 'Riferos', icon: Store, end: false },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users, end: false },
  { to: '/admin/rifas', label: 'Rifas', icon: Ticket, end: false },
  { to: '/admin/suscripciones', label: 'Suscripciones', icon: CreditCard, end: false },
  { to: '/admin/planes', label: 'Planes', icon: BadgeDollarSign, end: false },
];

export function AdminLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo />
            <Badge variant="secondary">Super Admin</Badge>
          </div>
          <ThemeToggle />
        </div>
        {/* Tabs horizontales (desktop) / scroll (móvil) */}
        <div className="mx-auto max-w-6xl overflow-x-auto no-scrollbar px-2">
          <div className="flex gap-1 pb-2">
            {NAV.map((item) => {
              const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
