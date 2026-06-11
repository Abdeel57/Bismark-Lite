import { Link } from 'react-router-dom';
import { Home, Compass, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-brand-electric/15 blur-3xl" />
      </div>

      <div className="animate-slide-up flex flex-col items-center">
        <Link to="/" className="mb-8">
          <Logo />
        </Link>

        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand/10 text-brand">
          <Compass className="h-10 w-10" />
        </div>

        <p className="mt-6 text-6xl font-extrabold tracking-tight text-brand sm:text-7xl">404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          No encontramos esta página
        </h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          Es posible que el enlace esté mal escrito o que la página ya no exista. Regresa al inicio y
          sigue organizando tus rifas.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild variant="brand" size="lg" className="w-full sm:w-auto">
            <Link to="/">
              <Home className="h-5 w-5" /> Volver al inicio
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link to="/planes">
              <Ticket className="h-5 w-5" /> Ver planes
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
