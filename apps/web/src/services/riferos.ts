import { apiFetch, setAuthToken } from '@/lib/api';
import type { RiferoProfileDTO, OnboardingInput, UpdateRiferoInput } from '@bismark/shared';

export const riferoService = {
  checkSlug: (slug: string) =>
    apiFetch<{ available: boolean; reason?: string }>('/riferos/check-slug', { query: { slug } }),
  // El onboarding reemite la sesión con riferoId; guardar el token nuevo para
  // que el fallback Bearer no se quede con una sesión sin perfil.
  onboarding: (input: OnboardingInput) =>
    apiFetch<{ profile: RiferoProfileDTO; token?: string }>('/riferos/onboarding', {
      method: 'POST',
      body: input,
    }).then((res) => {
      if (res.token) setAuthToken(res.token);
      return res;
    }),
  me: () => apiFetch<{ profile: RiferoProfileDTO }>('/riferos/me'),
  update: (input: UpdateRiferoInput) =>
    apiFetch<{ profile: RiferoProfileDTO }>('/riferos/me', { method: 'PATCH', body: input }),
};
