ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM (
    'PLATFORM_ADMIN',
    'ADMIN',
    'DRIVER',
    'USER',
    'COORDINATOR'
);

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "UserRole"
USING (
    CASE
        WHEN "role"::text = 'OPERATOR' THEN 'COORDINATOR'::"UserRole"
        ELSE "role"::text::"UserRole"
    END
);

DROP TYPE "UserRole_old";

ALTER TABLE "Company" ADD COLUMN "emailDomain" TEXT;

UPDATE "Company"
SET "emailDomain" = CONCAT(
    'empresa-',
    regexp_replace("cnpj", '\D', '', 'g'),
    '.local'
)
WHERE "emailDomain" IS NULL;

ALTER TABLE "Company"
ALTER COLUMN "emailDomain" SET NOT NULL;

CREATE UNIQUE INDEX "Company_emailDomain_key" ON "Company"("emailDomain");

ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "User"
ALTER COLUMN "companyId" DROP NOT NULL;
