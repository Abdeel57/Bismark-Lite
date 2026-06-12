import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginInput, type AuthUserDTO } from '@bismark/shared';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/auth';
import { ApiError } from '@/lib/api';
import { track, identify } from '@/lib/analytics';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { TicketField, ticketInputClass } from '@/components/ui/ticket-field';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

function destinationFor(user: AuthUserDTO): string {
  if (user.role === 'SUPER_ADMIN') return '/admin';
  if (!user.hasProfile) return '/onboarding';
  return '/panel';
}

export default function Login() {
  useDocumentTitle('Inicia sesión — Bismark');
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: ({ user }) => {
      setUser(user);
      identify(user.id, { role: user.role });
      track('login_completed');
      toast.success(`¡Bienvenido de nuevo, ${user.name.split(' ')[0]}!`);
      navigate(destinationFor(user), { replace: true });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'No pudimos iniciar sesión. Inténtalo de nuevo.');
    },
  });

  return (
    <AuthLayout
      ticketLabel="Boleto de acceso"
      badge="Bienvenido de nuevo"
      sideTitle={
        <>
          Tus rifas, <span className="text-brand-mint">bajo control</span>
        </>
      }
      sideSubtitle="Administra boletos, órdenes, pagos y sorteos desde un solo panel, directo en tu celular."
      bullets={[
        'Órdenes y pagos en tiempo real',
        'Boletos digitales con QR',
        'Sorteos con tómbola digital',
        'Reportes en Excel y PDF',
      ]}
    >
      <div className="mb-7">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Inicia sesión</h1>
        <p className="mt-1.5 text-muted-foreground">Entra a tu panel para organizar tus rifas.</p>
      </div>

      <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4" noValidate>
        <TicketField label="Correo electrónico" htmlFor="email" icon={Mail} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            className={ticketInputClass}
            {...register('email')}
          />
        </TicketField>

        <TicketField
          label="Contraseña"
          htmlFor="password"
          icon={Lock}
          error={errors.password?.message}
          right={
            <Link to="/recuperar" className="text-xs font-semibold text-brand hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            className={ticketInputClass}
            {...register('password')}
          />
        </TicketField>

        <Button type="submit" variant="brand" size="lg" className="w-full rounded-full" loading={loginMutation.isPending}>
          Entrar <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-brand hover:underline">
          Crea tu cuenta gratis
        </Link>
      </p>
    </AuthLayout>
  );
}
