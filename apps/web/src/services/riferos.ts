import { apiFetch } from '@/lib/api';
import type { RiferoProfileDTO, OnboardingInput, UpdateRiferoInput } from '@bismark/shared';

export const riferoService = {
  checkSlug: (slug: string) =>
    apiFetch<{ available: boolean; reason?: string }>('/riferos/check-slug', { query: { slug } }),
  onboarding: (input: OnboardingInput) =>
    apiFetch<{ profile: RiferoProfileDTO }>('/riferos/onboarding', { method: 'POST', body: input }),
  me: () => apiFetch<{ profile: RiferoProfileDTO }>('/riferos/me'),
  update: (input: UpdateRiferoInput) =>
    apiFetch<{ profile: RiferoProfileDTO }>('/riferos/me', { method: 'PATCH', body: input }),
};
