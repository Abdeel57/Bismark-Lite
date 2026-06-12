import { apiFetch, setAuthToken } from '@/lib/api';
import type {
  AuthUserDTO,
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@bismark/shared';

type AuthReply = { user: AuthUserDTO; token?: string };

// Guarda el token Bearer que acompaña a la cookie (fallback para navegadores
// que bloquean cookies cross-site, como Safari/iOS).
function keepToken(res: AuthReply): AuthReply {
  if (res.token) setAuthToken(res.token);
  return res;
}

export const authService = {
  register: (input: Omit<RegisterInput, 'confirmPassword' | 'acceptTerms'> & { confirmPassword: string; acceptTerms: true }) =>
    apiFetch<AuthReply>('/auth/register', { method: 'POST', body: input }).then(keepToken),
  login: (input: LoginInput) =>
    apiFetch<AuthReply>('/auth/login', { method: 'POST', body: input }).then(keepToken),
  logout: () =>
    apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' }).finally(() => setAuthToken(null)),
  me: () => apiFetch<{ user: AuthUserDTO | null }>('/auth/me'),
  // Solicita el enlace de recuperación. Responde 200 aunque el correo no exista.
  forgotPassword: (input: ForgotPasswordInput) =>
    apiFetch<{ ok: true }>('/auth/forgot-password', { method: 'POST', body: input }),
  // Fija una nueva contraseña usando el token recibido por correo.
  resetPassword: (input: ResetPasswordInput) =>
    apiFetch<{ ok: true }>('/auth/reset-password', { method: 'POST', body: input }),
};
