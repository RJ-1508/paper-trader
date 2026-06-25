-- CreateEnum
CREATE TYPE "OptionType" AS ENUM ('CALL', 'PUT');

-- CreateEnum
CREATE TYPE "PositionDirection" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('OPEN', 'CLOSED', 'EXPIRED', 'EXERCISED', 'ASSIGNED');

-- CreateEnum
CREATE TYPE "OptionEventType" AS ENUM ('OPEN', 'CLOSE', 'EXPIRE', 'EXERCISE', 'ASSIGN');

-- CreateTable
CREATE TABLE "OptionPosition" (
    "id" SERIAL NOT NULL,
    "portfolioId" INTEGER NOT NULL,
    "underlying" TEXT NOT NULL,
    "optionType" "OptionType" NOT NULL,
    "strike" DECIMAL(18,2) NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "occSymbol" TEXT NOT NULL,
    "multiplier" INTEGER NOT NULL DEFAULT 100,
    "direction" "PositionDirection" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "openPremium" DECIMAL(18,2) NOT NULL,
    "collateralCash" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "reservedShares" INTEGER NOT NULL DEFAULT 0,
    "status" "PositionStatus" NOT NULL DEFAULT 'OPEN',
    "closePremium" DECIMAL(18,2),
    "realizedPnL" DECIMAL(18,2),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "OptionPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionEvent" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "type" "OptionEventType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(18,2),
    "cashEffect" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptionPosition_portfolioId_status_idx" ON "OptionPosition"("portfolioId", "status");

-- CreateIndex
CREATE INDEX "OptionEvent_positionId_idx" ON "OptionEvent"("positionId");

-- AddForeignKey
ALTER TABLE "OptionPosition" ADD CONSTRAINT "OptionPosition_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionEvent" ADD CONSTRAINT "OptionEvent_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "OptionPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
