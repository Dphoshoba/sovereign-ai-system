-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "type" TEXT NOT NULL DEFAULT 'lead',
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT,
    "interests" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientProfile_type_idx" ON "ClientProfile"("type");

-- CreateIndex
CREATE INDEX "ClientProfile_status_idx" ON "ClientProfile"("status");

-- CreateIndex
CREATE INDEX "ClientProfile_createdAt_idx" ON "ClientProfile"("createdAt");
