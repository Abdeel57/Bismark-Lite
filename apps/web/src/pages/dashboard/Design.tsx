import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Upload, Trash2, Check, Loader2 } from 'lucide-react';
import { riferoService } from '@/services/riferos';
import { uploadService, type UploadFolder } from '@/services/uploads';
import { ApiError, apiAssetUrl } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PageLoader, Spinner } from '@/components/ui/misc';
import { VerifiedBadge } from '@/components/brand/VerifiedBadge';
import { RiferoTheme } from '@/components/brand/RiferoTheme';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';

const TEMPLATES = [
  { value: 'classic', label: 'Clásico' },
  { value: 'moderno', label: 'Moderno' },
];
const DEFAULT_PRIMARY = '#2751fb';
const DEFAULT_SECONDARY = '#0f172a';

interface DesignState {
  publicName: string;
  logoUrl: string;
  coverUrl: string;
  primaryColor: string;
  secondaryColor: string;
  templateKey: string;
  logoScale: number;
  logoGlow: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

function ImageUploader({
  label,
  value,
  folder,
  aspect,
  onChange,
}: {
  label: string;
  value: string;
  folder: UploadFolder;
  aspect: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadService.image(file, folder);
      onChange(url);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className={cn('relative grid w-full place-items-center overflow-hidden rounded-2xl border border-dashed bg-muted/40', aspect)}>
        {value ? (
          <img src={apiAssetUrl(value)} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <Spinner />
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          {value ? 'Cambiar' : 'Subir imagen'}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => onChange('')}>
            <Trash2 className="h-4 w-4" />
            Quitar
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}

export default function Design() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['rifero', 'me'], queryFn: () => riferoService.me() });
  const profile = data?.profile;

  const [state, setState] = useState<DesignState>({
    publicName: '',
    logoUrl: '',
    coverUrl: '',
    primaryColor: DEFAULT_PRIMARY,
    secondaryColor: DEFAULT_SECONDARY,
    templateKey: 'classic',
    logoScale: 100,
    logoGlow: false,
  });
  const [status, setStatus] = useState<SaveStatus>('idle');
  const initRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (profile && !initRef.current) {
      initRef.current = true;
      setState({
        publicName: profile.publicName ?? '',
        logoUrl: profile.logoUrl ?? '',
        coverUrl: profile.coverUrl ?? '',
        primaryColor: profile.primaryColor || DEFAULT_PRIMARY,
        secondaryColor: profile.secondaryColor || DEFAULT_SECONDARY,
        templateKey: profile.templateKey || 'classic',
        logoScale: profile.logoScale ?? 100,
        logoGlow: profile.logoGlow ?? false,
      });
    }
  }, [profile]);

  // Guarda y actualiza la caché (la vista previa detrás se actualiza al instante).
  const save = async (next: DesignState) => {
    setStatus('saving');
    try {
      const res = await riferoService.update({
        publicName: next.publicName || undefined,
        logoUrl: next.logoUrl,
        coverUrl: next.coverUrl,
        primaryColor: next.primaryColor,
        secondaryColor: next.secondaryColor,
        templateKey: next.templateKey,
        logoScale: next.logoScale,
        logoGlow: next.logoGlow,
      });
      queryClient.setQueryData(['rifero', 'me'], res);
      setStatus('saved');
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setStatus('idle'), 1800);
    } catch (e) {
      setStatus('idle');
      toast.error(e instanceof ApiError ? e.message : 'No se pudo guardar');
    }
  };

  // Cambia un campo y programa el auto-guardado (debounce).
  const update = (patch: Partial<DesignState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      setStatus('saving');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void save(next), 700);
      return next;
    });
  };

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      clearTimeout(savedTimerRef.current);
    },
    [],
  );

  if (isLoading) return <PageLoader label="Cargando apariencia..." />;

  const publicName = state.publicName || 'Tu nombre';

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Apariencia</h1>
          <p className="text-sm text-muted-foreground">Se guarda solo mientras editas.</p>
        </div>
        <SaveIndicator status={status} />
      </div>

      {/* Vista previa */}
      <Card className="mb-5 overflow-hidden">
        <CardContent className="p-3">
          <RiferoTheme primaryColor={state.primaryColor} secondaryColor={state.secondaryColor}>
            <div className="overflow-hidden rounded-2xl border">
              <div
                className="relative h-24 w-full bg-cover bg-center"
                style={{
                  backgroundColor: 'var(--rifero-secondary)',
                  backgroundImage: state.coverUrl ? `url(${apiAssetUrl(state.coverUrl)})` : undefined,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'var(--rifero-primary)', color: '#fff' }}>
                <div
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: (48 * state.logoScale) / 100, height: (48 * state.logoScale) / 100 }}
                >
                  {state.logoUrl ? (
                    <img src={apiAssetUrl(state.logoUrl)} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-lg font-black ring-2 ring-white/30">
                      {publicName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-base font-extrabold">{publicName}</h3>
                  {profile?.verified && <VerifiedBadge size={15} className="text-white" />}
                </div>
              </div>
            </div>
          </RiferoTheme>
        </CardContent>
      </Card>

      {/* Nombre */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Nombre público</CardTitle>
          <CardDescription>Así aparece el título de tu página.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={state.publicName} placeholder="Rifas Don José" onChange={(e) => update({ publicName: e.target.value })} />
        </CardContent>
      </Card>

      {/* Imágenes */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Imágenes</CardTitle>
          <CardDescription>Tu logo y la portada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <ImageUploader label="Logo" value={state.logoUrl} folder="logos" aspect="aspect-square max-w-[150px]" onChange={(url) => update({ logoUrl: url })} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Recomendado: <strong>PNG con fondo transparente</strong> para que se vea sin recuadro.
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="logoScale">Tamaño del logo</Label>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{state.logoScale}%</span>
              </div>
              <input
                id="logoScale"
                type="range"
                min={50}
                max={250}
                step={5}
                value={state.logoScale}
                onChange={(e) => update({ logoScale: Number(e.target.value) })}
                className="mt-2 w-full cursor-pointer"
                style={{ accentColor: state.primaryColor }}
              />
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={state.logoGlow}
                onChange={(e) => update({ logoGlow: e.target.checked })}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded"
                style={{ accentColor: state.primaryColor }}
              />
              <span className="text-sm">
                <span className="font-medium">Glow detrás del logo</span>
                <span className="block text-xs text-muted-foreground">
                  Halo de tu color de marca. Ideal para logos PNG con fondo transparente.
                </span>
              </span>
            </label>
          </div>
          <ImageUploader label="Portada" value={state.coverUrl} folder="covers" aspect="aspect-[16/9]" onChange={(url) => update({ coverUrl: url })} />
        </CardContent>
      </Card>

      {/* Colores y plantilla */}
      <Card>
        <CardHeader>
          <CardTitle>Colores y estilo</CardTitle>
          <CardDescription>Los colores de tu marca.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Color principal" value={state.primaryColor} onChange={(v) => update({ primaryColor: v })} />
            <ColorField label="Color secundario" value={state.secondaryColor} onChange={(v) => update({ secondaryColor: v })} />
          </div>
          <div>
            <Label htmlFor="templateKey">Plantilla</Label>
            <Select id="templateKey" value={state.templateKey} onChange={(e) => update({ templateKey: e.target.value })}>
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-input bg-background p-1"
        />
        <span className="text-sm font-medium uppercase text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…
      </span>
    );
  if (status === 'saved')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <Check className="h-3.5 w-3.5" /> Guardado
      </span>
    );
  return <span className="text-xs text-muted-foreground">Auto-guardado activo</span>;
}
