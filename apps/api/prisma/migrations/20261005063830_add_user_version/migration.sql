-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;
