-- Catálogo local de departamentos para usuarios e inventario.
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "Device" ADD COLUMN "departmentId" TEXT;

CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");
CREATE INDEX "Device_departmentId_idx" ON "Device"("departmentId");

ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
