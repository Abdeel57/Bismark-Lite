// Open Graph dinámico para compartir (WhatsApp, Facebook, Telegram…).
//
// El frontend es un SPA en otro dominio (Netlify): los crawlers no ejecutan JS,
// así que no leen los meta tags que React inyecta. Estos endpoints devuelven
// HTML real con meta tags OG por rifa/rifero y redirigen al SPA para humanos.
//
// Los botones de "compartir" del frontend deben compartir estas URLs `/s/...`
// (no las del SPA) para que la vista previa muestre el premio/imagen.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { getPlanContext } from '../../lib/plan.js';
import { env } from '../../config/env.js';
import { escapeHtml } from '../../lib/mailer.js';
import { riferoPublicUrl, rafflePublicPath } from '@bismark/shared';

const PUBLIC_URL_CFG = {
  rootDomain: env.publicUrlConfig.rootDomain,
  useSubdomains: env.publicUrlConfig.useSubdomains,
  protocol: env.publicUrlConfig.protocol,
};

// Imagen de respaldo cuando la rifa/rifero no tiene imagen propia (la sirve el SPA).
const DEFAULT_OG_IMAGE = `${env.publicWebUrl}/og-default.png`;

// Convierte una ruta del SPA (posiblemente relativa "/r/slug") en URL absoluta.
function toAbsoluteWebUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${env.publicWebUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

// Convierte una ruta de archivo de la API (p. ej. "/uploads/..") en URL absoluta.
function toAbsoluteApiUrl(pathOrUrl: string | null | undefined, request: FastifyRequest): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = env.publicApiUrl || `${request.protocol}://${request.headers.host ?? ''}`;
  return `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function parseEventNumber(raw: string): number {
  const n = Number(raw.replace(/^e/i, ''));
  return Number.isInteger(n) && n >= 1 ? n : NaN;
}

interface OgData {
  title: string;
  description: string;
  image: string | null;
  url: string; // URL canónica a compartir (esta misma /s/...)
  redirectUrl: string; // a dónde mandar al humano (SPA)
}

function renderOgHtml(d: OgData): string {
  const image = d.image || DEFAULT_OG_IMAGE;
  const img = `<meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(d.title)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />`;
  const redirect = escapeHtml(d.redirectUrl);
  return `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(d.title)}</title>
  <meta name="description" content="${escapeHtml(d.description)}" />
  <link rel="canonical" href="${escapeHtml(d.url)}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bismark" />
  <meta property="og:title" content="${escapeHtml(d.title)}" />
  <meta property="og:description" content="${escapeHtml(d.description)}" />
  <meta property="og:url" content="${escapeHtml(d.url)}" />
  ${img}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(d.title)}" />
  <meta name="twitter:description" content="${escapeHtml(d.description)}" />

  <meta http-equiv="refresh" content="0; url=${redirect}" />
  <script>location.replace(${JSON.stringify(d.redirectUrl)});</script>
</head>
<body style="font-family:system-ui,sans-serif;background:#070b18;color:#fff;display:grid;place-items:center;height:100vh;margin:0;">
  <p>Abriendo… Si no avanza, <a href="${redirect}" style="color:#7aa2ff;">toca aquí</a>.</p>
</body>
</html>`;
}

function sendOg(reply: FastifyReply, html: string): void {
  reply
    .header('Content-Type', 'text/html; charset=utf-8')
    .header('Cache-Control', 'public, max-age=300') // 5 min: equilibra frescura y caché de crawlers
    .send(html);
}

export default async function ogRoutes(app: FastifyInstance): Promise<void> {
  // GET /s/r/:slug — vista previa de la página del rifero
  app.get('/s/r/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const key = slug.toLowerCase();
    const profile = await prisma.riferoProfile.findFirst({
      where: { OR: [{ slug: key }, { subdomain: key }] },
    });

    const redirectUrl = profile
      ? toAbsoluteWebUrl(riferoPublicUrl(profile.slug, PUBLIC_URL_CFG))
      : env.publicWebUrl;
    const shareUrl = `${env.publicApiUrl || `${request.protocol}://${request.headers.host ?? ''}`}/s/r/${encodeURIComponent(slug)}`;

    if (!profile || profile.status === 'DELETED') {
      reply
        .header('Content-Type', 'text/html; charset=utf-8')
        .send(
          renderOgHtml({
            title: 'Bismark — Rifas y sorteos',
            description: 'Crea tu página de rifas y administra tus boletos desde el celular.',
            image: null,
            url: shareUrl,
            redirectUrl: env.publicWebUrl,
          }),
        );
      return;
    }

    const ctx = await getPlanContext(profile.id);
    const inactive = !ctx.hasActivePlan || profile.status === 'SUSPENDED';

    const html = renderOgHtml({
      title: `${profile.publicName} — Rifas y sorteos`,
      description:
        profile.description?.slice(0, 200) ||
        `Participa en las rifas de ${profile.publicName}. Aparta tus boletos y paga fácil.`,
      image: toAbsoluteApiUrl(profile.coverUrl || profile.logoUrl, request),
      url: shareUrl,
      redirectUrl: inactive ? env.publicWebUrl : redirectUrl,
    });
    sendOg(reply, html);
  });

  // GET /s/r/:slug/:eventNumber — vista previa de una rifa
  app.get('/s/r/:slug/:eventNumber', async (request, reply) => {
    const { slug, eventNumber } = request.params as { slug: string; eventNumber: string };
    const key = slug.toLowerCase();
    const n = parseEventNumber(eventNumber);
    const shareUrl = `${env.publicApiUrl || `${request.protocol}://${request.headers.host ?? ''}`}/s/r/${encodeURIComponent(slug)}/e${Number.isNaN(n) ? '' : n}`;

    const profile = await prisma.riferoProfile.findFirst({
      where: { OR: [{ slug: key }, { subdomain: key }] },
    });

    if (!profile || Number.isNaN(n)) {
      sendOg(
        reply,
        renderOgHtml({
          title: 'Bismark — Rifas y sorteos',
          description: 'Crea tu página de rifas y administra tus boletos desde el celular.',
          image: null,
          url: shareUrl,
          redirectUrl: env.publicWebUrl,
        }),
      );
      return;
    }

    const raffle = await prisma.raffle.findFirst({
      where: { riferoId: profile.id, eventNumber: n, status: { in: ['PUBLISHED', 'FINISHED'] } },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
    const ctx = await getPlanContext(profile.id);
    const inactive = !ctx.hasActivePlan || profile.status === 'SUSPENDED';
    const raffleUrl = toAbsoluteWebUrl(rafflePublicPath(profile.slug, n, PUBLIC_URL_CFG));

    if (!raffle || inactive) {
      sendOg(
        reply,
        renderOgHtml({
          title: `${profile.publicName} — Rifas y sorteos`,
          description: `Participa en las rifas de ${profile.publicName}.`,
          image: toAbsoluteApiUrl(profile.coverUrl || profile.logoUrl, request),
          url: shareUrl,
          redirectUrl: inactive ? env.publicWebUrl : toAbsoluteWebUrl(riferoPublicUrl(profile.slug, PUBLIC_URL_CFG)),
        }),
      );
      return;
    }

    const priceLine = `Boletos desde $${raffle.ticketPrice.toLocaleString('es-MX')} MXN`;
    const description = raffle.prize
      ? `🎁 ${raffle.prize}. ${priceLine}. ¡Aparta el tuyo!`
      : raffle.description?.slice(0, 200) || `${priceLine}. ¡Aparta tus boletos!`;

    sendOg(
      reply,
      renderOgHtml({
        title: `${raffle.title} — ${profile.publicName}`,
        description,
        image: toAbsoluteApiUrl(raffle.images[0]?.url || profile.coverUrl || profile.logoUrl, request),
        url: shareUrl,
        redirectUrl: raffleUrl,
      }),
    );
  });
}
