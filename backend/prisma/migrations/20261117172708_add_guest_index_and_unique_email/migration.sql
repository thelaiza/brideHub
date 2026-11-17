/*
  Warnings:

  - A unique constraint covering the columns `[userId,email]` on the table `guests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "guests_userId_idx" ON "guests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "guests_userId_email_key" ON "guests"("userId", "email");
