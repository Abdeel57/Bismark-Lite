import { webEnv } from './env';
import { RESERVED_SLUGS } from '@bismark/shared';

// Detecta si el host actual corresponde al subdominio de un rifero.
// En producción: rifasdelasuerte.bismark.com -> "rifasdelasuerte".
// En local / dominio raíz / www -> null (app principal).
export function detectRiferoSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;

  // Localhost / IP: nunca subdominio (se usa /r/:slug).
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;

  const root = webEnv.rootDomain;
  if (!host.endsWith(`.${root}`)) return null;

  const sub = host.slice(0, host.length - root.length - 1);
  if (!sub || sub.includes('.')) return null; // multi-nivel no soportado aún
  if ((RESERVED_SLUGS as readonly string[]).includes(sub) || sub === 'www' || sub === 'app') return null;
  return sub;
}

// URL pública de un rifero (para compartir / vista previa).
export function buildRiferoUrl(slug: string): string {
  if (webEnv.useSubdomains) {
    const proto = window.location.protocol;
    return `${proto}//${slug}.${webEnv.rootDomain}`;
  }
  return `${window.location.origin}/r/${slug}`;
}

export function buildRaffleUrl(slug: string, eventNumber: number): string {
  return `${buildRiferoUrl(slug)}/e${eventNumber}`;
}

// URL de la landing principal de Bismark (donde está toda la info de la
// plataforma). Desde un subdominio de rifero, la ruta "/" es el perfil del
// rifero, así que la landing vive en el dominio raíz.
export function buildHomeUrl(): string {
  if (detectRiferoSubdomain()) {
    const proto = window.location.protocol;
    return `${proto}//${webEnv.rootDomain}`;
  }
  return '/';
}
