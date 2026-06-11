export const webEnv = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api',
  rootDomain: (import.meta.env.VITE_ROOT_DOMAIN as string | undefined) || 'bismark.com',
  useSubdomains: (import.meta.env.VITE_USE_SUBDOMAINS as string | undefined) === 'true',
  brandName: (import.meta.env.VITE_BRAND_NAME as string | undefined) || 'Bismark',
  // Monitoreo de errores (Sentry) y analítica (PostHog). Vacío = desactivado.
  sentryDsn: (import.meta.env.VITE_SENTRY_DSN as string | undefined) || '',
  posthogKey: (import.meta.env.VITE_POSTHOG_KEY as string | undefined) || '',
  posthogHost: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com',
  prod: import.meta.env.PROD,
};
