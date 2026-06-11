import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2, MailCheck } from 'lucide-react';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@bismark/shared';
import { authService } from '@/services/auth';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const SIDE = {
  badge: 'Recupera tu cuenta',
  sideTitle: (
    <>
      Vuelve a tomar <span className="text-brand-gold">el control</span>
    </>
  ),
  sideSubtitle: 'Te enviamos un enlace seguro a tu correo para que crees una nueva contraseña en segundos.',
  bullets: [
    'Enlace seguro de un solo uso',
    'Vence en pocos minutos',
    'Sin perder tus rifas ni tus órdenes',
    'Soporte por WhatsApp si lo necesitas',
  ],
};

// ── Estado 1: pedir el enlace de recuperación ──────────────────────────────
function RequestLinkForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: ForgotPasswordInput) => authService.forgotPassword(input),
    // La API responde 200 aunque el correo no exista (no filtra cuentas).
    onSuccess: () => setSentTo(getValues('email')),
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'No pudimos enviar el correo. Inténtalo de nuevo.'),
  });

  if (sentTo) {
    return (
      <div className="animate-reveal text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
          <MailCheck className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Revisa tu correo</h1>
        <p className="mt-2 text-muted-foreground">
          Si <strong className="text-foreground">{sentTo}</strong> tiene una cuenta, le enviamos un enlace para
          restablecer la contraseña. Revisa también la carpeta de spam.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="mt-6 w-full rounded-xl"
          onClick={() => setSentTo(null)}
        >
          Usar otro correo
        </Button>
        <p className="mt-7 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Recupera tu acceso</h1>
        <p className="mt-1.5 text-muted-foreground">
          Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" variant="brand" size="lg" className="w-full rounded-xl" loading={mutation.isPending}>
          Enviar enlace <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}

// ── Estado 2: fijar la nueva contraseña con el token del correo ─────────────
function SetNewPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: ResetPasswordInput) => authService.resetPassword(input),
    onSuccess: () => {
      toast.success('¡Listo! Tu contraseña fue actualizada. Ya puedes iniciar sesión.');
      navigate('/login', { replace: true });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'No pudimos cambiar tu contraseña. Solicita un enlace nuevo.',
      ),
  });

  return (
    <>
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Crea tu nueva contraseña</h1>
        <p className="mt-1.5 text-muted-foreground">Elige una contraseña segura de al menos 8 caracteres.</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="password">Nueva contraseña</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="pl-10"
              {...register('password')}
            />
          </div>
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirma tu contraseña</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              className="pl-10"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" variant="brand" size="lg" className="w-full rounded-xl" loading={mutation.isPending}>
          Guardar contraseña <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}

export default function RecoverPassword() {
  useDocumentTitle('Recupera tu acceso — Bismark');
  const [params] = useSearchParams();
  const token = params.get('token')?.trim();

  return (
    <AuthLayout
      badge={SIDE.badge}
      sideTitle={SIDE.sideTitle}
      sideSubtitle={SIDE.sideSubtitle}
      bullets={SIDE.bullets}
    >
      {token ? <SetNewPasswordForm token={token} /> : <RequestLinkForm />}
    </AuthLayout>
  );
}
