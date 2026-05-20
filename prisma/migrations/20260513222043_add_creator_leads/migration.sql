-- CreateTable
CREATE TABLE "CreatorLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "creatorType" TEXT,
    "source" TEXT NOT NULL DEFAULT 'starter-pack',
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorLead_email_key" ON "CreatorLead"("email");

-- CreateIndex
CREATE INDEX "CreatorLead_email_idx" ON "CreatorLead"("email");

-- CreateIndex
CREATE INDEX "CreatorLead_status_idx" ON "CreatorLead"("status");

-- CreateIndex
CREATE INDEX "CreatorLead_createdAt_idx" ON "CreatorLead"("createdAt");
