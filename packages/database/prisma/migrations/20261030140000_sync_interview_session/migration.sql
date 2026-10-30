-- Bring the migration history in line with schema.prisma.
-- Databases created with `prisma db push` already have these columns, so every
-- statement is written to be a no-op there.

ALTER TABLE "InterviewSession" ADD COLUMN IF NOT EXISTS "introduction" TEXT;

-- userId was created as TEXT by the original interview migration but is an Int in the schema
ALTER TABLE "InterviewSession" ALTER COLUMN "userId" TYPE INTEGER USING "userId"::integer;
