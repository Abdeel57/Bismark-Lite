# Bismark — Plataforma SaaS de Rifas y Sorteos 🎟️

Plataforma web **PWA multi-rifero**: cualquier persona se registra, crea su perfil de rifero, personaliza su página pública, crea rifas/eventos, administra boletos, recibe órdenes, confirma pagos manuales, genera boletos digitales, realiza sorteos y controla todo desde un panel tipo app móvil.

- **Mobile-first**, instalable como app (PWA), modo claro/oscuro.
- Pensada para público **mexicano**. WhatsApp como canal principal. Pagos manuales directos al rifero.
- Marca **Bismark** fuerte en la landing; las páginas de cada rifero se sienten **propias** (solo aparece discreto _"Impulsado por Bismark"_).

---

## 🧱 Arquitectura

Monorepo con **npm workspaces**:

```
/apps
  /web    → Frontend PWA: React + Vite + TypeScript + Tailwind + shadcn-style + React Router + TanStack Query + Zustand
  /api    → Backend: Node + TypeScript + Fastify + Prisma + PostgreSQL + Zod
/packages
  /shared → Tipos, enums, validaciones Zod y utilidades compartidas (contrato API)
```

- **Frontend** preparado para **Netlify**.
- **Backend + PostgreSQL** preparados para **Railway**.
- **Archivos** (logos, portadas, premios, comprobantes) con almacenamiento **configurable**: `local` (dev), `cloudinary` o `s3` (R2/MinIO/AWS). Nunca se guardan binarios en la base de datos.

### Roles
- `VISITOR` — ve landing y páginas públicas, selecciona y **aparta boletos sin registrarse**, descarga boleto digital, contacta por WhatsApp.
- `RIFERO` — perfil, subdominio, personalización, rifas, boletos, órdenes, pagos manuales, reportes, sorteos. No publica sin **plan activo**. No ve datos de otros riferos.
- `SUPER_ADMIN` — control total: usuarios, riferos, planes/precios/límites, suscripciones (activación manual), métricas.

### Sistema de subdominios
- **Producción:** `rifasdelasuerte.bismark.com` y eventos `…/e1`, `…/e2`, `…/e56`.
- **Desarrollo (local):** rutas equivalentes `/r/rifasdelasuerte` y `/r/rifasdelasuerte/e1`.
- La arquitectura ya soporta subdominios dinámicos y deja preparado el **dominio personalizado** futuro (campo `customDomain`).

---

## ✅ Requisitos

- **Node.js ≥ 20** (probado en Node 24)
- **PostgreSQL 14+** (local o en Railway)
- npm 9+

---

## 🚀 Instalación y ejecución local

### Opción A — Rápida (sin instalar PostgreSQL) ✅ recomendada

Incluye un **PostgreSQL portátil** (`embedded-postgres`) que se descarga solo y corre sin Docker ni servicio.

```bash
# 1) Instalar dependencias
npm install

# 2) Variables de entorno (copia los ejemplos)
#    Windows PowerShell:
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
#    Bash/macOS/Linux:
#    cp apps/api/.env.example apps/api/.env && cp apps/web/.env.example apps/web/.env.local

# 3) Levantar la base local + migrar + sembrar (un solo comando)
npm run setup:local
#    Equivale a: db:local (inicia Postgres en :5433) + db:migrate + db:seed

# 4) Arrancar API + Web juntos
npm run dev                  # API :4000  ·  Web :5173
#    o por separado: npm run dev:api / npm run dev:web

# Para detener la base local cuando termines:
npm run db:local:stop
```

> El `.env.example` del API ya apunta a la base portátil (`postgresql://postgres:postgres@localhost:5433/bismark`).
> En Windows, Postgres no puede correr como administrador: el script `db:local` usa `pg_ctl`, que arranca el servidor con un token sin privilegios automáticamente.

### Opción B — Tu propio PostgreSQL

```bash
npm install
cp apps/api/.env.example apps/api/.env          # edita DATABASE_URL + secretos
cp apps/web/.env.example apps/web/.env.local
npm run db:migrate                              # crea las tablas (o npm run db:push)
npm run db:seed                                 # datos demo
npm run dev
```

Edita `apps/api/.env` con tu `DATABASE_URL` y genera secretos largos para `JWT_SECRET` y `COOKIE_SECRET`.

> El frontend usa un **proxy de Vite** (`/api` → `http://localhost:4000`) para compartir cookies _same-origin_ en desarrollo. No necesitas tocar CORS en local.

### Credenciales del seed

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Super Admin | `admin@bismark.com` | `Admin1234!` |
| Rifero demo | `demo@bismark.com` | `Demo1234!` |

- Página pública demo (local): **http://localhost:5173/r/rifasdelasuerte**
- Rifa demo (E1): **http://localhost:5173/r/rifasdelasuerte/e1**
- Panel admin: inicia sesión como admin → **/admin**

---

## 🧪 Probar subdominios en local

Opción A — **rutas locales** (recomendado, ya funciona sin configurar nada):
`/r/<slug>` y `/r/<slug>/e<n>`.

Opción B — **subdominios reales en local** (para validar la arquitectura de producción):

1. Agrega a tu archivo `hosts` (Windows: `C:\Windows\System32\drivers\etc\hosts`):
   ```
   127.0.0.1   bismark.local
   127.0.0.1   rifasdelasuerte.bismark.local
   ```
2. En `apps/web/.env.local`:
   ```
   VITE_USE_SUBDOMAINS=true
   VITE_ROOT_DOMAIN=bismark.local
   ```
3. Abre `http://rifasdelasuerte.bismark.local:5173` → carga la página del rifero; `/e1` carga la rifa.

> En desarrollo, `localhost` siempre usa rutas `/r/...`; los subdominios se activan al usar un dominio con punto como `bismark.local`.

---

## 🌐 Despliegue en producción

### Backend + Base de datos → Railway
1. Crea un proyecto en Railway y agrega un **PostgreSQL**. Railway expone `DATABASE_URL`.
2. Crea un servicio desde este repo. Railway detecta `apps/api/railway.json`:
   - **Build:** `npm install && prisma generate`
   - **Start:** `prisma migrate deploy && npm run start` (aplica migraciones y arranca).
3. Variables de entorno (Railway → Variables): copia las de `apps/api/.env.example`. Imprescindibles:
   - `DATABASE_URL` (lo provee Railway), `JWT_SECRET`, `COOKIE_SECRET` (secretos largos),
   - `NODE_ENV=production`, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`, `COOKIE_DOMAIN=.bismark.com`,
   - `CORS_ORIGINS=https://bismark.com,https://www.bismark.com`, `CORS_ROOT_DOMAIN=bismark.com`,
   - `ROOT_DOMAIN=bismark.com`, `USE_SUBDOMAINS=true`, `PUBLIC_WEB_URL=https://bismark.com`,
   - `STORAGE_DRIVER=local` + `LOCAL_UPLOAD_DIR=/data/uploads`.
4. **Agrega un Volume** al servicio de la API (Settings → Volumes) montado en `/data`. Así las imágenes y videos persisten entre deploys (ver sección de almacenamiento).
5. (Opcional) Ejecuta el seed una vez: `npm run db:seed` desde la consola de Railway.

### Frontend (PWA) → Netlify
1. Conecta el repo en Netlify. Usa `netlify.toml` (ya incluido):
   - **Build:** `npm install && npm run build --workspace=@bismark/web`
   - **Publish:** `apps/web/dist`
2. Variables de entorno en Netlify:
   - `VITE_API_URL=https://<tu-api>.up.railway.app`
   - `VITE_ROOT_DOMAIN=bismark.com`, `VITE_USE_SUBDOMAINS=true`
3. **DNS de subdominios:** crea un registro **comodín** `*.bismark.com` apuntando a Netlify, además de `bismark.com` y `www`. Así `rifasdelasuerte.bismark.com` resuelve al mismo frontend, que detecta el subdominio y muestra la página del rifero.

> Como la API y el frontend están en dominios distintos, las cookies de sesión usan `SameSite=None; Secure` y `COOKIE_DOMAIN=.bismark.com`. Asegúrate de servir todo bajo HTTPS.

---

## 📦 Almacenamiento de archivos (imágenes y video)

Todo el almacenamiento vive **dentro de Railway** usando un **Volumen persistente** (no se usa la base de datos para binarios; eso infla la BD y encarece los respaldos).

**En producción (Railway) — recomendado:**
1. En el servicio de la **API**, agrega un **Volume** (Settings → Volumes) montado, por ejemplo, en `/data`.
2. Variables de entorno: deja `STORAGE_DRIVER=local` y `LOCAL_UPLOAD_DIR=/data/uploads`.
3. Listo: logos, portadas, premios, comprobantes y **videos de sorteo** persisten entre deploys y se sirven en `/uploads/...` (con soporte de **streaming/seek** para video vía `@fastify/static`).

> Sin Volumen, el disco del contenedor es efímero y los archivos se borrarían en cada deploy.

**Endpoints de subida** (requieren sesión):
- `POST /uploads-api/image?folder=logos|covers|prizes|misc` — imágenes (JPG/PNG/WEBP/GIF), máx **5 MB**.
- `POST /uploads-api/video?folder=evidence` — video del sorteo (MP4/WEBM/MOV), máx **50 MB**.

**Alternativas** (también configurables vía `STORAGE_DRIVER`, ya cableadas como adaptador): `cloudinary` o `s3`/MinIO — implementa `CloudinaryStorage.upload` / `S3Storage.upload` en `apps/api/src/lib/storage.ts` si algún día quieres escalar a múltiples instancias.

---

## 🔌 Endpoints principales (API)

Auth: `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me`
Riferos: `POST /riferos/onboarding` · `GET/PATCH /riferos/me` · `GET /riferos/check-slug`
Rifas: `POST /raffles` · `GET /raffles` · `GET/PATCH /raffles/:id` · `POST /raffles/:id/publish` · `GET /raffles/:id/tickets` · `GET /dashboard/summary`
Boletos: `POST /public/raffles/:id/reserve` · `POST /tickets/reserve-manual` · `PATCH /tickets/:id/status`
Órdenes: `GET /orders` · `GET /orders/:id` · `PATCH /orders/:id/{mark-paid|cancel|reject}`
Pagos: `POST /public/orders/:code/proof` · `GET /orders/:id/proof`
Ganadores: `POST /raffles/:id/draw` · `GET /raffles/:id/winners` · `PATCH /winners/:id/publish`
Boleto digital: `GET /tickets/digital/:code` · `GET /tickets/digital/:code/pdf` · `GET /validar/:code`
Reportes: `GET /reports/raffles/:id/{orders|tickets|buyers}?format=excel|pdf`
Planes: `GET /plans` · `POST/PATCH /admin/plans`
Suscripciones (admin): `GET /admin/subscriptions` · `POST /admin/subscriptions/activate`
Admin: `GET /admin/{riferos|users|raffles|metrics}` · `PATCH /admin/riferos/:id/{suspend|reactivate}`
Público: `GET /public/riferos/by-subdomain/:subdomain` · `GET /public/raffles/by-event/:subdomain/:eventNumber`

---

## 🔐 Seguridad

- Contraseñas con **bcrypt** (12 rounds). Sesión en **cookie httpOnly** (JWT firmado) + soporte Bearer.
- Validación con **Zod** en cada endpoint. Manejo de errores centralizado.
- Middlewares `requireAuth`, `requireRole`, `requireRifero` y verificación de **ownership** (un rifero solo ve/edita lo suyo).
- **Rate limiting** en endpoints sensibles (login, registro, apartar boletos, subir comprobantes).
- **Cabeceras de seguridad** con Helmet (X-Frame-Options, nosniff, Referrer-Policy, HSTS en prod) y **compresión** gzip/brotli de respuestas.
- CORS por lista de orígenes + comodín de subdominios opcional. Validación de archivos (tipo y tamaño).
- Datos del comprador **nunca** se exponen en vistas públicas. La PWA no cachea respuestas de la API.
- **ErrorBoundary** en el frontend: un error de render muestra una pantalla de respaldo, no deja la app en blanco.

---

## 🗺️ Roadmap (dejado preparado, no en v1)

Mercado Pago / Stripe · WhatsApp API oficial · Push notifications · Facturación · Dominio personalizado por rifero · Verificación avanzada de identidad · Más plantillas visuales.

---

## 📁 Estructura resumida

```
apps/api/
  prisma/schema.prisma          # 14 modelos + enums
  prisma/seed.ts                # admin, 3 planes, rifero+rifa demo
  src/config, src/lib           # env, prisma, auth, plan gates, storage, pdf, reports, serializers
  src/middlewares               # auth, error-handler
  src/modules/*                 # auth, riferos, raffles, tickets, orders, payments, winners,
                                #   plans, subscriptions, admin, digital-tickets, reports, public, uploads
  src/jobs/expire-reservations  # libera apartados vencidos
apps/web/
  src/components/ui             # primitivas estilo shadcn
  src/components/brand, layout  # Logo, PoweredBy, layouts, bottom-nav
  src/components/TicketGrid.tsx # cuadrícula virtualizada de boletos
  src/services                  # cliente API tipado
  src/pages                     # landing, auth, onboarding, dashboard, public, admin
```

---

_Impulsado por Bismark._
