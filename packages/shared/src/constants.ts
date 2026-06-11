// Constantes compartidas de la plataforma.

export const BRAND = {
  name: 'Bismark',
  poweredBy: 'Impulsado por Bismark',
  generatedBy: 'Generado por Bismark',
  rootDomain: 'bismark.com',
} as const;

// Palabras reservadas que NO pueden usarse como slug/subdominio de rifero.
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'www',
  'app',
  'dashboard',
  'login',
  'register',
  'registro',
  'bismark',
  'soporte',
  'support',
  'help',
  'ayuda',
  'static',
  'assets',
  'public',
  'validar',
  'validate',
  'super',
  'superadmin',
  'mail',
  'ftp',
  'cdn',
  'status',
  'about',
  'planes',
  'plans',
  'terminos',
  'privacidad',
  'r', // ruta de fallback local /r/:slug
] as const;

export const PLAN_SLUGS = {
  BASIC: 'basico',
  PRO: 'pro',
  VERIFIED: 'verificado',
} as const;

// Slug regex: letras minúsculas, números y guiones. 3-32 chars. No empieza/termina en guión.
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export const LIMITS = {
  slugMin: 3,
  slugMax: 32,
  imageMaxBytes: 5 * 1024 * 1024, // 5 MB
  proofMaxBytes: 5 * 1024 * 1024,
  videoMaxBytes: 50 * 1024 * 1024, // 50 MB (evidencia de sorteo)
  maxTicketsHardCap: 100000, // tope de seguridad del sistema
  defaultReserveMinutes: 120,
} as const;

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_VIDEO_MIME = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov (iPhone)
] as const;

export const MEXICAN_STATES = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de México',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
] as const;
