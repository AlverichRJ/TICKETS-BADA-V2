CREATE TABLE "DeviceDeliveryHistory" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deliveredById" TEXT,
    "previousAssignedUserId" TEXT,
    "previousAssignedUserName" TEXT NOT NULL,
    "previousAssignedUserEmail" TEXT,
    "previousDepartmentId" TEXT,
    "previousDepartmentName" TEXT,
    "previousComputerEquipmentId" TEXT,
    "previousComputerEquipmentName" TEXT,
    "equipment" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "state" "DeviceState" NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceDeliveryHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeviceDeliveryHistory_deviceId_idx" ON "DeviceDeliveryHistory"("deviceId");
CREATE INDEX "DeviceDeliveryHistory_deliveredById_idx" ON "DeviceDeliveryHistory"("deliveredById");
CREATE INDEX "DeviceDeliveryHistory_previousDepartmentId_idx" ON "DeviceDeliveryHistory"("previousDepartmentId");
CREATE INDEX "DeviceDeliveryHistory_deliveredAt_idx" ON "DeviceDeliveryHistory"("deliveredAt");

ALTER TABLE "DeviceDeliveryHistory" ADD CONSTRAINT "DeviceDeliveryHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeviceDeliveryHistory" ADD CONSTRAINT "DeviceDeliveryHistory_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
