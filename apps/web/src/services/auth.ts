import { apiFetch } from '@/lib/api';
import type {
  AuthUserDTO,
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@bismark/shared';

export const authService = {
  register: (input: Omit<RegisterInput, 'confirmPassword' | 'acceptTerms'> & { confirmPassword: string; acceptTerms: true }) =>
    apiFetch<{ user: AuthUserDTO }>('/auth/register', { method: 'POST', body: input }),
  login: (input: LoginInput) => apiFetch<{ user: AuthUserDTO }>('/auth/login', { method: 'POST', body: input }),
  logout: () => apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: AuthUserDTO | null }>('/auth/me'),
  // Solicita el enlace de recuperación. Responde 200 aunque el correo no exista.
  forgotPassword: (input: ForgotPasswordInput) =>
    apiFetch<{ ok: true }>('/auth/forgot-password', { method: 'POST', body: input }),
  // Fija una nueva contraseña usando el token recibido por correo.
  resetPassword: (input: ResetPasswordInput) =>
    apiFetch<{ ok: true }>('/auth/reset-password', { method: 'POST', body: input }),
};
