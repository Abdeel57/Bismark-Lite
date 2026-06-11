import type { FastifyInstance } from 'fastify';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  UserRole,
} from '@bismark/shared';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../lib/http.js';
import { hashPassword, verifyPassword } from '../../lib/auth.js';
import { unauthorized, conflict, forbidden, badRequest } from '../../lib/errors.js';
import { setSession, clearSession } from '../../lib/session.js';
import { toAuthUserDTO } from '../../lib/serializers.js';
import { logActivity } from '../../lib/activity.js';
import { newResetToken, hashToken } from '../../lib/codes.js';
import { sendPasswordResetEmail } from '../../lib/mailer.js';
import { env } from '../../config/env.js';

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  // Limitar intentos en endpoints sensibles.
  const authLimit = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };

  // POST /auth/register
  app.post('/auth/register', authLimit, async (request, reply) => {
    const data = validate(registerSchema, request.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw conflict('Ya existe una cuenta con ese correo');

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: UserRole.RIFERO,
      },
    });

    await logActivity({ userId: user.id, type: 'AUTH', action: 'register', ip: request.ip });
    await setSession(reply, { sub: user.id, role: user.role, riferoId: null });

    reply.code(201).send({ user: toAuthUserDTO(user, null) });
  });

  // POST /auth/login
  app.post('/auth/login', authLimit, async (request, reply) => {
    const data = validate(loginSchema, request.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { riferoProfile: true },
    });
    if (!user) throw unauthorized('Correo o contraseña incorrectos');
    if (user.status === 'SUSPENDED') throw forbidden('Tu cuenta está suspendida. Contacta a soporte.');
    if (user.status === 'DELETED') throw unauthorized('Correo o contraseña incorrectos');

    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) throw unauthorized('Correo o contraseña incorrectos');

    await logActivity({ userId: user.id, type: 'AUTH', action: 'login', ip: request.ip });
    await setSession(reply, { sub: user.id, role: user.role, riferoId: user.riferoProfile?.id ?? null });

    reply.send({ user: toAuthUserDTO(user, user.riferoProfile) });
  });

  // POST /auth/logout
  app.post('/auth/logout', async (_request, reply) => {
    clearSession(reply);
    reply.send({ ok: true });
  });

  // POST /auth/forgot-password — solicita enlace de recuperación.
  // Responde siempre 200 (no revela si el correo existe) y limita intentos.
  app.post(
    '/auth/forgot-password',
    { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const { email } = validate(forgotPasswordSchema, request.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.status === 'ACTIVE') {
        // Invalida tokens previos sin usar y genera uno nuevo.
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
        const { token, tokenHash } = newResetToken();
        const expiresAt = new Date(Date.now() + env.email.passwordResetTtlMin * 60_000);
        await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

        const resetUrl = `${env.publicWebUrl}/recuperar?token=${encodeURIComponent(token)}`;
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
          ttlMin: env.email.passwordResetTtlMin,
        });
        await logActivity({ userId: user.id, type: 'AUTH', action: 'forgot_password', ip: request.ip });
      }

      reply.send({ ok: true });
    },
  );

  // POST /auth/reset-password — fija nueva contraseña usando el token del correo.
  app.post(
    '/auth/reset-password',
    { config: { rateLimit: { max: 10, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const data = validate(resetPasswordSchema, request.body);

      const record = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashToken(data.token) },
        include: { user: true },
      });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw badRequest('El enlace de recuperación no es válido o ya venció. Solicita uno nuevo.');
      }
      if (record.user.status !== 'ACTIVE') {
        throw badRequest('Esta cuenta no puede restablecer su contraseña. Contacta a soporte.');
      }

      const passwordHash = await hashPassword(data.password);
      await prisma.$transaction([
        prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
        prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        // Invalida cualquier otro token pendiente del usuario.
        prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
      ]);

      await logActivity({ userId: record.userId, type: 'AUTH', action: 'reset_password', ip: request.ip });
      reply.send({ ok: true });
    },
  );

  // GET /auth/me — auth "suave": responde 200 con user:null cuando no hay sesión,
  // en vez de 401. Así no ensucia la consola con un 401 en cada página pública.
  app.get('/auth/me', async (request, reply) => {
    if (!request.auth) {
      reply.send({ user: null });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: request.auth.userId },
      include: { riferoProfile: true },
    });
    reply.send({ user: user ? toAuthUserDTO(user, user.riferoProfile) : null });
  });
}
