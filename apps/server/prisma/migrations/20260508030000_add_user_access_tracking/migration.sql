-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3), ADD COLUMN "loginCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing users as accounts that have accessed at least once because records are created through OAuth login.
UPDATE "User"
SET "lastLoginAt" = COALESCE("updatedAt", "createdAt"),
    "loginCount" = CASE WHEN "loginCount" = 0 THEN 1 ELSE "loginCount" END;
