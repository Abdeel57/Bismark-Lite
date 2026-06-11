import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Layout simple para páginas legales (Términos, Aviso de Privacidad).
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  useDocumentTitle(`${title} — Bismark`);
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última actualización: {updated}</p>

        {/* Aviso: documento base, debe revisarlo un abogado antes de operar. */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>Documento base / borrador.</strong> Este texto es una plantilla inicial y debe ser revisado y
            ajustado por un abogado en México antes de operar con usuarios reales.
          </p>
        </div>

        <article className="legal mt-8 space-y-6 leading-relaxed text-foreground/90">{children}</article>

        <footer className="mt-12 flex items-center justify-between border-t pt-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Bismark</span>
          <div className="flex gap-4">
            <Link to="/terminos" className="hover:text-foreground">Términos</Link>
            <Link to="/privacidad" className="hover:text-foreground">Privacidad</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

// Sección con título para los documentos legales.
export function LegalSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">
        {n}. {title}
      </h2>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
