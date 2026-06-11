import type { FastifyReply, FastifyRequest } from 'fastify';
import { unauthorized, forbidden } from '../lib/errors.js';
import type { UserRole } from '@bismark/shared';

// preHandler: intenta verificar el JWT (cookie o Bearer) y poblar request.auth.
// No falla si no hay token (rutas mixtas público/privado lo manejan con requireAuth).
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    const payload = await request.jwtVerify<{ sub: string; role: UserRole; riferoId?: string | null }>();
    request.auth = {
      userId: payload.sub,
      role: payload.role,
      riferoId: payload.riferoId ?? null,
    };
  } catch {
    request.auth = undefined;
  }
}

export function requireAuth(request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void): void {
  if (!request.auth) {
    done(unauthorized());
    return;
  }
  done();
}

export function requireRole(...roles: UserRole[]) {
  return function (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void): void {
    if (!request.auth) {
      done(unauthorized());
      return;
    }
    if (!roles.includes(request.auth.role)) {
      done(forbidden('No tienes permisos para esta acción'));
      return;
    }
    done();
  };
}

// Requiere ser RIFERO con perfil. Garantiza request.auth.riferoId presente.
export function requireRifero(request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void): void {
  if (!request.auth) {
    done(unauthorized());
    return;
  }
  if (request.auth.role !== 'RIFERO' && request.auth.role !== 'SUPER_ADMIN') {
    done(forbidden('Solo riferos pueden acceder'));
    return;
  }
  if (!request.auth.riferoId) {
    done(forbidden('Completa tu perfil de rifero primero'));
    return;
  }
  done();
}

export const requireAdmin = requireRole('SUPER_ADMIN');
