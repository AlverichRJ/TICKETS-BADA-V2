-- Catálogo local de equipos de cómputo para inventario.
CREATE TABLE "ComputerEquipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComputerEquipment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Device" ADD COLUMN "assignedComputerEquipmentId" TEXT;

CREATE UNIQUE INDEX "ComputerEquipment_name_key" ON "ComputerEquipment"("name");
CREATE INDEX "Device_assignedComputerEquipmentId_idx" ON "Device"("assignedComputerEquipmentId");

ALTER TABLE "Device" ADD CONSTRAINT "Device_assignedComputerEquipmentId_fkey" FOREIGN KEY ("assignedComputerEquipmentId") REFERENCES "ComputerEquipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
