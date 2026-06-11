import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Store,
  Globe,
  MessageCircle,
  Image as ImageIcon,
  Loader2,
  Check,
  X,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import {
  onboardingSchema,
  type OnboardingInput,
  isValidSlug,
  slugify,
  BRAND,
} from '@bismark/shared';
import { riferoService } from '@/services/riferos';
import { uploadService } from '@/services/uploads';
import { useAuthStore } from '@/store/auth';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { cn } from '@/lib/cn';

type SlugState =
  | { status: 'idle' }
  | { status: 'invalid'; reason: string }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'taken'; reason: string };

type Step = 1 | 2;

const STEP1_FIELDS = ['fullName', 'email', 'phone'] as const;

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [step, setStep] = useState<Step>(1);
  const [slugState, setSlugState] = useState<SlugState>({ status: 'idle' });
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      publicName: '',
      slug: '',
      whatsapp: user?.phone ?? '',
      description: '',
      logoUrl: '',
      coverUrl: '',
      facebook: '',
      instagram: '',
      tiktok: '',
      primaryColor: '#2563eb',
      secondaryColor: '#0f172a',
    },
  });

  // Prellenar con los datos del usuario cuando estén disponibles.
  useEffect(() => {
    if (!user) return;
    setValue('fullName', user.name ?? '');
    setValue('email', user.email ?? '');
    setValue('phone', user.phone ?? '');
    setValue('whatsapp', user.phone ?? '');
  }, [user, setValue]);

  const slug = watch('slug');
  const logoUrl = watch('logoUrl');
  const coverUrl = watch('coverUrl');
  const publicName = watch('publicName');
  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  // Verificación de disponibilidad del slug en vivo (con debounce).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const value = (slug ?? '').trim();

    if (!value) {
      setSlugState({ status: 'idle' });
      return;
    }
    if (!isValidSlug(value)) {
      setSlugState({
        status: 'invalid',
        reason: 'Usa de 3 a 32 letras minúsculas, números o guiones (sin acentos ni espacios).',
      });
      return;
    }

    setSlugState({ status: 'checking' });
    debounceRef.current = setTimeout(() => {
      void riferoService
        .checkSlug(value)
        .then((res) => {
          if ((watch('slug') ?? '').trim() !== value) return; // ignorar resultados obsoletos
          if (res.available) setSlugState({ status: 'available' });
          else setSlugState({ status: 'taken', reason: res.reason ?? 'Ese nombre ya está ocupado, elige otro.' });
        })
        .catch(() => {
          setSlugState({ status: 'taken', reason: 'No pudimos verificar la disponibilidad, intenta de nuevo.' });
        });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const onboardingMutation = useMutation({
    mutationFn: (input: OnboardingInput) => riferoService.onboarding(input),
    onSuccess: async () => {
      await fetchMe();
      toast.success('¡Tu página de rifas está lista!');
      navigate('/panel', { replace: true });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'No pudimos guardar tu información. Inténtalo de nuevo.');
    },
  });

  async function handleContinue() {
    const ok = await trigger([...STEP1_FIELDS]);
    if (ok) setStep(2);
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue('slug', slugify(e.target.value), { shouldValidate: false });
  }

  async function handleImage(
    file: File | undefined,
    folder: 'logos' | 'covers',
    field: 'logoUrl' | 'coverUrl',
    setUploading: (v: boolean) => void,
  ) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadService.image(file, folder);
      setValue(field, url, { shouldValidate: true });
      toast.success('Imagen subida.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(data: OnboardingInput) {
    if (slugState.status !== 'available') {
      toast.error('Elige un nombre de página disponible antes de continuar.');
      setStep(2);
      return;
    }
    onboardingMutation.mutate(data);
  }

  const previewUrl = `${(slug ?? '').trim() || 'tu-rifa'}.${BRAND.rootDomain}`;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        {/* Barra de progreso */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className={cn(step === 1 ? 'text-brand' : 'text-muted-foreground')}>1. Tus datos</span>
            <span className={cn(step === 2 ? 'text-brand' : 'text-muted-foreground')}>2. Tu página</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Paso {step} de 2</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5" noValidate>
          {step === 1 && (
            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 text-brand">
                  <User className="h-5 w-5" />
                  <CardTitle className="text-xl font-extrabold">Tus datos</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Confirma tu información de contacto.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="fullName" className="pl-10" placeholder="Ej. Juan Pérez" {...register('fullName')} />
                  </div>
                  {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      className="pl-10"
                      placeholder="tucorreo@ejemplo.com"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      className="pl-10"
                      placeholder="10 dígitos"
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <Button type="button" variant="brand" size="lg" className="w-full" onClick={handleContinue}>
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 text-brand">
                  <Store className="h-5 w-5" />
                  <CardTitle className="text-xl font-extrabold">Tu página de rifas</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Así te verán tus participantes. Puedes cambiarlo después.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="publicName">Nombre público</Label>
                  <div className="relative">
                    <Sparkles className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="publicName"
                      className="pl-10"
                      placeholder="Ej. Rifas Don Juan"
                      {...register('publicName', {
                        onChange: (e) => {
                          if (!(slug ?? '').trim()) setValue('slug', slugify(e.target.value));
                        },
                      })}
                    />
                  </div>
                  {errors.publicName && (
                    <p className="text-destructive text-sm mt-1">{errors.publicName.message}</p>
                  )}
                </div>

                {/* Slug / subdominio con verificación en vivo */}
                <div>
                  <Label htmlFor="slug">Dirección de tu página (subdominio)</Label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="slug"
                      className={cn(
                        'pl-10 pr-10 lowercase',
                        slugState.status === 'available' && 'border-emerald-500 focus-visible:ring-emerald-500',
                        (slugState.status === 'taken' || slugState.status === 'invalid') &&
                          'border-destructive focus-visible:ring-destructive',
                      )}
                      placeholder="tu-rifa"
                      autoCapitalize="none"
                      autoComplete="off"
                      spellCheck={false}
                      value={slug}
                      onChange={handleSlugChange}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {slugState.status === 'checking' && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {slugState.status === 'available' && <Check className="h-4 w-4 text-emerald-600" />}
                      {(slugState.status === 'taken' || slugState.status === 'invalid') && (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    Tu página:&nbsp;<span className="font-semibold text-foreground">{previewUrl}</span>
                  </p>
                  {slugState.status === 'available' && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> Disponible
                    </p>
                  )}
                  {slugState.status === 'taken' && (
                    <p className="text-destructive text-sm mt-1">{slugState.reason}</p>
                  )}
                  {slugState.status === 'invalid' && (
                    <p className="text-destructive text-sm mt-1">{slugState.reason}</p>
                  )}
                  {errors.slug && slugState.status === 'idle' && (
                    <p className="text-destructive text-sm mt-1">{errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp de contacto</Label>
                  <div className="relative">
                    <MessageCircle className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      inputMode="tel"
                      className="pl-10"
                      placeholder="10 dígitos"
                      {...register('whatsapp')}
                    />
                  </div>
                  {errors.whatsapp && <p className="text-destructive text-sm mt-1">{errors.whatsapp.message}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Cuéntale a tus participantes quién eres y qué rifas organizas."
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Logo */}
                <div>
                  <Label>Logo (opcional)</Label>
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-muted">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleImage(e.target.files?.[0], 'logos', 'logoUrl', setLogoUploading)}
                      />
                      <span
                        className={cn(
                          'inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-semibold transition-colors hover:bg-accent',
                          logoUploading && 'pointer-events-none opacity-60',
                        )}
                      >
                        {logoUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                      </span>
                    </label>
                  </div>
                  {errors.logoUrl && <p className="text-destructive text-sm mt-1">{errors.logoUrl.message}</p>}
                </div>

                {/* Portada */}
                <div>
                  <Label>Imagen de portada (opcional)</Label>
                  <div className="overflow-hidden rounded-2xl border bg-muted">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Portada" className="h-32 w-full object-cover" />
                    ) : (
                      <div className="grid h-32 w-full place-items-center text-muted-foreground">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <label className="mt-2 block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handleImage(e.target.files?.[0], 'covers', 'coverUrl', setCoverUploading)}
                    />
                    <span
                      className={cn(
                        'inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-semibold transition-colors hover:bg-accent',
                        coverUploading && 'pointer-events-none opacity-60',
                      )}
                    >
                      {coverUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {coverUrl ? 'Cambiar portada' : 'Subir portada'}
                    </span>
                  </label>
                  {errors.coverUrl && <p className="text-destructive text-sm mt-1">{errors.coverUrl.message}</p>}
                </div>

                {/* Redes sociales */}
                <div className="space-y-3">
                  <Label className="mb-0">Redes sociales (opcional)</Label>
                  <Input placeholder="Facebook (enlace o usuario)" {...register('facebook')} />
                  {errors.facebook && <p className="text-destructive text-sm mt-1">{errors.facebook.message}</p>}
                  <Input placeholder="Instagram (enlace o usuario)" {...register('instagram')} />
                  {errors.instagram && <p className="text-destructive text-sm mt-1">{errors.instagram.message}</p>}
                  <Input placeholder="TikTok (enlace o usuario)" {...register('tiktok')} />
                  {errors.tiktok && <p className="text-destructive text-sm mt-1">{errors.tiktok.message}</p>}
                </div>

                {/* Colores de marca */}
                <div>
                  <Label className="mb-2">Colores de tu marca</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 rounded-xl border bg-background p-3">
                      <input
                        type="color"
                        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                        value={primaryColor ?? '#2563eb'}
                        onChange={(e) => setValue('primaryColor', e.target.value, { shouldValidate: true })}
                      />
                      <span className="text-sm">
                        <span className="block font-medium">Principal</span>
                        <span className="text-xs uppercase text-muted-foreground">{primaryColor}</span>
                      </span>
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border bg-background p-3">
                      <input
                        type="color"
                        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                        value={secondaryColor ?? '#0f172a'}
                        onChange={(e) => setValue('secondaryColor', e.target.value, { shouldValidate: true })}
                      />
                      <span className="text-sm">
                        <span className="block font-medium">Secundario</span>
                        <span className="text-xs uppercase text-muted-foreground">{secondaryColor}</span>
                      </span>
                    </label>
                  </div>
                  {(errors.primaryColor || errors.secondaryColor) && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.primaryColor?.message ?? errors.secondaryColor?.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="sm:w-auto"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    variant="brand"
                    size="lg"
                    className="flex-1"
                    loading={onboardingMutation.isPending || logoUploading || coverUploading}
                    disabled={slugState.status !== 'available'}
                  >
                    {publicName ? `Crear "${publicName}"` : 'Crear mi página'}
                  </Button>
                </div>
                {slugState.status !== 'available' && (
                  <p className="text-center text-xs text-muted-foreground">
                    Elige un subdominio disponible para terminar.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}
