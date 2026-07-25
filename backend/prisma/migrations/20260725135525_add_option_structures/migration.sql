-- CreateEnum
CREATE TYPE "StructureStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "OptionPosition" ADD COLUMN     "structureId" INTEGER;

-- CreateTable
CREATE TABLE "OptionStructure" (
    "id" SERIAL NOT NULL,
    "portfolioId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "status" "StructureStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "realizedPnL" DECIMAL(18,2),

    CONSTRAINT "OptionStructure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptionStructure_portfolioId_status_idx" ON "OptionStructure"("portfolioId", "status");

-- CreateIndex
CREATE INDEX "OptionPosition_structureId_idx" ON "OptionPosition"("structureId");

-- AddForeignKey
ALTER TABLE "OptionPosition" ADD CONSTRAINT "OptionPosition_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "OptionStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionStructure" ADD CONSTRAINT "OptionStructure_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
