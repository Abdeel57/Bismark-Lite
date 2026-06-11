import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { formatDateMX, UserRole, UserStatus } from '@bismark/shared';
import { adminService, type AdminUserRow } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { PageLoader, EmptyState } from '@/components/ui/misc';
import { PageHeader } from '@/components/layout/DashboardLayout';

const ROLE_LABELS: Record<string, string> = {
  [UserRole.VISITOR]: 'Visitante',
  [UserRole.RIFERO]: 'Rifero',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
};

const ROLE_VARIANT: Record<string, BadgeProps['variant']> = {
  [UserRole.VISITOR]: 'muted',
  [UserRole.RIFERO]: 'info',
  [UserRole.SUPER_ADMIN]: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  [UserStatus.ACTIVE]: 'Activo',
  [UserStatus.SUSPENDED]: 'Suspendido',
  [UserStatus.DELETED]: 'Eliminado',
};

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.SUSPENDED]: 'danger',
  [UserStatus.DELETED]: 'muted',
};

function RoleBadge({ role }: { role: string }) {
  return <Badge variant={ROLE_VARIANT[role] ?? 'muted'}>{ROLE_LABELS[role] ?? role}</Badge>;
}

function UserStatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? 'muted'}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.users(),
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').toLowerCase().includes(q) ||
        (u.slug ?? '').toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div>
      <PageHeader title="Usuarios" description="Todas las cuentas registradas en Bismark." />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o teléfono"
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Sin usuarios"
          description={search ? 'No hay resultados para tu búsqueda.' : 'Aún no hay usuarios registrados.'}
        />
      ) : (
        <>
          {/* Tabla en escritorio */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Correo</th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                    <th className="px-4 py-3 font-semibold">Rol</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Slug</th>
                    <th className="px-4 py-3 font-semibold">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <UserStatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.slug ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateMX(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tarjetas en móvil */}
          <div className="grid gap-3 lg:hidden">
            {filtered.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UserCard({ user }: { user: AdminUserRow }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <UserStatusBadge status={user.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <RoleBadge role={user.role} />
          {user.phone && <Badge variant="muted">{user.phone}</Badge>}
          {user.slug && <Badge variant="secondary">/{user.slug}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">Registrado el {formatDateMX(user.createdAt)}</p>
      </CardContent>
    </Card>
  );
}
