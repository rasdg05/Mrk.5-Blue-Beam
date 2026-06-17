# Autos MX — marketplace + brokerage de autos usados (México)

Plataforma web para comprar autos usados **verificados**, con pago por **Mercado Pago** y **crypto (stablecoins)**. Catálogo curado: solo se publica lo previamente verificado (revisión legal vía Buró Vehicular, manual en v1) y fotografiado. Modelo **híbrido** (stock propio + terceros) y **diseñado para cumplir** (CFDI/KYC/PLD listos en el esquema).

> Estilo "entre Kavak y Mercado Libre con crypto". El compliance es el foso defensivo, no un obstáculo.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **PostgreSQL** + **Prisma**
- **Tailwind CSS**
- Pagos: **Mercado Pago** (Checkout Pro) · **NOWPayments** (crypto, Fase 2) detrás de una abstracción
- Auth admin: **JWT** (jose) en cookie httpOnly + **bcrypt**
- Email: **Resend** (no-op si no está configurado)

## Puesta en marcha (local)

```bash
# 1) Dependencias
npm install

# 2) Variables de entorno
cp .env.example .env   # ajustá credenciales (MP, Resend, etc.)

# 3) Base de datos (Postgres) — con Docker:
docker compose up -d db
#    …o un Postgres propio apuntado por DATABASE_URL

# 4) Migrar + generar cliente + seed (admin + autos demo)
npm run db:migrate      # aplica migraciones
npm run db:seed         # datos demo

# 5) Desarrollo
npm run dev             # http://localhost:3000
```

**Admin demo:** `admin@autosmx.test` / `admin1234` → http://localhost:3000/admin

## Arquitectura (lo importante)

### Capa de pagos (abstracción)
Una sola interfaz `PaymentProvider` (`src/lib/payments/provider.ts`); Orders/UI nunca llaman a un proveedor directo. Cada adaptador mapea sus estados al **set canónico** (`PaymentStatus` de Prisma).

- `createPayment` → checkout hospedado (redirect).
- `parseAndVerifyWebhook` → **verifica la firma sobre el body crudo** y mapea a canónico.
- `getStatus` → re-consulta autoritativa (el webhook es un *ping*).
- `refund` → reembolso total/parcial.

Agregar un proveedor (p. ej. **Bitso**) = implementar la interfaz, sin tocar el resto.

### Anti doble-venta (concurrencia)
`src/lib/orders/create-order.ts` bloquea la fila del auto con `SELECT … FOR UPDATE` dentro de la transacción y re-verifica `PUBLISHED`. Dos compradores no pueden pasar ambos la verificación: el segundo ve `RESERVED` y es rechazado. Los montos se calculan **server-side** desde la config del listing (nunca del cliente).

### Webhooks idempotentes
`src/app/api/webhooks/[provider]/route.ts`: verifica firma → persiste `WebhookEvent` (idempotente por `provider+eventId`) → procesa → responde **200 rápido**. Si el proceso falla, el **cron de reconciliación** lo recupera (Mercado Pago no reintenta si no recibe 200).

### Crons (proteger con `CRON_SECRET`)
- `GET /api/cron/expire-holds` — libera holds vencidos (auto vuelve a `PUBLISHED`).
- `GET /api/cron/reconcile` — auto-sana pagos colgados re-consultando al proveedor.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/expire-holds
```

### Verificación legal (Buró Vehicular)
`src/lib/verification/provider.ts` define el *seam*. En v1 es **manual**: el admin sube el resultado (aprobado/rechazado + REPUVE + reporte) desde el panel. La API de Buró Vehicular se enchufa después sin tocar el resto.

### Compliance (diseñado para cumplir)
- Dinero en **centavos enteros**; payloads de proveedor en **JSONB** (retención/auditoría).
- `amlFlag` cuando el precio supera el **umbral de identificación PLD** (`src/lib/compliance.ts`).
- Campos para **CFDI** y **KYC** de comprador/vendedor en el esquema.
- Fase 1: el pago online de **terceros** se limita a **seña**; la remisión se registra (no hay rail automático de fondos de terceros todavía).

> ⚠️ Los umbrales, comisiones y reglas fiscales son *defaults* razonables. **Validar con un contador/abogado fiscal en México** antes de operar con dinero real de terceros.

## Estructura

```
prisma/schema.prisma          # modelo de datos (centavos, enums, índices)
prisma/seed.ts                # admin + autos demo
src/lib/
  payments/                   # provider.ts, mercadopago.ts, nowpayments.ts, types.ts
  orders/                     # create-order.ts (FOR UPDATE), process-payment-event.ts (máquina de estados)
  verification/provider.ts    # seam Buró Vehicular (manual v1)
  auth/                       # session (jose) + password (bcrypt)
  notifications/              # email (Resend) + no-op
  compliance.ts, money.ts, catalog.ts, labels.ts
src/app/
  (público) page, autos, autos/[id] (checkout), orden/[orderNumber], vender
  admin/login, admin/(panel)/{dashboard,autos,ordenes,vendedores}
  api/webhooks/[provider], api/cron/{expire-holds,reconcile}
```

## Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Desarrollo |
| `npm run build` | `prisma generate` + build de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` / `db:deploy` | Migraciones (dev / prod) |
| `npm run db:seed` | Datos demo |
| `npm run db:studio` | Prisma Studio |

## Roadmap

- **Fase 1 (este MVP):** catálogo + filtros, detalle, **checkout de seña con Mercado Pago**, panel admin (autos, verificación, órdenes, vendedores), webhooks + crons, anti doble-venta.
- **Fase 2:** crypto (NOWPayments/Bitso), pago total online, remisión automática a terceros (MP Marketplace split + CFDI de comisión), KYC de comprador gatillado por PLD/crypto, WhatsApp.
- **Fase 3:** CFDI 4.0 vía PAC, tooling PLD/AML (umbrales, retención 10 años), REPUVE automatizado, 2FA admin, analítica.

## Configurar Mercado Pago (México)

1. Crear app en el panel de desarrolladores de Mercado Pago; usar **credenciales TEST** en dev.
2. `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` en `.env`.
3. Configurar la URL de webhook: `${APP_URL}/api/webhooks/mercadopago`.
4. Probar con usuarios/tarjetas de prueba de Mercado Pago.
