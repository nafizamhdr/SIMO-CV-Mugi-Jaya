-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "Specification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Specification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCRecord" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "specificationId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "status" "QCStatus" NOT NULL DEFAULT 'PENDING',
    "dimensions" JSONB NOT NULL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QCRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NCItem" (
    "id" TEXT NOT NULL,
    "qcRecordId" TEXT NOT NULL,
    "defectDesc" TEXT NOT NULL,
    "photoUrl" TEXT,
    "picRework" TEXT NOT NULL,
    "estimatedDone" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "NCItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCCertificate" (
    "id" TEXT NOT NULL,
    "certNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "batchIds" TEXT[],
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QCCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NCItem_qcRecordId_key" ON "NCItem"("qcRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "QCCertificate_certNumber_key" ON "QCCertificate"("certNumber");

-- AddForeignKey
ALTER TABLE "Specification" ADD CONSTRAINT "Specification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCRecord" ADD CONSTRAINT "QCRecord_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCRecord" ADD CONSTRAINT "QCRecord_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCRecord" ADD CONSTRAINT "QCRecord_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NCItem" ADD CONSTRAINT "NCItem_qcRecordId_fkey" FOREIGN KEY ("qcRecordId") REFERENCES "QCRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

