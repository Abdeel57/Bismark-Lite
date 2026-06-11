// Servidor estático de la SPA (frontend) para Railway. Sin dependencias.
// Sirve STATIC_DIR (por defecto ./dist) en process.env.PORT con fallback SPA.
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { join, normalize, extname, resolve } from 'node:path';

const ROOT = resolve(process.env.STATIC_DIR || './dist');
const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
};

const SECURITY_HEADERS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

function cacheFor(pathname) {
  // Assets con hash de Vite → inmutables. HTML / SW / manifest → sin caché.
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (pathname === '/sw.js' || pathname.endsWith('.webmanifest') || pathname.endsWith('.html')) return 'no-cache';
  return 'public, max-age=3600';
}

async function tryFile(absPath) {
  try {
    const s = await stat(absPath);
    if (s.isFile()) return s;
  } catch {
    /* not found */
  }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);

    // Protección contra path traversal.
    const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    let absPath = join(ROOT, safe);
    if (!absPath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    let stats = await tryFile(absPath);

    // Sin extensión y no existe como archivo → ruta SPA → index.html.
    if (!stats && !extname(safe)) {
      pathname = '/index.html';
      absPath = join(ROOT, 'index.html');
      stats = await tryFile(absPath);
    }

    // Archivo con extensión que no existe → 404 (sirve index.html como página 404 amable).
    if (!stats) {
      const indexPath = join(ROOT, 'index.html');
      const idx = await tryFile(indexPath);
      if (idx) {
        const body = await readFile(indexPath);
        res.writeHead(extname(safe) ? 404 : 200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          ...SECURITY_HEADERS,
        });
        res.end(req.method === 'HEAD' ? undefined : body);
        return;
      }
      res.writeHead(404).end('Not found');
      return;
    }

    const type = MIME[extname(absPath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stats.size,
      'Cache-Control': cacheFor(pathname),
      ...SECURITY_HEADERS,
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(await readFile(absPath));
  } catch (err) {
    console.error('[static] error', err);
    res.writeHead(500).end('Internal error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[static] sirviendo ${ROOT} en http://${HOST}:${PORT}`);
});
