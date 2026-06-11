import { RESERVED_SLUGS, SLUG_REGEX } from './constants.js';

// ── Slug ────────────────────────────────────────────────────
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug) && !isReservedSlug(slug);
}

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug.toLowerCase());
}

// ── Boletos ─────────────────────────────────────────────────
export function formatTicketNumber(n: number, padding: number): string {
  return String(n).padStart(padding, '0');
}

// ── Dinero (MXN) ────────────────────────────────────────────
export function formatMXN(pesos: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);
}

// ── Folio de orden ──────────────────────────────────────────
export function generateOrderCode(seed?: string): string {
  // BSK-XXXXXX (base36). Si no se pasa seed, el backend debe pasar uno único.
  const base = (seed ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const tail = base.slice(-6).padStart(6, '0');
  return `BSK-${tail}`;
}

// ── WhatsApp ────────────────────────────────────────────────
export function sanitizePhoneForWa(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // México: anteponer 52 si parece número nacional de 10 dígitos.
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

export function buildWhatsappLink(phone: string, message: string): string {
  const num = sanitizePhoneForWa(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export interface WaTemplateVars {
  raffleName: string;
  ticketNumbers: string; // ya formateados separados por coma
  total: string; // ya formateado MXN
  orderCode: string;
}

export function waReserveMessage(v: WaTemplateVars): string {
  return `Hola, quiero confirmar mi apartado para la rifa ${v.raffleName}. Mis boletos son: ${v.ticketNumbers}. Mi total es: ${v.total}. Mi folio de orden es: ${v.orderCode}.`;
}

export function waProofMessage(v: WaTemplateVars): string {
  return `Hola, ya realicé el pago de la rifa ${v.raffleName}. Mis boletos son: ${v.ticketNumbers}. Mi folio es: ${v.orderCode}. Te envío mi comprobante.`;
}

// ── URLs / subdominios ──────────────────────────────────────
export interface PublicUrlConfig {
  rootDomain: string; // bismark.com
  useSubdomains: boolean; // true en prod
  protocol?: string; // https
}

export function riferoPublicUrl(slug: string, cfg: PublicUrlConfig): string {
  const proto = cfg.protocol ?? 'https';
  if (cfg.useSubdomains) return `${proto}://${slug}.${cfg.rootDomain}`;
  return `/r/${slug}`;
}

export function rafflePublicPath(slug: string, eventNumber: number, cfg: PublicUrlConfig): string {
  if (cfg.useSubdomains) return `${riferoPublicUrl(slug, cfg)}/e${eventNumber}`;
  return `/r/${slug}/e${eventNumber}`;
}

export function eventLabel(eventNumber: number): string {
  return `E${eventNumber}`;
}

// ── Fechas ──────────────────────────────────────────────────
export function formatDateMX(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(d);
}

export function formatDateTimeMX(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

// Tiempo restante legible (ej. "1h 23m")
export function timeRemaining(expiresAt: string | Date | null | undefined, now = new Date()): string | null {
  if (!expiresAt) return null;
  const end = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return null;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
