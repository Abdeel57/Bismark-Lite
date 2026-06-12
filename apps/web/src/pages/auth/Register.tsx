import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@bismark/shared';
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

export default function Register() {
  useDocumentTitle('Crea tu cuenta — Bismark');
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: undefined,
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: ({ user }) => {
      setUser(user);
      identify(user.id, { role: user.role });
      track('signup_completed');
      toast.success('¡Cuenta creada! Vamos a configurar tu página de rifas.');
      navigate('/onboarding', { replace: true });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'No pudimos crear tu cuenta. Inténtalo de nuevo.');
    },
  });

  return (
    <AuthLayout
      ticketLabel="Boleto de registro"
      badge="Empieza gratis hoy"
      sideTitle={
        <>
          Crea tu <span className="text-brand-mint">página de rifas</span>
        </>
      }
      sideSubtitle="Tu página personalizada, boletos digitales y pagos directos a ti. Listo en minutos, sin tarjeta."
      bullets={[
        'Tu subdominio tunombre.bismark.com',
        'Personaliza colores, logo y portada',
        'Recibe órdenes por WhatsApp',
        'Sin comisión por boleto',
      ]}
    >
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Crea tu cuenta gratis</h1>
        <p className="mt-1.5 text-muted-foreground">Organiza tus rifas, recibe pagos y comparte tu página en minutos.</p>
      </div>

      <form onSubmit={handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4" noValidate>
        <TicketField label="Tu nombre completo" htmlFor="name" icon={User} error={errors.name?.message}>
          <Input id="name" type="text" autoComplete="name" placeholder="Ej. Juan Pérez" className={ticketInputClass} {...register('name')} />
        </TicketField>

        <TicketField label="Correo electrónico" htmlFor="email" icon={Mail} error={errors.email?.message}>
          <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" className={ticketInputClass} {...register('email')} />
        </TicketField>

        <TicketField label="Teléfono (WhatsApp)" htmlFor="phone" icon={Phone} error={errors.phone?.message}>
          <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10 dígitos (ej. 5512345678)" className={ticketInputClass} {...register('phone')} />
        </TicketField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TicketField label="Contraseña" htmlFor="password" icon={Lock} error={errors.password?.message}>
            <PasswordInput id="password" autoComplete="new-password" placeholder="Mín. 8 caracteres" className={ticketInputClass} {...register('password')} />
          </TicketField>

          <TicketField label="Confírmala" htmlFor="confirmPassword" icon={Lock} error={errors.confirmPassword?.message}>
            <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="Repítela" className={ticketInputClass} {...register('confirmPassword')} />
          </TicketField>
        </div>

        <div>
          <label
            htmlFor="acceptTerms"
            className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-dashed border-[#E3E9F8] bg-[#F8FAFF] px-3.5 py-3 transition-colors hover:border-brand/40 dark:border-border dark:bg-muted/30"
          >
            <input
              id="acceptTerms"
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-input accent-brand"
              {...register('acceptTerms')}
            />
            <span className="text-sm text-muted-foreground">
              Acepto los{' '}
              <a href="/terminos" target="_blank" rel="noopener" className="font-semibold text-foreground underline underline-offset-2 hover:text-brand">
                Términos y Condiciones
              </a>{' '}
              y el{' '}
              <a href="/privacidad" target="_blank" rel="noopener" className="font-semibold text-foreground underline underline-offset-2 hover:text-brand">
                Aviso de Privacidad
              </a>{' '}
              de Bismark.
            </span>
          </label>
          {errors.acceptTerms && <p className="mt-1.5 text-sm text-destructive">{errors.acceptTerms.message}</p>}
        </div>

        <Button type="submit" variant="brand" size="lg" className="w-full rounded-full" loading={registerMutation.isPending}>
          Crear mi cuenta <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
