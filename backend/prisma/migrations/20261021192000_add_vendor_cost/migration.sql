/*
  Warnings:

  - Changed the type of `date` on the `weddings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "cost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "weddings" ALTER COLUMN "bride" DROP DEFAULT,
ALTER COLUMN "groom" DROP DEFAULT,
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "venue" DROP DEFAULT,
ALTER COLUMN "budget" SET DEFAULT 0;
