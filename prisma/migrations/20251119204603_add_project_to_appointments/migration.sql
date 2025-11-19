-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "appointments_projectId_idx" ON "appointments"("projectId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
