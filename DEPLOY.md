# Despliegue en Railway — Autos MX

Railway corre **la app y la base Postgres en la misma plataforma**, en contenedores
persistentes (sin *cold starts*) — ideal para que los **webhooks de Mercado Pago**
respondan al instante. Esta guía te lleva de cero a un **checkout de seña funcionando
en modo TEST**.

El repo ya trae `railway.json`, así que el **build** (`prisma generate && next build`)
y las **migraciones** (`prisma migrate deploy`) corren solos en cada deploy.

---

## 0) Qué vas a necesitar

- Cuenta en **Railway** (https://railway.app).
- Credenciales **TEST** de Mercado Pago: `ACCESS_TOKEN` y el **secreto de firma** del webhook.
- Los secretos `AUTH_SECRET` y `CRON_SECRET` (generalos con `openssl rand -base64 32`).

## 1) Crear el proyecto + base de datos

1. Railway → **New Project** → **Deploy from GitHub repo** → elegí `mrk.5-blue-beam`
   y la rama a desplegar (`claude/charming-franklin-xqrfvw`, o `main` si ya mergeaste).
2. Dentro del proyecto → **New** → **Database** → **Add PostgreSQL**. Railway crea la
   base y expone `DATABASE_URL`.

## 2) Variables de entorno (servicio de la app)

Servicio de la app → **Variables** → agregá:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia al servicio Postgres) |
| `APP_URL` | el dominio público de Railway (lo generás en el paso 3) |
| `NODE_ENV` | `production` |
| `AUTH_SECRET` | 32+ caracteres aleatorios |
| `CRON_SECRET` | cadena aleatoria |
| `MERCADOPAGO_ACCESS_TOKEN` | tu token `TEST-...` |
| `MERCADOPAGO_WEBHOOK_SECRET` | el secreto de firma del webhook de MP |
| `EMAIL_FROM` | `Autos MX <no-reply@tudominio>` *(opcional)* |
| `RESEND_API_KEY` | *(opcional, para emails de orden)* |
| `ADMIN_NOTIFICATION_EMAIL` | *(opcional)* |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | *(opcional, fotos)* |

## 3) Dominio público

Servicio de la app → **Settings → Networking → Generate Domain**. Copiá el
`https://xxxx.up.railway.app`, ponelo en `APP_URL` y **redesplegá** para que tome el valor.
`APP_URL` se usa para construir las URLs de retorno y de webhook del pago: tiene que ser
el dominio real **antes** de probar pagos.

## 4) Primer deploy + datos

- El deploy aplica migraciones automáticamente (ver `railway.json`).
- **Una sola vez**, cargá el admin (+ autos demo) desde una shell del servicio
  (Railway → service → ⋯ → **Shell**) o con la CLI:

  ```bash
  railway run npm run db:seed
  ```

- Entrá a `https://APP_URL/admin` con `admin@autosmx.test` / `admin1234` →
  **cambiá la contraseña** y despublicá/borrá los autos demo cuando subas los reales.

## 5) Webhook de Mercado Pago

Panel de desarrolladores de MP → tu app → **Webhooks / Notificaciones**:

- **URL:** `https://APP_URL/api/webhooks/mercadopago`
- **Evento:** Pagos (`payment`).
- Copiá el **secreto de firma** a `MERCADOPAGO_WEBHOOK_SECRET`.

> El webhook es solo un *ping*: la app re-consulta el estado real del pago a MP antes de
> mover la orden. Si una notificación se pierde, el cron de reconciliación la recupera.

## 6) Crons (liberar holds + reconciliar pagos)

Los endpoints ya existen y están protegidos por `CRON_SECRET`. Lo más simple es un
scheduler externo gratis (p. ej. **cron-job.org**) con el header
`Authorization: Bearer <CRON_SECRET>`:

| Job | Método | URL | Frecuencia |
|---|---|---|---|
| Expirar holds | GET | `https://APP_URL/api/cron/expire-holds` | cada 5 min |
| Reconciliar pagos | GET | `https://APP_URL/api/cron/reconcile` | cada 15 min |

Prueba manual:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://APP_URL/api/cron/expire-holds
```

*(Alternativa: un servicio Cron nativo de Railway que ejecute esos `curl`.)*

## 7) Probar el flujo

Hacé una compra de seña en un auto publicado y pagá con una **tarjeta de prueba de
Mercado Pago**. La orden debe pasar a pagada en `/admin/ordenes` cuando llega el webhook.

---

## Pasar a producción (dinero real)

- Cambiá las credenciales de MP a **PROD** (las TEST no cobran de verdad).
- Dominio propio (Railway → **Custom Domain**) y `APP_URL` apuntando a él.
- Subí **inventario real verificado**, cambiá la contraseña admin, configurá Resend/Cloudinary.
- ⚠️ **Validá con tu contador/abogado fiscal en México** la comisión, el umbral PLD/AML y la
  regla de "terceros cobran solo seña" **antes** de operar con dinero de terceros.
