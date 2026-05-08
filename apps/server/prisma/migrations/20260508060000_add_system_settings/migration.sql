CREATE TABLE "SystemSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "appName" TEXT NOT NULL DEFAULT 'Tickets Inventario',
    "logoPath" TEXT,
    "logoOriginalName" TEXT,
    "logoMimeType" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SystemSetting" ("id", "appName")
VALUES (1, 'Tickets Inventario')
ON CONFLICT ("id") DO NOTHING;
