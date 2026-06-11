import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Palette,
  CreditCard,
  Crown,
  Settings as SettingsIcon,
  ExternalLink,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/misc';
import { cn } from '@/lib/cn';

interface MenuItem {
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  href?: string;
  external?: boolean;
}

function MenuRow({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent active:bg-accent">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight">{item.label}</p>
        {item.description && (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
      {item.external ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return (
    <Link to={item.to ?? '#'} className="block">
      {content}
    </Link>
  );
}

export default function More() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const items: MenuItem[] = [
    { label: 'Perfil', description: 'Tus datos personales', icon: User, to: '/dashboard/perfil' },
    {
      label: 'Diseño de mi página',
      description: 'Colores, logo y portada',
      icon: Palette,
      to: '/dashboard/diseno',
    },
    {
      label: 'Datos de pago',
      description: 'Cuenta, CLABE e instrucciones',
      icon: CreditCard,
      to: '/dashboard/pagos',
    },
    { label: 'Mi plan', description: 'Suscripción y límites', icon: Crown, to: '/dashboard/plan' },
    {
      label: 'Configuración',
      description: 'Ajustes de tus rifas',
      icon: SettingsIcon,
      to: '/dashboard/configuracion',
    },
  ];

  if (user?.slug) {
    items.push({
      label: 'Ver mi página pública',
      description: `bismark.com/r/${user.slug}`,
      icon: ExternalLink,
      href: `/r/${user.slug}`,
      external: true,
    });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div>
      <PageHeader title="Más" description="Configura tu cuenta y tu página de rifas." />

      <Card className="overflow-hidden">
        {items.map((item, i) => (
          <div key={item.label}>
            {i > 0 && <Separator />}
            <MenuRow item={item} />
          </div>
        ))}
      </Card>

      {user?.role === 'SUPER_ADMIN' && (
        <Card className="mt-4 overflow-hidden">
          <MenuRow
            item={{
              label: 'Panel admin',
              description: 'Administración de la plataforma',
              icon: Shield,
              to: '/admin',
            }}
          />
        </Card>
      )}

      <Button
        variant="outline"
        size="lg"
        className={cn('mt-6 w-full text-destructive hover:text-destructive')}
        onClick={() => void handleLogout()}
      >
        <LogOut className="h-5 w-5" />
        Cerrar sesión
      </Button>
    </div>
  );
}
