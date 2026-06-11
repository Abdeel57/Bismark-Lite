import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Info, Lock } from 'lucide-react';
import { updateRiferoSchema } from '@bismark/shared';
import { riferoService } from '@/services/riferos';
import { ApiError } from '@/lib/api';
import { PageHeader } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PageLoader } from '@/components/ui/misc';
import { toast } from 'sonner';

const paymentsFormSchema = updateRiferoSchema.pick({
  payHolderName: true,
  payBank: true,
  payClabe: true,
  payCardNumber: true,
  payConcept: true,
  payInstructions: true,
  payWhatsapp: true,
  allowProofUpload: true,
});
type PaymentsForm = z.infer<typeof paymentsFormSchema>;

export default function Payments() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['rifero', 'me'],
    queryFn: () => riferoService.me(),
  });
  const profile = data?.profile;
  const planAllowsProof = profile?.activePlan?.allowProofUpload ?? false;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<PaymentsForm>({
    resolver: zodResolver(paymentsFormSchema),
    defaultValues: {
      payHolderName: '',
      payBank: '',
      payClabe: '',
      payCardNumber: '',
      payConcept: '',
      payInstructions: '',
      payWhatsapp: '',
      allowProofUpload: false,
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        payHolderName: profile.payHolderName ?? '',
        payBank: profile.payBank ?? '',
        payClabe: profile.payClabe ?? '',
        payCardNumber: profile.payCardNumber ?? '',
        payConcept: profile.payConcept ?? '',
        payInstructions: profile.payInstructions ?? '',
        payWhatsapp: profile.payWhatsapp ?? '',
        allowProofUpload: planAllowsProof ? profile.allowProofUpload : false,
      });
    }
  }, [profile, planAllowsProof, reset]);

  const mutation = useMutation({
    mutationFn: (values: PaymentsForm) => {
      // No enviar allowProofUpload si el plan no lo permite.
      const payload = { ...values };
      if (!planAllowsProof) delete payload.allowProofUpload;
      return riferoService.update(payload);
    },
    onSuccess: (res) => {
      toast.success('Datos de pago guardados');
      queryClient.setQueryData(['rifero', 'me'], res);
      void queryClient.invalidateQueries({ queryKey: ['rifero', 'me'] });
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : 'Algo salió mal');
    },
  });

  if (isLoading) return <PageLoader label="Cargando tus datos de pago..." />;

  return (
    <div>
      <PageHeader
        title="Datos de pago"
        description="Configura cómo te van a pagar tus compradores."
      />

      {/* Aviso importante */}
      <Card className="mb-5 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-200">El pago es directo a ti</p>
            <p className="text-blue-800/90 dark:text-blue-300/90">
              El comprador te paga directamente con estos datos. Bismark no cobra ni procesa el dinero en esta
              versión: tú recibes el pago y confirmas la orden.
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Cuenta para recibir pagos</CardTitle>
            <CardDescription>Estos datos los verá el comprador al apartar boletos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payHolderName">Titular de la cuenta</Label>
              <Input id="payHolderName" placeholder="José Pérez García" {...register('payHolderName')} />
              {errors.payHolderName && (
                <p className="text-destructive text-sm mt-1">{errors.payHolderName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="payBank">Banco</Label>
              <Input id="payBank" placeholder="BBVA, Banorte, Santander..." {...register('payBank')} />
              {errors.payBank && <p className="text-destructive text-sm mt-1">{errors.payBank.message}</p>}
            </div>

            <div>
              <Label htmlFor="payClabe">CLABE interbancaria</Label>
              <Input
                id="payClabe"
                inputMode="numeric"
                placeholder="18 dígitos"
                {...register('payClabe')}
              />
              {errors.payClabe && <p className="text-destructive text-sm mt-1">{errors.payClabe.message}</p>}
            </div>

            <div>
              <Label htmlFor="payCardNumber">Número de tarjeta</Label>
              <Input
                id="payCardNumber"
                inputMode="numeric"
                placeholder="Para transferencia o depósito"
                {...register('payCardNumber')}
              />
              {errors.payCardNumber && (
                <p className="text-destructive text-sm mt-1">{errors.payCardNumber.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="payConcept">Concepto / referencia</Label>
              <Input id="payConcept" placeholder="Ej. Rifa + tu folio" {...register('payConcept')} />
              {errors.payConcept && (
                <p className="text-destructive text-sm mt-1">{errors.payConcept.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="payWhatsapp">WhatsApp para enviar comprobantes</Label>
              <Input
                id="payWhatsapp"
                inputMode="tel"
                placeholder="55 1234 5678"
                {...register('payWhatsapp')}
              />
              {errors.payWhatsapp && (
                <p className="text-destructive text-sm mt-1">{errors.payWhatsapp.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="payInstructions">Instrucciones de pago</Label>
              <Textarea
                id="payInstructions"
                rows={4}
                placeholder="Ej. Realiza tu transferencia y envíame el comprobante por WhatsApp para confirmar tus boletos."
                {...register('payInstructions')}
              />
              {errors.payInstructions && (
                <p className="text-destructive text-sm mt-1">{errors.payInstructions.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comprobantes en la plataforma */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Comprobantes en la plataforma</CardTitle>
            <CardDescription>
              Permite que el comprador suba su comprobante de pago directo en su orden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="allowProofUpload"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Subir comprobante en su orden</p>
                    <p className="text-xs text-muted-foreground">
                      {planAllowsProof
                        ? 'Si lo activas, el comprador podrá adjuntar la foto de su pago.'
                        : 'Tu plan actual no incluye esta función.'}
                    </p>
                  </div>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={!planAllowsProof}
                    aria-label="Permitir subir comprobante"
                  />
                </div>
              )}
            />
            {!planAllowsProof && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Mejora tu plan para que tus compradores suban su comprobante en la plataforma.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="sticky bottom-24 z-10">
          <Button
            type="submit"
            size="lg"
            variant="brand"
            className="w-full"
            loading={mutation.isPending}
            disabled={!isDirty || mutation.isPending}
          >
            Guardar datos de pago
          </Button>
        </div>
      </form>
    </div>
  );
}
