import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Power, PowerOff } from 'lucide-react';
import {
  formatMXN,
  planSchema,
  type PlanInput,
  type PlanDTO,
  slugify,
} from '@bismark/shared';
import { planService } from '@/services/plans';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageLoader, EmptyState, Separator } from '@/components/ui/misc';
import { PageHeader } from '@/components/layout/DashboardLayout';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';

type FlagKey =
  | 'allowProofUpload'
  | 'allowMultipleWinners'
  | 'allowReportsExcel'
  | 'allowReportsPdf'
  | 'allowVerificationBadge'
  | 'allowDigitalDraw'
  | 'allowCustomDomainFuture';

const FLAGS: { key: FlagKey; label: string }[] = [
  { key: 'allowProofUpload', label: 'Subir comprobantes' },
  { key: 'allowMultipleWinners', label: 'Múltiples ganadores' },
  { key: 'allowReportsExcel', label: 'Reportes en Excel' },
  { key: 'allowReportsPdf', label: 'Reportes en PDF' },
  { key: 'allowVerificationBadge', label: 'Insignia de verificado' },
  { key: 'allowDigitalDraw', label: 'Sorteo digital' },
  { key: 'allowCustomDomainFuture', label: 'Dominio propio (futuro)' },
];

export default function AdminPlans() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => planService.adminList(),
  });

  const plans = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Planes"
        description="Define precios, límites y funciones de cada plan."
        action={<NewPlanDialog />}
      />

      {isLoading ? (
        <PageLoader />
      ) : plans.length === 0 ? (
        <EmptyState
          title="Sin planes"
          description="Crea tu primer plan para empezar a vender suscripciones."
          action={<NewPlanDialog />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <PlanEditorCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}

interface EditableState {
  name: string;
  price: string;
  maxActiveRaffles: string;
  maxTicketsPerRaffle: string;
  features: string;
  flags: Record<FlagKey, boolean>;
}

function toEditable(plan: PlanDTO): EditableState {
  return {
    name: plan.name,
    price: String(plan.price),
    maxActiveRaffles: String(plan.maxActiveRaffles),
    maxTicketsPerRaffle: String(plan.maxTicketsPerRaffle),
    features: plan.features.join('\n'),
    flags: {
      allowProofUpload: plan.allowProofUpload,
      allowMultipleWinners: plan.allowMultipleWinners,
      allowReportsExcel: plan.allowReportsExcel,
      allowReportsPdf: plan.allowReportsPdf,
      allowVerificationBadge: plan.allowVerificationBadge,
      allowDigitalDraw: plan.allowDigitalDraw,
      allowCustomDomainFuture: plan.allowCustomDomainFuture,
    },
  };
}

function PlanEditorCard({ plan }: { plan: PlanDTO }) {
  const qc = useQueryClient();
  const [state, setState] = useState<EditableState>(() => toEditable(plan));
  const isActive = plan.status === 'ACTIVE';

  // Re-sincroniza si el servidor devuelve datos nuevos.
  useEffect(() => {
    setState(toEditable(plan));
  }, [plan]);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['admin', 'plans'] });

  const save = useMutation({
    mutationFn: () =>
      planService.update(plan.id, {
        name: state.name,
        price: Number(state.price) || 0,
        maxActiveRaffles: Number(state.maxActiveRaffles) || 0,
        maxTicketsPerRaffle: Number(state.maxTicketsPerRaffle) || 0,
        features: state.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
        ...state.flags,
      }),
    onSuccess: () => {
      toast.success('Plan actualizado');
      invalidate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Algo salió mal'),
  });

  const toggleStatus = useMutation({
    mutationFn: () => planService.setStatus(plan.id, isActive ? 'INACTIVE' : 'ACTIVE'),
    onSuccess: () => {
      toast.success(isActive ? 'Plan desactivado' : 'Plan activado');
      invalidate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Algo salió mal'),
  });

  const setFlag = (key: FlagKey, value: boolean) =>
    setState((s) => ({ ...s, flags: { ...s.flags, [key]: value } }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{plan.name || 'Plan'}</CardTitle>
          <Badge variant={isActive ? 'success' : 'muted'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
        </div>
        <CardDescription>
          {formatMXN(Number(state.price) || 0)} / {plan.billingPeriod} · /{plan.slug}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div>
          <Label htmlFor={`name-${plan.id}`}>Nombre</Label>
          <Input
            id={`name-${plan.id}`}
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`price-${plan.id}`}>Precio (MXN)</Label>
            <Input
              id={`price-${plan.id}`}
              type="number"
              min={0}
              value={state.price}
              onChange={(e) => setState((s) => ({ ...s, price: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor={`raffles-${plan.id}`}>Rifas activas máx.</Label>
            <Input
              id={`raffles-${plan.id}`}
              type="number"
              min={0}
              value={state.maxActiveRaffles}
              onChange={(e) => setState((s) => ({ ...s, maxActiveRaffles: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`tickets-${plan.id}`}>Boletos máx. por rifa</Label>
          <Input
            id={`tickets-${plan.id}`}
            type="number"
            min={0}
            value={state.maxTicketsPerRaffle}
            onChange={(e) => setState((s) => ({ ...s, maxTicketsPerRaffle: e.target.value }))}
          />
        </div>

        <Separator />

        <div className="space-y-2.5">
          <p className="text-sm font-semibold">Funciones incluidas</p>
          {FLAGS.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3">
              <Label htmlFor={`${f.key}-${plan.id}`} className="mb-0 cursor-pointer">
                {f.label}
              </Label>
              <Switch
                id={`${f.key}-${plan.id}`}
                checked={state.flags[f.key]}
                onCheckedChange={(v) => setFlag(f.key, v)}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div>
          <Label htmlFor={`features-${plan.id}`}>Beneficios (una línea por cada uno)</Label>
          <Textarea
            id={`features-${plan.id}`}
            rows={4}
            value={state.features}
            onChange={(e) => setState((s) => ({ ...s, features: e.target.value }))}
            placeholder={'Soporte prioritario\nReportes ilimitados'}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <Button className="flex-1" loading={save.isPending} onClick={() => save.mutate()}>
          <Save className="h-4 w-4" /> Guardar
        </Button>
        <Button
          variant={isActive ? 'outline' : 'success'}
          loading={toggleStatus.isPending}
          onClick={() => toggleStatus.mutate()}
        >
          {isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          {isActive ? 'Desactivar' : 'Activar'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function NewPlanDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      slug: '',
      price: 0,
      currency: 'MXN',
      billingPeriod: 'monthly',
      maxActiveRaffles: 1,
      maxTicketsPerRaffle: 1000,
      allowProofUpload: false,
      allowMultipleWinners: false,
      allowReportsExcel: false,
      allowReportsPdf: false,
      allowVerificationBadge: false,
      allowDigitalDraw: false,
      allowCustomDomainFuture: false,
      features: [],
      sortOrder: 0,
    },
  });

  const [featuresText, setFeaturesText] = useState('');

  const create = useMutation({
    mutationFn: (input: PlanInput) => planService.create(input),
    onSuccess: () => {
      toast.success('Plan creado');
      void qc.invalidateQueries({ queryKey: ['admin', 'plans'] });
      setOpen(false);
      reset();
      setFeaturesText('');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Algo salió mal'),
  });

  const onSubmit = handleSubmit((values) => {
    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
    create.mutate({ ...values, features });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          reset();
          setFeaturesText('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="brand" size="sm">
          <Plus className="h-4 w-4" /> Nuevo plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo plan</DialogTitle>
          <DialogDescription>Configura los límites y funciones del nuevo plan.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="np-name">Nombre</Label>
            <Input
              id="np-name"
              {...register('name')}
              onChange={(e) => {
                setValue('name', e.target.value);
                if (!watch('slug')) setValue('slug', slugify(e.target.value));
              }}
            />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="np-slug">Slug (identificador)</Label>
            <Input id="np-slug" {...register('slug')} placeholder="basico" />
            {errors.slug && <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="np-price">Precio</Label>
              <Input id="np-price" type="number" min={0} {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="mt-1 text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="np-raffles">Rifas máx.</Label>
              <Input
                id="np-raffles"
                type="number"
                min={0}
                {...register('maxActiveRaffles', { valueAsNumber: true })}
              />
              {errors.maxActiveRaffles && (
                <p className="mt-1 text-sm text-destructive">{errors.maxActiveRaffles.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="np-tickets">Boletos máx.</Label>
              <Input
                id="np-tickets"
                type="number"
                min={0}
                {...register('maxTicketsPerRaffle', { valueAsNumber: true })}
              />
              {errors.maxTicketsPerRaffle && (
                <p className="mt-1 text-sm text-destructive">{errors.maxTicketsPerRaffle.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-semibold">Funciones incluidas</p>
            {FLAGS.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <Label htmlFor={`np-${f.key}`} className="mb-0 cursor-pointer">
                  {f.label}
                </Label>
                <Switch
                  id={`np-${f.key}`}
                  checked={watch(f.key)}
                  onCheckedChange={(v) => setValue(f.key, v)}
                />
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="np-features">Beneficios (una línea por cada uno)</Label>
            <Textarea
              id="np-features"
              rows={3}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={'Soporte prioritario\nReportes ilimitados'}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" loading={create.isPending}>
              Crear plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
