import type { FastifyInstance } from 'fastify';
import { onboardingSchema, updateRiferoSchema, slugSchema, isReservedSlug, slugify, LIMITS } from '@bismark/shared';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../lib/http.js';
import { conflict, notFound, badRequest } from '../../lib/errors.js';
import { requireAuth, requireRifero } from '../../middlewares/auth.js';
import { setSession } from '../../lib/session.js';
import { getPlanContext } from '../../lib/plan.js';
import { toRiferoProfileDTO } from '../../lib/serializers.js';
import { logActivity } from '../../lib/activity.js';

async function profileResponse(riferoId: string) {
  const profile = await prisma.riferoProfile.findUnique({ where: { id: riferoId } });
  if (!profile) throw notFound('Perfil no encontrado');
  const ctx = await getPlanContext(riferoId);
  return toRiferoProfileDTO(profile, ctx);
}

// Deriva el subdominio del nombre público (sin espacios/acentos) y lo hace único.
// El cliente NO elige el subdominio: se calcula aquí de forma automática.
async function generateUniqueSlug(publicName: string): Promise<string> {
  let base = slugify(publicName);
  // slugify puede dejar algo demasiado corto o vacío; garantizar mínimo válido.
  if (base.length < LIMITS.slugMin) base = (base ? `${base}-rifas` : 'rifas').slice(0, LIMITS.slugMax);
  // Evitar palabras reservadas (admin, api, www, bismark, …).
  if (isReservedSlug(base)) base = `${base}-rifas`.slice(0, LIMITS.slugMax);

  // Primer sufijo libre: base, base-2, base-3, …
  let candidate = base;
  for (let n = 2; ; n++) {
    const taken = await prisma.riferoProfile.findFirst({
      where: { OR: [{ slug: candidate }, { subdomain: candidate }] },
      select: { id: true },
    });
    if (!taken) return candidate;
    const suffix = `-${n}`;
    candidate = `${base.slice(0, LIMITS.slugMax - suffix.length)}${suffix}`;
  }
}

export default async function riferosRoutes(app: FastifyInstance): Promise<void> {
  // GET /riferos/check-slug?slug=...  -> { available: boolean, reason?: string }
  app.get('/riferos/check-slug', { preHandler: requireAuth }, async (request) => {
    const slug = String((request.query as { slug?: string }).slug ?? '').toLowerCase();
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      return { available: false, reason: parsed.error.issues[0]?.message ?? 'Slug inválido' };
    }
    if (isReservedSlug(slug)) return { available: false, reason: 'Ese nombre está reservado' };
    const existing = await prisma.riferoProfile.findFirst({ where: { OR: [{ slug }, { subdomain: slug }] } });
    return { available: !existing, reason: existing ? 'Ese subdominio ya está en uso' : undefined };
  });

  // POST /riferos/onboarding  (crea el perfil del usuario autenticado)
  app.post('/riferos/onboarding', { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    const data = validate(onboardingSchema, request.body);

    const existingProfile = await prisma.riferoProfile.findUnique({ where: { userId: auth.userId } });
    if (existingProfile) throw conflict('Ya tienes un perfil de rifero');

    // Mantener datos personales del usuario sincronizados.
    await prisma.user.update({
      where: { id: auth.userId },
      data: { name: data.fullName, phone: data.phone },
    });

    const baseData = {
      userId: auth.userId,
      publicName: data.publicName,
      whatsapp: data.whatsapp,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      coverUrl: data.coverUrl || null,
      facebook: data.facebook || null,
      instagram: data.instagram || null,
      tiktok: data.tiktok || null,
      primaryColor: data.primaryColor ?? '#1d4ed8',
      secondaryColor: data.secondaryColor ?? '#0f172a',
      templateKey: data.templateKey ?? 'classic',
      status: 'PENDING' as const,
    };

    // El subdominio se genera automáticamente del nombre público (no lo elige el
    // cliente). Reintentar si dos altas simultáneas chocan en la restricción única.
    let profile;
    for (let attempt = 0; ; attempt++) {
      const slug = await generateUniqueSlug(data.publicName);
      try {
        profile = await prisma.riferoProfile.create({ data: { ...baseData, slug, subdomain: slug } });
        break;
      } catch (err) {
        const isUniqueClash = (err as { code?: string }).code === 'P2002';
        if (isUniqueClash && attempt < 4) continue; // otro perfil tomó el slug entre el check y el insert
        throw err;
      }
    }

    // Reissue de sesión con riferoId para que requireRifero funcione sin re-login.
    await setSession(reply, { sub: auth.userId, role: auth.role, riferoId: profile.id });
    await logActivity({ userId: auth.userId, type: 'RAFFLE', action: 'onboarding', meta: { slug: profile.slug } });

    const ctx = await getPlanContext(profile.id);
    return reply.code(201).send({ profile: toRiferoProfileDTO(profile, ctx) });
  });

  // GET /riferos/me
  app.get('/riferos/me', { preHandler: requireRifero }, async (request) => {
    return { profile: await profileResponse(request.auth!.riferoId!) };
  });

  // PATCH /riferos/me
  app.patch('/riferos/me', { preHandler: requireRifero }, async (request) => {
    const riferoId = request.auth!.riferoId!;
    const data = validate(updateRiferoSchema, request.body);

    // No se permite cambiar slug/subdominio desde aquí (estabilidad de URLs públicas).
    if ('slug' in (request.body as object) || 'subdomain' in (request.body as object)) {
      throw badRequest('El subdominio no puede cambiarse desde aquí');
    }

    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]),
    );

    await prisma.riferoProfile.update({ where: { id: riferoId }, data: cleaned });
    await logActivity({ userId: request.auth!.userId, type: 'RAFFLE', action: 'update_profile' });
    return { profile: await profileResponse(riferoId) };
  });
}
