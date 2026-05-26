/*
  Warnings:

  - You are about to alter the column `name` on the `CertificationDictionary` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `fileName` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `firstName` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `lastName` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `rfidCardId` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `email` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `passwordHash` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `twoFactorSecret` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `certificateNumber` on the `EmployeeCertification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `name` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `internalCode` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `address` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `serialNumber` on the `Reader` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `locationName` on the `Reader` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to drop the `Anomaly` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `isApproved` on table `Absence` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Absence` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isActive` on table `CertificationDictionary` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `CertificationDictionary` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Contract` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `facilityId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdAt` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `EmployeeAssignment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `EmployeeCertification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `PayrollExport` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `facilityId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdAt` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `facilityId` to the `Reader` table without a default value. This is not possible if the table is not empty.
  - Made the column `isActive` on table `Reader` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `TimeEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `TimeEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Anomaly" DROP CONSTRAINT "Anomaly_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Anomaly" DROP CONSTRAINT "Anomaly_timeEventId_fkey";

-- DropIndex
DROP INDEX "Absence_employeeId_idx";

-- DropIndex
DROP INDEX "Contract_employeeId_idx";

-- DropIndex
DROP INDEX "Document_certificationId_idx";

-- DropIndex
DROP INDEX "Document_contractId_idx";

-- DropIndex
DROP INDEX "Document_employeeId_idx";

-- DropIndex
DROP INDEX "EmployeeAssignment_employeeId_idx";

-- DropIndex
DROP INDEX "EmployeeAssignment_projectId_idx";

-- DropIndex
DROP INDEX "EmployeeCertification_dictionaryId_idx";

-- DropIndex
DROP INDEX "EmployeeCertification_employeeId_idx";

-- DropIndex
DROP INDEX "PayrollExport_generatedByUserId_idx";

-- DropIndex
DROP INDEX "Reader_projectId_idx";

-- DropIndex
DROP INDEX "TimeEntry_employeeId_idx";

-- DropIndex
DROP INDEX "TimeEntry_payrollExportId_idx";

-- DropIndex
DROP INDEX "TimeEntry_projectId_idx";

-- DropIndex
DROP INDEX "TimeEvent_employeeId_idx";

-- DropIndex
DROP INDEX "TimeEvent_readerId_idx";

-- AlterTable
ALTER TABLE "Absence" ALTER COLUMN "isApproved" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "CertificationDictionary" ALTER COLUMN "name" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "isActive" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "startDate" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "endDate" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "fileName" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "facilityId" UUID NOT NULL,
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "rfidCardId" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "passwordHash" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "twoFactorSecret" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "EmployeeAssignment" ALTER COLUMN "assignedAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "unassignedAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "EmployeeCertification" ALTER COLUMN "certificateNumber" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "issuedAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "PayrollExport" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "facilityId" UUID NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "internalCode" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "startDate" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "endDate" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "Reader" ADD COLUMN     "facilityId" UUID NOT NULL,
ALTER COLUMN "serialNumber" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "locationName" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "isActive" SET NOT NULL;

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "status" "TimeEntryStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "startTime" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "endTime" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "TimeEvent" ALTER COLUMN "eventTime" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- DropTable
DROP TABLE "Anomaly";

-- DropEnum
DROP TYPE "AnomalyStatus";

-- CreateTable
CREATE TABLE "Facility" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(500) NOT NULL,
    "code" VARCHAR(255),
    "address" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeFacilityAccess" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "facilityId" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeFacilityAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "serialNumber" VARCHAR(255),
    "purchasedAt" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "equipmentId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(6),
    "notes" TEXT,

    CONSTRAINT "EquipmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "entityName" VARCHAR(255) NOT NULL,
    "entityId" UUID NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Facility_code_key" ON "Facility"("code");

-- CreateIndex
CREATE INDEX "EmployeeFacilityAccess_employeeId_idx" ON "EmployeeFacilityAccess"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeFacilityAccess_facilityId_idx" ON "EmployeeFacilityAccess"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeFacilityAccess_employeeId_facilityId_key" ON "EmployeeFacilityAccess"("employeeId", "facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentCategory_name_key" ON "EquipmentCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_serialNumber_key" ON "Equipment"("serialNumber");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeFacilityAccess" ADD CONSTRAINT "EmployeeFacilityAccess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeFacilityAccess" ADD CONSTRAINT "EmployeeFacilityAccess_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reader" ADD CONSTRAINT "Reader_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EquipmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
