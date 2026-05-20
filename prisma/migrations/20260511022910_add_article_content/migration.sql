/*
  Warnings:

  - You are about to drop the column `actorId` on the `AuditEvent` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `AuditEvent` table. All the data in the column will be lost.
  - Added the required column `entity` to the `AuditEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `AuditEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AuditEvent_action_idx";

-- DropIndex
DROP INDEX "AuditEvent_actorId_idx";

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "content" TEXT;

-- AlterTable
ALTER TABLE "AuditEvent" DROP COLUMN "actorId",
DROP COLUMN "target",
ADD COLUMN     "entity" TEXT NOT NULL,
ADD COLUMN     "entityId" TEXT NOT NULL;
