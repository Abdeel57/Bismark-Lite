# 🧪 Sesión 3 (Claude Code) — QA / Verificación + Lanzamiento (Fase 0)

> Tercer participante. Para **no chocar** con las otras dos sesiones, mantengo mi
> bitácora **aquí** (no edito `COORDINATION.md`, que es muy activo) y solo creo
> archivos **nuevos** en carpetas propias.

## ⏭️ Para retomar (snapshot 2026-06-09)
App completa y verificada (typecheck verde, smoke 13/0, públicas sin errores). Falta **lanzar y endurecer**:
1. **Producción (solo usuario):** Railway (PG+Volume+API) · Netlify (web) · DNS bismark.com + api.bismark.com · Resend (key+dominio) · env prod (`COOKIE_DOMAIN`, `CORS_ROOT_DOMAIN`, `PUBLIC_WEB_URL`, `VITE_API_URL`) · opc. Sentry/PostHog. Runbook: `qa/DEPLOY-RAILWAY.md`.
2. **Decisión grande:** cobro de suscripciones es **manual** (sin pasarela). Falta MercadoPago/Stripe + webhook.
3. **Frontend pendiente (Cursor):** badge `/notifications/summary` · compartir con OG `/s/r/:slug` · init Sentry/PostHog en `main.tsx` · rutas `/terminos` y `/privacidad`.
4. **Calidad:** verificación de email en registro · suite de pruebas (Vitest + Playwright) · backups · storage CDN (hoy volumen local).
- **Próximo paso (usuario debe elegir):** (a) pasarela de pago, (b) email verif, (c) suite de pruebas.
- **Dato demo:** GRAN SORTEO (Jazvi E1) tiene fecha **placeholder** 15 jul 2026 → poner la real.

## Mi carril
- **Verificación de integración:** corro typecheck (shared+api+web) + `qa/smoke.mjs`
  contra el API vivo cuando hay cambios grandes, y reporto roturas.
- **Fase 0 (lanzamiento)** que NO está en el board de Fase 1:
  - Páginas **legales** (Términos / Aviso de Privacidad).
  - Checklist de **deploy** / verificación final.
  - **Pruebas** automatizadas (smoke).

## Archivos que poseo (solo nuevos)
- `qa/*` (esta carpeta).
- `apps/web/src/pages/legal/Terms.tsx`, `apps/web/src/pages/legal/Privacy.tsx`.

## NO toco (de otras sesiones)
`COORDINATION.md`, `App.tsx`, `apps/web/src/services/*`, páginas públicas, `apps/api/src/*`
(módulos, `env.ts`, `schemas.ts`, `app.ts`), `README.md`, `.env.example`, `netlify.toml`,
`vite.config.ts`, `index.html`, `apps/web/public/*`.

## Solicitud al frontend (Cursor)
Cuando puedas, cablear (las páginas **ya existen y compilan**, solo falta ruta + enlaces):
- En `App.tsx` (lazy): `/terminos` → `@/pages/legal/Terms`, `/privacidad` → `@/pages/legal/Privacy`.
- Enlazar en `Register.tsx` (checkbox de Términos / Aviso de Privacidad) y en el footer de la landing.

## Cómo correr mi verificación
```bash
node qa/smoke.mjs          # API debe estar en http://localhost:4000
npm run typecheck          # shared + api + web
```

## Bitácora de verificación
- ✅ Typecheck integrado **VERDE** (shared + api + web). API `health 200`.
  Migración `password_reset_tokens` aplicada. Endpoints nuevos respondiendo
  (`/orders/pending-count`, OG `/s/...`, notificaciones).
- 🛠️ **Regresión detectada y resuelta por QA:** la migración `rifero_logo_scale`
  estaba creada pero **no aplicada** → login daba 500. Apliqué `prisma migrate deploy`
  (no destructivo). Smoke de vuelta a **13 ok / 0 fallos**.
- 🚀 **Deploy a Railway (ambos servicios) preparado** — solo faltan tus variables:
  - `deploy/Dockerfile.api`, `deploy/Dockerfile.web`, `deploy/static-server.mjs` (sin deps), `.dockerignore`.
  - **Variables separadas (paste-ready):** `deploy/railway.backend.env` · `deploy/railway.web.env`.
  - Runbook: `qa/DEPLOY-RAILWAY.md`.
  - Servidor estático probado: SPA fallback, caché inmutable de assets, `sw.js` no-cache, headers de seguridad, 404 OK.
- 🐛 **Fix (a pedido del usuario):** `/panel` mostraba un `OwnerPreview` viejo en vez de la
  página pública mejorada. Lo unifiqué:
  - `apps/web/src/pages/public/PublicRifero.tsx` → **edit aditivo**: prop opcional `previewData`
    (si llega, no hace fetch público; lo usa el panel para verse aunque no haya plan). ⚠️ *toqué
    archivo de la otra sesión; es aditivo y no cambia el comportamiento público.*
  - `apps/web/src/components/owner/OwnerShell.tsx` (mío) → ahora arma los datos del dueño y
    renderiza `<PublicRifero previewData=… />` + banner "Vista previa" + tuerca.
  - `OwnerPreview.tsx` quedó **sin uso** (lo dejé en su lugar; idealmente se borra luego).
  - Verificado: typecheck VERDE + captura de `/panel` muestra la página mejorada.
- 🎨 **Rediseño del administrador (móvil), a pedido del usuario:**
  - `apps/web/src/components/owner/AdminDrawer.tsx` (mío) → **menú inferior** de 3 pestañas
    (Órdenes · Rifas · Más), barra superior limpia (título + “Cerrar”), **sin iconos decorativos**.
    Conservé el badge de pendientes (`useNotificationsSummary`).
  - `apps/web/src/components/owner/MoreMenu.tsx` (nuevo, mío) → hub “Más” por categorías
    (Tu página / Cobros / Tu negocio / Cuenta), tipo ajustes, sin iconos (solo chevron).
  - Sin tocar `App.tsx`: “Más” es estado interno del drawer, no ruta.
  - *Nota:* las tarjetas dentro de Rifas/Órdenes (botones Editar/Boletos/Sorteo, etc.) aún
    tienen iconos funcionales — están en archivos de la sesión frontend (Cursor).
- 🧹 **Quitar iconos en tarjetas (a pedido del usuario)** — ⚠️ *toqué archivos de la sesión frontend:*
  - `apps/web/src/pages/dashboard/RafflesList.tsx` → sin iconos (Ticket/Plus/Pencil/Grid3x3/Trophy/Send/Users/CalendarClock). Botones y badges en texto.
  - `apps/web/src/pages/dashboard/Orders.tsx` → sin iconos (Phone/Clock/CheckCircle2/XCircle/Ban/Download/ImageIcon/QrCode/Receipt). **Conservé `WhatsAppButton`.**
  - Lógica intacta (solo quité iconos). Typecheck VERDE. Pendiente (si el usuario quiere): Resumen/Reportes/Pagos/Perfil/Apariencia/Ajustes.
- 🧩 **Formularios + nav (a pedido del usuario):**
  - `apps/web/src/components/owner/AdminDrawer.tsx` (mío) → **iconos solo en el bottom nav**
    (Receipt/Ticket/Menu), el único lugar con iconos.
  - `apps/web/src/components/ui/form-section.tsx` (nuevo, mío) → `FormSection` + `Field`
    reutilizables con el estilo de la página de rifas (tarjeta + título display + campos espaciados).
  - `apps/web/src/pages/dashboard/RaffleForm.tsx` (⚠️ archivo frontend) → reescrito como
    **asistente de 4 pasos** (Tu rifa · Boletos · Imágenes · Fechas y reglas) con barra de
    progreso, validación por paso (`trigger`), sin iconos. Quité el preview lateral pesado;
    ejemplo de boleto inline. Lógica de guardado intacta. Typecheck VERDE.
  - *Pendiente (si el usuario quiere):* aplicar `FormSection`/`Field` a Perfil/Pagos/Ajustes/Apariencia/Onboarding.
- 🐛 **BUG CRÍTICO “no se pueden crear rifas” — RESUELTO (a pedido del usuario):**
  - **Causa raíz:** en `packages/shared/src/schemas.ts` las imágenes usaban `z.string().url()`,
    que **rechaza rutas relativas** `/uploads/…` que devuelve el storage local (volumen Railway).
    Al subir foto del premio (o logo/portada en onboarding/Apariencia) la validación tronaba → 400.
  - **Fix:** ⚠️ *toqué `schemas.ts` (sesión backend).* Agregué validador `imageUrl` (acepta
    `https://…` **o** `/uploads/…`) y reemplacé los 5 usos de `.url()` de imagen:
    `createRaffleSchema.images`, `onboardingSchema.logoUrl/coverUrl`, `updateRiferoSchema.logoUrl/coverUrl`.
    *Esto también arregla subir logo/portada del perfil.* Backend ya tomó el cambio (POST /raffles → 201 con imagen).
  - **Verificado e2e** (`qa/diag-create-img.mjs`, Chrome headless): login → asistente → sube PNG
    (`POST /uploads-api/image → 201`) → **`POST /raffles → 201`** (rifas E4/E5) → toast “Rifa creada”, 0 errores de campo.
- 🧹 **Alinear formulario con la página de la rifa (a pedido del usuario):** el form pedía
  cosas que **no aparecen** en `PublicRaffle.tsx`. La página usa: `prize`, `drawDate`, `description`,
  `terms`, `maxTicketsPerOrder` y el **pago del perfil** (`paymentProfile`). NO usa `startDate`,
  `endDate`, `reserveMinutes`, `useDigitalDraw` ni `allowWinnerPublication`.
  - `apps/web/src/pages/dashboard/RaffleForm.tsx` (⚠️ archivo frontend) → **quité del UI**:
    Inicia/Termina (`startDate`/`endDate`), Tiempo de apartado (`reserveMinutes`) y los 2 switches
    (Publicar ganador / Sorteo digital). Paso 4 ahora “**Sorteo y pago**” = Fecha del sorteo + Términos + Instrucciones de pago.
  - **Comportamiento preservado:** `reserveMinutes` ahora usa el **default global** del rifero
    (`profile.defaultReserveMinutes`, configurable en *Más → Ajustes*); `allowWinnerPublication`/`useDigitalDraw`
    quedan en defaults sensatos y se preservan al editar (siguen en `defaultValues`/`reset`).
    El hint de pago aclara que si se deja vacío se muestran los *Datos de pago* del perfil.
  - Typecheck VERDE + e2e VERDE con el form recortado (rifa E5).
- 🔓 **Nuevo modelo de plan: crear/personalizar libre, plan sólo gatea lo público (a pedido del usuario):**
  El usuario quiere poder **crear rifas y personalizar el perfil SIN plan**; lo único que el plan
  debe limitar es **hacer pública** la página (publicar/compartir el link). Un visitante sin plan
  del rifero ve “Próximamente” y no puede comprar.
  - ⚠️ *Toqué archivos de la sesión backend* (`apps/api/src/lib/plan.ts`, `apps/api/src/modules/raffles/raffles.routes.ts`):
    - `POST /raffles` y la edición estructural (renumerar borradores) **ya NO exigen plan** — se quitó `assertCanCreateRaffle`/`assertActivePlan`/`assertTicketLimit` del alta y de la edición.
    - El límite del plan se movió a **publicar**: nuevo `assertCanPublishRaffle(riferoId, raffleId, totalTickets)` en `plan.ts` (reemplaza a `assertCanCreateRaffle`) → valida plan activo + boletos por rifa + nº de rifas **públicas** (status PUBLISHED) a la vez. `POST /raffles/:id/publish` lo usa.
    - Quité el import muerto `getPlanContext` de `raffles.routes.ts`.
  - `apps/web/src/pages/dashboard/RaffleForm.tsx` (⚠️ frontend): el `onError` ya no muestra el
    mensaje engañoso “Activa un plan para crear más rifas” (crear ya no da 402). Mensaje genérico.
  - **Lo que YA estaba bien y no toqué** (sólo lo verifiqué): `PATCH /riferos/me` y onboarding no
    están gateados (personalizar perfil ya era libre); el público devuelve `active:false` sin plan
    y el front muestra “Esta página aún no está activa… preparando sus rifas”; comprar/boletos/pagos
    siguen gateados por plan (`tickets`/`payments` routes). Banner del panel ya dice lo correcto
    (“Activa un plan para que tu página sea pública”).
  - **Verificado e2e** (`qa/diag-noplan-create.mjs`, cuenta nueva SIN plan): `POST /raffles → 201` ✅ ·
    `publish → 402` ✅ · público `active:false` ✅. Cuenta de prueba eliminada.
- ✅ **Texto enriquecido en la descripción — RESUELTO y verificado (a pedido del usuario):**
  La sesión frontend (Cursor) metió un `RichTextEditor` (negritas/color/alineación/tamaño) para la
  descripción de la rifa + sanitizador, pero lo dejó a medias y rompía el typecheck en dos momentos:
  1) `PublicRaffle.tsx` usaba `isRichHtml`/`sanitizeHtml` sin import → mientras revisaba, Cursor agregó
     `apps/web/src/lib/sanitizeHtml.ts` (sanitizador nativo con `DOMParser`, sin dompurify) + el import.
  2) `RaffleForm.tsx` usaba `<RichTextEditor>` sin import (`TS2304`) y un `onChange` con `any` implícito.
  Iba a agregar el import yo, pero Cursor lo añadió (línea 20) en paralelo. **Typecheck web ahora VERDE
  (exit 0)**; `shared`+`api` también.
  - **Verificación de runtime** (`qa/diag-richtext-public.mjs`, Chrome headless): la página pública de
    una rifa **monta sin crashear** y la descripción enriquecida **renderiza con formato**: en una rifa
    nueva con `<b><font color size>` el `.rt-content` muestra el texto y `negrita=true`. (Los `401` de
    consola son el chequeo de sesión del visitante — benignos y pre-existentes, aparecen igual en E1.)
  - *No toqué `PublicRaffle.tsx`, `rich-text.tsx` ni `sanitizeHtml.ts`* (son de la sesión frontend); sólo
    verifiqué. Limpié la rifa de prueba.
- ⏱️ **Cronómetro al sorteo bajo la imagen (a pedido del usuario):**
  - `apps/web/src/components/public/RaffleCountdown.tsx` (**nuevo, mío**): cuenta regresiva
    días/horas/min/seg en vivo (setInterval 1s) con estilo oscuro “rifa norteña” (cards
    `bg-white/[0.05] ring-white/10`, label en `--rifero-primary`). Si la rifa está FINISHED/CANCELLED
    o la fecha ya pasó → muestra sólo la fecha del sorteo (`formatDateTimeMX`). Si no hay fecha → no
    renderiza. Props: `{ drawDate, status }` (usa el enum `RaffleStatus` de shared).
  - ⚠️ *2 ediciones mínimas en `apps/web/src/pages/public/PublicRaffle.tsx` (sesión frontend):* import
    del componente + `<RaffleCountdown drawDate={raffle.drawDate} status={raffle.status} />` insertado
    entre `</header>` y la tabla de precios (justo debajo de la imagen).
  - **Verificado e2e** (`qa/diag-countdown.mjs`): futuro → `05 DÍAS 03 HORAS 26 MIN 57→56 SEG` (corre
    en vivo, 0 errores); pasado → `FECHA DEL SORTEO · 7 jun 2026` (sólo fecha). Typecheck web VERDE.
    Rifas de prueba eliminadas.
- 📅 **Fecha del sorteo ahora OBLIGATORIA (a pedido del usuario):** el contador no salía en una rifa
  real porque tenía `drawDate: null` (se creó sin fecha). El formulario **sí guardaba** bien la fecha
  (verificado); el hueco era que se podía dejar vacía.
  - `apps/web/src/pages/dashboard/RaffleForm.tsx` (⚠️ frontend): `drawLocal` ahora es **requerido** en
    `onSubmit` (crear y editar) → si está vacío, bloquea con error “Indica la fecha y hora del sorteo.”
    y manda al paso 4. Estado `drawError` + `error` en el `Field`; se limpia al escribir. Hint actualizado.
  - **Verificado e2e** (`qa/diag-form-date.mjs`): sin fecha → ✅ bloqueado con error; con fecha →
    `POST /raffles 201` con `drawDate` persistido. Typecheck web VERDE.
  - *Pendiente del usuario:* las rifas viejas con `drawDate: null` (p. ej. “GRAN SORTEO EN EFECTIVO” de
    *Rifas Jazvi*) necesitan editarse una vez para ponerles fecha y que aparezca el contador.
- 🎨 **Contador en fondo blanco + fechas a sorteos activos (a pedido del usuario):**
  - `apps/web/src/components/public/RaffleCountdown.tsx` (mío): pasado de bloque negro (`bg-zinc-950`)
    a **fondo claro** (`bg-background`, tarjetas `bg-muted/40` con borde, números `text-foreground`,
    etiqueta en `--rifero-primary`). En modo claro la sección queda `rgb(255,255,255)` (verificado).
  - Puse **fechas futuras a los 2 sorteos activos** (PUBLISHED) para que se vea el contador:
    GRAN SORTEO (Jazvi /rifastusuerte E1) → 15 jul 2026, 8 pm · Camioneta (demo /rifasdelasuerte E2)
    → 1 jul 2026, 8 pm. (El iPhone demo está FINISHED → muestra sólo la fecha, correcto.)
  - **Verificado** (Chrome headless, `prefers-color-scheme: light`): ambas páginas muestran el contador
    en vivo sobre fondo blanco, sin errores.
  - 🩹 **Integración con la sombra de la imagen (a pedido del usuario):** el contador era un bloque
    blanco aparte y cortaba la sombra que se desborda del marco de la imagen. Solución: el componente
    ahora es **transparente** (sin `bg-background`, hereda el blanco del hero) y se movió **dentro del
    `<header>`** (entre la imagen y `</header>`) en `PublicRaffle.tsx`, con `pt-6` para dar aire a la
    sombra. Verificado con captura: la sombra fluye sin corte y todo comparte un solo fondo blanco.
- 🔎 **Revisión de bugs (a pedido del usuario):** typecheck (shared+api+web) VERDE, smoke 13/0, barrido
  de runtime de 8 páginas públicas (sin pageerrors). Dos agentes auditaron el flujo de compra y el
  render de texto enriquecido. Hallazgos y acciones:
  - 🔴 **BUG CRÍTICO — orden con comprobante se auto-expiraba (CORREGIDO):** al subir comprobante, los
    boletos pasaban a `PENDING_PAYMENT` pero la **orden seguía `RESERVED`** con su `expiresAt`; el job
    `releaseExpiredReservations` vencía esa orden y **liberaba los boletos del comprador que ya pagó**.
    ⚠️ *Toqué backend:* `apps/api/src/modules/payments/payments.routes.ts` (al subir comprobante la orden
    pasa a `PENDING` y `expiresAt=null`) y `apps/api/src/jobs/expire-reservations.ts` (el job sólo vence
    `RESERVED`). Verificado que `mark-paid` acepta `PENDING` y que las listas/conteos del rifero ya lo
    incluyen. **Regresión probada** con el job real: orden con comprobante → PROTEGIDA; apartado vencido
    → expira+libera. ✅
  - 🟠 **Menor (CORREGIDO):** `reserveFormSchema` permite `nombres(60)+apellidos(60)` → `fullName` hasta
    121 > `buyerSchema.fullName.max(120)`. Subí el backend a `max(140)` en `packages/shared/src/schemas.ts`.
  - ✅ **Falsos positivos descartados:** la descripción del **rifero** es `Textarea` plano (no rich), así
    que renderizarla como texto plano en `PublicRifero.tsx` es correcto; `OwnerPreview.tsx` es código
    muerto. La descripción de **rifa** (única rich) se renderiza bien en `PublicRaffle.tsx`; ningún otro
    lugar la muestra. `max(8000)` alcanza para HTML. OG/meta limpian el HTML.
  - ✅ **Los 4 detalles de UX — CORREGIDOS (a pedido del usuario):**
    1. **Órdenes expiradas/rechazadas en la búsqueda por teléfono:** `apps/api/.../public.routes.ts`
       (lookup) ahora incluye `EXPIRED`/`REJECTED`. En `VerifyTickets.tsx`: `StatusPill` muestra
       “Vencida/Rechazada/Cancelada” (rojo) y `OrderCard` agrega nota explicativa + oculta la caja de
       boletos vacía. Verificado: lookup devuelve la orden EXPIRED.
    2. **Contador del recibo en vivo:** nuevo `apps/web/src/components/public/ReserveTimer.tsx` (mío)
       que corre cada segundo y, al vencer, avisa “tu apartado venció y los boletos se liberaron”.
       Reemplaza el bloque estático en `PublicRaffle.tsx` (quité `timeRemaining`/`Clock` sin uso).
    3. **Nombre de una sola palabra:** `apellidos` ahora opcional en `reserveFormSchema` (PublicRaffle),
       `fullName` se arma robusto (`[nombres,apellidos].filter(Boolean).join(' ')`), placeholder “(opcional)”.
    4. **`/auth/me` 401 en consola:** ahora es auth “suave” → 200 `{user:null}` sin sesión (sin
       `requireAuth`). Verificado: `/auth/me` → 200 y **0 `401` en consola** en landing/rifa/verificar.
    ⚠️ *Toqué backend* (`auth.routes.ts`, `public.routes.ts`) *y archivos frontend* (`PublicRaffle.tsx`,
    `VerifyTickets.tsx`, `services/auth.ts`). Typecheck (shared+api+web) VERDE, smoke 13/0, páginas sin
    pageerrors.
