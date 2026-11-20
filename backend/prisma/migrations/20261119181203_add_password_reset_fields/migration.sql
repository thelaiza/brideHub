-- Garante que não existam duplicatas após normalização lower(email) antes de atualizar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    GROUP BY lower("email")
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem e-mails duplicados quando normalizados para minúsculo na tabela users. Resolva antes de aplicar a migration.';
  END IF;
END $$;

UPDATE "users"
SET "email" = lower(trim("email"))
WHERE "email" <> lower(trim("email"));

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT,
ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "users_resetPasswordToken_key" ON "users"("resetPasswordToken");