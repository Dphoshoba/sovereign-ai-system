-- AlterTable
ALTER TABLE "CreatorLead" ADD COLUMN     "bottlenecks" TEXT,
ADD COLUMN     "leadScore" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "niche" TEXT,
ADD COLUMN     "projectedValue" DOUBLE PRECISION,
ADD COLUMN     "readiness" TEXT NOT NULL DEFAULT 'unknown';

-- CreateIndex
CREATE INDEX "CreatorLead_readiness_idx" ON "CreatorLead"("readiness");
