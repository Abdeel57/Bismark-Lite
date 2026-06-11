// Vista previa de enlaces (Open Graph dinámico) para Bismark.
//
// El frontend es una SPA: WhatsApp/Facebook NO ejecutan JS, así que sólo verían
// los meta tags genéricos de index.html y toda rifa compartida mostraría el mismo
// preview. Esta edge function intercepta las páginas públicas de rifero/rifa,
// pide el meta correcto a la API e inyecta los <meta og:*> en el <head>.
//
// Sólo transforma para crawlers (User-Agent conocido). Los usuarios reales pasan
// directo, sin coste. Cualquier fallo cae al index.html original: nunca rompe.
//
// Env (panel de Netlify): VITE_API_URL (API), VITE_ROOT_DOMAIN (dominio raíz si
// usas subdominios). Configurada en netlify.toml ([[edge_functions]]).

import type { Context } from 'https://edge.netlify.com';

// Unfurlers de redes sociales / mensajería más comunes.
const CRAWLER_RE =
  /(facebookexternalhit|Facebot|WhatsApp|Twitterbot|TelegramBot|Telegram|Discordbot|Slackbot|LinkedInBot|Pinterest|redditbot|Applebot|SkypeUriPreview|vkShare|embedly|Iframely|Google-InspectionTool|bingbot|bot)/i;

const RESERVED = new Set(['www', 'app', 'api', 'admin', 'static', 'assets', 'cdn', 'mail', 'panel']);

interface Meta {
  title?: string;
  description?: string;
  image?: string | null;
  url?: string;
  siteName?: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setTitle(html: string, title: string): string {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
}

// Reemplaza el content de un <meta property="X"> existente, o lo inyecta antes de </head>.
function setProp(html: string, prop: string, value: string): string {
  const re = new RegExp(`(<meta\\s+property=["']${prop}["']\\s+content=)["'][^"']*["']`, 'i');
  if (re.test(html)) return html.replace(re, `$1"${esc(value)}"`);
  return html.replace(/<\/head>/i, `  <meta property="${prop}" content="${esc(value)}" />\n</head>`);
}

// Igual pero para <meta name="X">.
function setName(html: string, name: string, value: string): string {
  const re = new RegExp(`(<meta\\s+name=["']${name}["']\\s+content=)["'][^"']*["']`, 'i');
  if (re.test(html)) return html.replace(re, `$1"${esc(value)}"`);
  return html.replace(/<\/head>/i, `  <meta name="${name}" content="${esc(value)}" />\n</head>`);
}

function resolveTarget(url: URL, root: string): { subdomain: string; event?: string } | null {
  // 1) Subdominio del rifero: <slug>.bismark.com
  const host = url.hostname;
  if (root && host.endsWith(`.${root}`)) {
    const sub = host.slice(0, host.length - root.length - 1);
    if (sub && !sub.includes('.') && !RESERVED.has(sub)) {
      const seg = url.pathname.split('/').filter(Boolean);
      const event = seg[0] && /^e?\d+$/i.test(seg[0]) ? seg[0] : undefined;
      return { subdomain: sub, event };
    }
  }
  // 2) Ruta basada en slug: /r/:slug[/:event]
  const m = url.pathname.match(/^\/r\/([^/]+)(?:\/(e?\d+))?\/?$/i);
  if (m) return { subdomain: m[1], event: m[2] };
  return null;
}

export default async function handler(req: Request, context: Context): Promise<Response | void> {
  const ua = req.headers.get('user-agent') ?? '';
  if (!CRAWLER_RE.test(ua)) return; // usuarios reales → SPA normal, sin transformar

  const url = new URL(req.url);
  const root = Deno.env.get('VITE_ROOT_DOMAIN') ?? Deno.env.get('ROOT_DOMAIN') ?? '';
  const target = resolveTarget(url, root);
  if (!target) return; // no es página pública de rifero/rifa

  // HTML original (index.html servido por el fallback de la SPA).
  const res = await context.next();
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('text/html')) return res;
  let html = await res.text();

  const apiBase = (Deno.env.get('VITE_API_URL') ?? Deno.env.get('API_URL') ?? '').replace(/\/$/, '');
  if (apiBase) {
    try {
      const path = `/public/meta/${encodeURIComponent(target.subdomain)}${
        target.event ? `/${encodeURIComponent(target.event)}` : ''
      }`;
      const metaRes = await fetch(`${apiBase}${path}`, { headers: { accept: 'application/json' } });
      if (metaRes.ok) {
        const meta = (await metaRes.json()) as Meta;
        if (meta.title) {
          html = setTitle(html, meta.title);
          html = setProp(html, 'og:title', meta.title);
          html = setName(html, 'twitter:title', meta.title);
        }
        if (meta.description) {
          html = setName(html, 'description', meta.description);
          html = setProp(html, 'og:description', meta.description);
          html = setName(html, 'twitter:description', meta.description);
        }
        if (meta.image) {
          html = setProp(html, 'og:image', meta.image);
          html = setName(html, 'twitter:image', meta.image);
          html = setName(html, 'twitter:card', 'summary_large_image');
        }
        if (meta.url) html = setProp(html, 'og:url', meta.url);
        if (meta.siteName) html = setProp(html, 'og:site_name', meta.siteName);
      }
    } catch {
      // Si la API falla, devolvemos el HTML sin tocar (preview genérico).
    }
  }

  const headers = new Headers(res.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300');
  headers.delete('content-length');
  return new Response(html, { status: res.status, headers });
}
