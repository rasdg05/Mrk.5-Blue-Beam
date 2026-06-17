-- CreateEnum
CREATE TYPE "CarOwnership" AS ENUM ('PLATFORM', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PUBLISHED', 'RESERVED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'GAS');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('DEPOSIT', 'FULL');

-- CreateEnum
CREATE TYPE "DepositType" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "RepuveStatus" AS ENUM ('CLEAR', 'REPORTED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CarLegalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('EDITOR', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "OrderIntent" AS ENUM ('DEPOSIT', 'FULL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PAYMENT', 'RESERVED', 'PAID', 'CANCELLED', 'EXPIRED', 'COMPLETED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('NONE', 'PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentProviderType" AS ENUM ('MERCADOPAGO', 'BITSO', 'NOWPAYMENTS');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'SPEI', 'OXXO', 'MSI', 'WALLET', 'CRYPTO_USDC', 'CRYPTO_USDT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('DEPOSIT', 'FULL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'IN_PROCESS', 'CONFIRMING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'UNDERPAID', 'OVERPAID');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "OrderDocumentType" AS ENUM ('FACTURA', 'ENDOSO', 'ID', 'CONTRACT', 'OTHER');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "vin" TEXT,
    "title" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" TEXT,
    "mileageKm" INTEGER NOT NULL,
    "transmission" "TransmissionType" NOT NULL,
    "fuel" "FuelType" NOT NULL,
    "color" TEXT,
    "doors" INTEGER,
    "description" TEXT,
    "priceMxn" INTEGER NOT NULL,
    "locationCity" TEXT,
    "locationState" TEXT,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'DEPOSIT',
    "depositType" "DepositType",
    "depositValue" INTEGER,
    "acceptsMercadoPago" BOOLEAN NOT NULL DEFAULT true,
    "acceptsCrypto" BOOLEAN NOT NULL DEFAULT false,
    "ownership" "CarOwnership" NOT NULL DEFAULT 'PLATFORM',
    "sellerId" TEXT,
    "legalCheckStatus" "CarLegalStatus" NOT NULL DEFAULT 'PENDING',
    "repuveStatus" "RepuveStatus" NOT NULL DEFAULT 'UNKNOWN',
    "repuveCheckedAt" TIMESTAMP(3),
    "verificationReportUrl" TEXT,
    "verifiedByAdminId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "photographedAt" TIMESTAMP(3),
    "status" "CarStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarPhoto" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarFeature" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "CarFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "payoutClabe" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerKyc" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "rfc" TEXT,
    "curp" TEXT,
    "idDocType" TEXT,
    "idDocNumber" TEXT,
    "idDocFrontUrl" TEXT,
    "idDocBackUrl" TEXT,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerKyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerKyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rfc" TEXT,
    "curp" TEXT,
    "idDocType" TEXT,
    "idDocNumber" TEXT,
    "idDocFrontUrl" TEXT,
    "idDocBackUrl" TEXT,
    "status" "KycStatus" NOT NULL DEFAULT 'NONE',
    "verifiedAt" TIMESTAMP(3),
    "verifiedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerKyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "buyerUserId" TEXT,
    "guestEmail" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "intent" "OrderIntent" NOT NULL,
    "priceMxnSnapshot" INTEGER NOT NULL,
    "depositMxnSnapshot" INTEGER,
    "amountDueMxn" INTEGER NOT NULL,
    "balanceDueMxn" INTEGER NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "amlFlag" BOOLEAN NOT NULL DEFAULT false,
    "sellerPayoutAmount" INTEGER,
    "platformFeeAmount" INTEGER,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'NONE',
    "payoutRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "PaymentProviderType" NOT NULL,
    "method" "PaymentMethodType",
    "kind" "PaymentKind" NOT NULL,
    "providerRef" TEXT,
    "checkoutUrl" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "amountPaid" INTEGER,
    "netAmount" INTEGER,
    "idempotencyKey" TEXT NOT NULL,
    "rawCreate" JSONB,
    "rawLatest" JSONB,
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "providerRefundRef" TEXT,
    "reason" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDocument" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "OrderDocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProviderType" NOT NULL,
    "eventId" TEXT NOT NULL,
    "providerRef" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "carId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Model_brandId_idx" ON "Model"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "Model_brandId_slug_key" ON "Model"("brandId", "slug");

-- CreateIndex
CREATE INDEX "Car_status_idx" ON "Car"("status");

-- CreateIndex
CREATE INDEX "Car_brandId_modelId_idx" ON "Car"("brandId", "modelId");

-- CreateIndex
CREATE INDEX "Car_priceMxn_idx" ON "Car"("priceMxn");

-- CreateIndex
CREATE INDEX "Car_year_idx" ON "Car"("year");

-- CreateIndex
CREATE INDEX "CarPhoto_carId_idx" ON "CarPhoto"("carId");

-- CreateIndex
CREATE INDEX "CarFeature_carId_idx" ON "CarFeature"("carId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_email_key" ON "Seller"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SellerKyc_sellerId_key" ON "SellerKyc"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerKyc_userId_key" ON "BuyerKyc"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_carId_idx" ON "Order"("carId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_buyerUserId_idx" ON "Order"("buyerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_provider_providerRef_idx" ON "Payment"("provider", "providerRef");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_orderId_key" ON "Reservation"("orderId");

-- CreateIndex
CREATE INDEX "Reservation_carId_idx" ON "Reservation"("carId");

-- CreateIndex
CREATE INDEX "Reservation_status_expiresAt_idx" ON "Reservation"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "OrderDocument_orderId_idx" ON "OrderDocument"("orderId");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");

-- CreateIndex
CREATE INDEX "WebhookEvent_providerRef_idx" ON "WebhookEvent"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "Lead_carId_idx" ON "Lead"("carId");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarPhoto" ADD CONSTRAINT "CarPhoto_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarFeature" ADD CONSTRAINT "CarFeature_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerKyc" ADD CONSTRAINT "SellerKyc_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerKyc" ADD CONSTRAINT "BuyerKyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
