import 'dotenv/config';

function str(key: string, fallback?: string): string {
  const v = process.env[key];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Falta variable de entorno requerida: ${key}`);
  }
  return v;
}

function bool(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  return v === 'true' || v === '1';
}

function num(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  isProd,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: num('PORT', 4000),
  host: str('HOST', '0.0.0.0'),

  databaseUrl: str('DATABASE_URL'),

  jwtSecret: str('JWT_SECRET', isProd ? undefined : 'dev-insecure-jwt-secret-change-me-please-32'),
  cookieSecret: str('COOKIE_SECRET', isProd ? undefined : 'dev-insecure-cookie-secret-change-me-32chars'),
  jwtExpiresIn: str('JWT_EXPIRES_IN', '7d'),
  cookieSecure: bool('COOKIE_SECURE', isProd),
  cookieSameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  corsOrigins: str('CORS_ORIGINS', 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  corsRootDomain: process.env.CORS_ROOT_DOMAIN || '',

  rootDomain: str('ROOT_DOMAIN', 'bismark.com'),
  useSubdomains: bool('USE_SUBDOMAINS', false),
  publicWebUrl: str('PUBLIC_WEB_URL', 'http://localhost:5173'),

  // URL pública de la propia API (para construir enlaces absolutos: OG, imágenes locales).
  // Si no se define, se infiere host:port en runtime al construir cada enlace.
  publicApiUrl: process.env.PUBLIC_API_URL?.replace(/\/$/, '') || '',

  // Envío de correos. Driver `log` (dev: imprime el correo en consola) o `resend`.
  // Por defecto usa resend si hay API key, de lo contrario log (no rompe en local).
  email: {
    driver: (process.env.EMAIL_DRIVER || (process.env.RESEND_API_KEY ? 'resend' : 'log')) as
      | 'log'
      | 'resend',
    from: str('EMAIL_FROM', 'Bismark <onboarding@resend.dev>'),
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    // Minutos de validez del enlace de recuperación de contraseña.
    passwordResetTtlMin: num('PASSWORD_RESET_TTL_MIN', 60),
  },

  // Monitoreo de errores (opcional). Sin DSN, no se inicializa nada.
  sentryDsn: process.env.SENTRY_DSN || '',
  sentryTracesSampleRate: num('SENTRY_TRACES_SAMPLE_RATE', 0),

  // Web Push (avisos al rifero). Sin claves VAPID, el push queda desactivado (no-op).
  // Genera claves con: npx web-push generate-vapid-keys
  push: {
    vapidPublic: process.env.VAPID_PUBLIC_KEY || '',
    vapidPrivate: process.env.VAPID_PRIVATE_KEY || '',
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:soporte@bismark.com',
  },

  seed: {
    adminEmail: str('SEED_ADMIN_EMAIL', 'admin@bismark.com'),
    adminPassword: str('SEED_ADMIN_PASSWORD', 'Admin1234!'),
    adminName: str('SEED_ADMIN_NAME', 'Super Admin Bismark'),
    riferoEmail: str('SEED_RIFERO_EMAIL', 'demo@bismark.com'),
    riferoPassword: str('SEED_RIFERO_PASSWORD', 'Demo1234!'),
  },

  storage: {
    driver: (process.env.STORAGE_DRIVER ?? 'local') as 'local' | 'cloudinary' | 's3',
    localDir: str('LOCAL_UPLOAD_DIR', './uploads'),
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
      apiKey: process.env.CLOUDINARY_API_KEY ?? '',
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
      folder: process.env.CLOUDINARY_FOLDER ?? 'bismark',
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT ?? '',
      region: process.env.S3_REGION ?? 'auto',
      bucket: process.env.S3_BUCKET ?? '',
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? '',
    },
  },

  publicUrlConfig: {
    rootDomain: str('ROOT_DOMAIN', 'bismark.com'),
    useSubdomains: bool('USE_SUBDOMAINS', false),
    protocol: isProd ? 'https' : 'http',
  },
} as const;

export type Env = typeof env;
