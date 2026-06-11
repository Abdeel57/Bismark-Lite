import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@bismark/shared';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/auth';
import { ApiError } from '@/lib/api';
import { track, identify } from '@/lib/analytics';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      badge="Empieza gratis hoy"
      sideTitle={
        <>
          Crea tu <span className="text-brand-gold">página de rifas</span>
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
        <div>
          <Label htmlFor="name">Tu nombre completo</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" type="text" autoComplete="name" placeholder="Ej. Juan Pérez" className="pl-10" {...register('name')} />
          </div>
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" className="pl-10" {...register('email')} />
          </div>
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10 dígitos (ej. 5512345678)" className="pl-10" {...register('phone')} />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" autoComplete="new-password" placeholder="Mín. 8 caracteres" className="pl-10" {...register('password')} />
            </div>
            {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confírmala</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repítela" className="pl-10" {...register('confirmPassword')} />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="acceptTerms" className="flex cursor-pointer items-start gap-3">
            <input
              id="acceptTerms"
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-input accent-brand"
              {...register('acceptTerms')}
            />
            <span className="text-sm text-muted-foreground">
              Acepto los <span className="font-medium text-foreground">Términos y Condiciones</span> y el{' '}
              <span className="font-medium text-foreground">Aviso de Privacidad</span> de Bismark.
            </span>
          </label>
          {errors.acceptTerms && <p className="mt-1 text-sm text-destructive">{errors.acceptTerms.message}</p>}
        </div>

        <Button type="submit" variant="brand" size="lg" className="w-full rounded-xl" loading={registerMutation.isPending}>
          Crear mi cuenta <ArrowRight className="h-5 w-5" />
        </Button>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Tus datos están protegidos. Sin cargos ni tarjeta para empezar.</span>
        </div>
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
