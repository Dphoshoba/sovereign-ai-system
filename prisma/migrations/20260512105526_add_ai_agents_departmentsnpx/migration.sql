-- CreateTable
CREATE TABLE "AiDepartment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT,
    "role" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "tools" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiDepartment_name_key" ON "AiDepartment"("name");

-- CreateIndex
CREATE INDEX "AiDepartment_status_idx" ON "AiDepartment"("status");

-- CreateIndex
CREATE INDEX "AiAgent_status_idx" ON "AiAgent"("status");

-- CreateIndex
CREATE INDEX "AiAgent_departmentId_idx" ON "AiAgent"("departmentId");

-- AddForeignKey
ALTER TABLE "AiAgent" ADD CONSTRAINT "AiAgent_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "AiDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
