import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, ScanLine } from 'lucide-react';
import {
  formatMXN,
  formatDateTimeMX,
  timeRemaining,
  waReserveMessage,
  type OrderDTO,
} from '@bismark/shared';
import { orderService, type OrderFilter } from '@/services/orders';
import { ApiError, apiAssetUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoader, EmptyState } from '@/components/ui/misc';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { OrderStatusBadge } from '@/lib/statusBadges';
import { WhatsAppButton } from '@/components/brand/WhatsAppButton';
import { QrScanner } from '@/components/owner/QrScanner';
import { PanelHeader, PANEL_CARD } from '@/components/owner/PanelKit';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';

type UrlFilter = 'pendientes' | 'pagadas' | 'todas';

const URL_TO_API: Record<UrlFilter, OrderFilter> = {
  pendientes: 'pending',
  pagadas: 'paid',
  todas: 'all',
};

const TABS: { value: UrlFilter; label: string }[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'pagadas', label: 'Pagadas' },
  { value: 'todas', label: 'Todas' },
];

function ProofDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const proofsQuery = useQuery({
    queryKey: ['order-proofs', orderId],
    queryFn: () => orderService.proofs(orderId),
    enabled: open,
  });
  const proofs = proofsQuery.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Ver comprobante
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comprobante de pago</DialogTitle>
          <DialogDescription>Revisa el comprobante que envió el comprador.</DialogDescription>
        </DialogHeader>
        {proofsQuery.isLoading ? (
          <PageLoader />
        ) : proofs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay comprobantes para mostrar.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {proofs.map((proof) => (
              <a
                key={proof.id}
                href={apiAssetUrl(proof.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border"
              >
                <img src={apiAssetUrl(proof.fileUrl)} alt="Comprobante de pago" className="w-full object-contain" />
                {proof.note && <p className="p-3 text-sm text-muted-foreground">{proof.note}</p>}
              </a>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrderCard({ order }: { order: OrderDTO }) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Algo salió mal');

  const markPaid = useMutation({
    mutationFn: () => orderService.markPaid(order.id),
    onSuccess: () => {
      toast.success('Orden marcada como pagada');
      invalidate();
    },
    onError,
  });

  const reject = useMutation({
    mutationFn: () => orderService.reject(order.id),
    onSuccess: () => {
      toast.success('Orden rechazada');
      invalidate();
    },
    onError,
  });

  const cancel = useMutation({
    mutationFn: () => orderService.cancel(order.id),
    onSuccess: () => {
      toast.success('Orden cancelada');
      invalidate();
    },
    onError,
  });

  // Acciones de cobro: aplican a apartadas (RESERVED) y a las que ya subieron
  // comprobante (PENDING). Antes sólo PENDING → no se podía confirmar un apartado.
  const isPending = order.status === 'PENDING' || order.status === 'RESERVED';
  const remaining = timeRemaining(order.expiresAt);
  const waPhone = order.buyer.whatsapp ?? order.buyer.phone;
  const waMessage = waReserveMessage({
    raffleName: `${order.raffleTitle} (${order.eventLabel})`,
    ticketNumbers: order.ticketNumbers.join(', '),
    total: formatMXN(order.totalAmount),
    orderCode: order.code,
  });

  return (
    <div className={cn(PANEL_CARD, 'flex flex-col gap-3 p-4')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-muted-foreground">{order.code}</p>
          <p className="truncate text-base font-bold leading-tight">{order.buyer.fullName}</p>
          <p className="text-sm text-muted-foreground">{order.buyer.phone}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="text-sm">
        <span className="font-semibold">{order.raffleTitle}</span>{' '}
        <span className="text-muted-foreground">· {order.eventLabel}</span>
      </div>

      {order.ticketNumbers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {order.ticketNumbers.map((n) => (
            <span key={n} className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <p className="text-xl font-extrabold tracking-tight">{formatMXN(order.totalAmount)}</p>
        <p className="text-right text-xs text-muted-foreground">{formatDateTimeMX(order.createdAt)}</p>
      </div>

      {isPending && remaining && (
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Vence en {remaining}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {isPending && (
          <Button variant="success" size="sm" loading={markPaid.isPending} onClick={() => markPaid.mutate()}>
            Marcar pagado
          </Button>
        )}
        {isPending && (
          <Button variant="destructive" size="sm" loading={reject.isPending} onClick={() => reject.mutate()}>
            Rechazar
          </Button>
        )}
        {isPending && (
          <Button variant="outline" size="sm" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            Cancelar
          </Button>
        )}
        <WhatsAppButton phone={waPhone} message={waMessage} size="sm" />
        {order.digitalTicketCode && (
          <Button asChild variant="outline" size="sm">
            <a
              href={apiAssetUrl(`/tickets/digital/${order.digitalTicketCode}/pdf`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Descargar boleto
            </a>
          </Button>
        )}
        {order.hasProof && <ProofDialog orderId={order.id} />}
      </div>
    </div>
  );
}

export default function Orders() {
  const params = useParams<{ filter?: string }>();
  const navigate = useNavigate();
  const [scanOpen, setScanOpen] = useState(false);

  const urlFilter: UrlFilter =
    params.filter && params.filter in URL_TO_API ? (params.filter as UrlFilter) : 'pendientes';
  const apiFilter = URL_TO_API[urlFilter];

  const ordersQuery = useQuery({
    queryKey: ['orders', apiFilter],
    queryFn: () => orderService.list(apiFilter),
  });

  const orders = ordersQuery.data?.items ?? [];

  return (
    <div>
      <PanelHeader
        title="Órdenes"
        description="Administra los apartados y pagos de tus rifas."
        icon={Receipt}
        action={
          <Button variant="outline" size="sm" onClick={() => setScanOpen(true)}>
            <ScanLine className="h-4 w-4" /> Validar
          </Button>
        }
      />
      <QrScanner open={scanOpen} onOpenChange={setScanOpen} />

      <Tabs value={urlFilter} onValueChange={(v) => navigate(`/panel/admin/ordenes/${v}`)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {ordersQuery.isLoading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            title="Sin órdenes por aquí"
            description="Cuando alguien aparte boletos, sus órdenes aparecerán en esta lista."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
