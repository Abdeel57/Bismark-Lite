import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { detectRiferoSubdomain } from '@/lib/site';
import { BrandLoader } from '@/components/brand/BrandLoader';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { AdminDrawer } from '@/components/owner/AdminDrawer';
import { RequireAuth, RequireRifero, RequireAdmin, RequireGuest } from '@/components/RouteGuards';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { InstallBanner } from '@/components/layout/InstallBanner';

// ── Páginas (lazy) ──────────────────────────────────────────
const Landing = lazy(() => import('@/pages/Landing'));
const Plans = lazy(() => import('@/pages/Plans'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const RecoverPassword = lazy(() => import('@/pages/auth/RecoverPassword'));
const Onboarding = lazy(() => import('@/pages/onboarding/Onboarding'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Terms = lazy(() => import('@/pages/legal/Terms'));
const Privacy = lazy(() => import('@/pages/legal/Privacy'));

const PublicRifero = lazy(() => import('@/pages/public/PublicRifero'));
const PublicRaffle = lazy(() => import('@/pages/public/PublicRaffle'));
const Validation = lazy(() => import('@/pages/public/Validation'));
const DigitalTicket = lazy(() => import('@/pages/public/DigitalTicket'));
const RiferoPayment = lazy(() => import('@/pages/public/RiferoPayment'));
const VerifyTickets = lazy(() => import('@/pages/public/VerifyTickets'));

const DashHome = lazy(() => import('@/pages/dashboard/Home'));
const DashOrders = lazy(() => import('@/pages/dashboard/Orders'));
const DashRaffles = lazy(() => import('@/pages/dashboard/RafflesList'));
const DashRaffleForm = lazy(() => import('@/pages/dashboard/RaffleForm'));
const DashRaffleTickets = lazy(() => import('@/pages/dashboard/RaffleTickets'));
const DashRaffleDraw = lazy(() => import('@/pages/dashboard/RaffleDraw'));
const DashProfile = lazy(() => import('@/pages/dashboard/Profile'));
const DashDesign = lazy(() => import('@/pages/dashboard/Design'));
const DashPayments = lazy(() => import('@/pages/dashboard/Payments'));
const DashReports = lazy(() => import('@/pages/dashboard/Reports'));
const DashPlan = lazy(() => import('@/pages/dashboard/Plan'));
const DashSettings = lazy(() => import('@/pages/dashboard/Settings'));
const DashMore = lazy(() => import('@/pages/dashboard/PanelMore'));

const AdminHome = lazy(() => import('@/pages/admin/AdminHome'));
const AdminRiferos = lazy(() => import('@/pages/admin/AdminRiferos'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminRaffles = lazy(() => import('@/pages/admin/AdminRaffles'));
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions'));
const AdminPlans = lazy(() => import('@/pages/admin/AdminPlans'));

function Fallback() {
  return <BrandLoader />;
}

// Router cuando se accede por subdominio de rifero (prod).
function SubdomainApp({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/" element={<PublicRifero subdomain={slug} />} />
        <Route path="/validar/:code" element={<Validation />} />
        <Route path="/boleto/:code" element={<DigitalTicket />} />
        <Route path="/pago/:code" element={<RiferoPayment />} />
        <Route path="/verificar" element={<VerifyTickets subdomain={slug} />} />
        <Route path="/:eventParam" element={<PublicRaffle subdomain={slug} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// Router principal (dominio raíz / local).
function MainApp() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/planes" element={<Plans />} />
        <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
        <Route path="/registro" element={<RequireGuest><Register /></RequireGuest>} />
        <Route path="/recuperar" element={<RequireGuest><RecoverPassword /></RequireGuest>} />
        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="/privacidad" element={<Privacy />} />

        {/* Páginas públicas (fallback local por ruta) */}
        <Route path="/r/:slug" element={<PublicRifero />} />
        <Route path="/r/:slug/pago/:code" element={<RiferoPayment />} />
        <Route path="/r/:slug/verificar" element={<VerifyTickets />} />
        <Route path="/r/:slug/:eventParam" element={<PublicRaffle />} />
        <Route path="/validar/:code" element={<Validation />} />
        <Route path="/boleto/:code" element={<DigitalTicket />} />

        {/* Panel del rifero: tu página pública en vivo + administrador (tuerca → drawer) */}
        <Route
          path="/panel"
          element={
            <RequireRifero>
              <OwnerShell />
            </RequireRifero>
          }
        >
          <Route index element={null} />
          <Route path="admin" element={<AdminDrawer />}>
            <Route index element={<Navigate to="inicio" replace />} />
            <Route path="inicio" element={<DashHome />} />
            <Route path="rifas" element={<DashRaffles />} />
            <Route path="rifas/nueva" element={<DashRaffleForm />} />
            <Route path="rifas/:id/editar" element={<DashRaffleForm />} />
            <Route path="rifas/:id/boletos" element={<DashRaffleTickets />} />
            <Route path="rifas/:id/sorteo" element={<DashRaffleDraw />} />
            <Route path="ordenes" element={<DashOrders />} />
            <Route path="ordenes/:filter" element={<DashOrders />} />
            <Route path="diseno" element={<DashDesign />} />
            <Route path="perfil" element={<DashProfile />} />
            <Route path="pagos" element={<DashPayments />} />
            <Route path="reportes" element={<DashReports />} />
            <Route path="plan" element={<DashPlan />} />
            <Route path="configuracion" element={<DashSettings />} />
            <Route path="mas" element={<DashMore />} />
          </Route>
        </Route>

        {/* Compatibilidad: rutas viejas del dashboard → panel */}
        <Route path="/dashboard" element={<Navigate to="/panel" replace />} />
        <Route path="/dashboard/*" element={<Navigate to="/panel/admin" replace />} />

        {/* Panel super admin */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="riferos" element={<AdminRiferos />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="rifas" element={<AdminRaffles />} />
          <Route path="suscripciones" element={<AdminSubscriptions />} />
          <Route path="planes" element={<AdminPlans />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  const subdomain = detectRiferoSubdomain();
  return (
    <>
      <OfflineBanner />
      {subdomain ? <SubdomainApp slug={subdomain} /> : <MainApp />}
      <InstallBanner />
    </>
  );
}
