-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- DropForeignKey
ALTER TABLE "InterviewReport" DROP CONSTRAINT "InterviewReport_sessionId_fkey";

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "strongerAnswer" TEXT;

-- AlterTable
ALTER TABLE "InterviewReport" ADD COLUMN     "durationMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "gaps" JSONB,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "problemSolving" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roleSlug" TEXT,
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "systemDesign" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "topics" TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "overallScore" SET DEFAULT 0,
ALTER COLUMN "communication" SET DEFAULT 0,
ALTER COLUMN "technical" SET DEFAULT 0,
ALTER COLUMN "confidence" SET DEFAULT 0,
ALTER COLUMN "summary" SET DEFAULT '',
ALTER COLUMN "improvements" SET DEFAULT '';

-- Backfill new required columns for any existing reports, then enforce NOT NULL
UPDATE "InterviewReport" r
SET "userId" = s."userId",
    "roleSlug" = s."role",
    "updatedAt" = COALESCE(r."createdAt", CURRENT_TIMESTAMP),
    "status" = 'READY'
FROM "InterviewSession" s
WHERE s."id" = r."sessionId";

ALTER TABLE "InterviewReport" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "roleSlug" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "RoleFeedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleSlug" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "latestScore" INTEGER,
    "bestScore" INTEGER,
    "skillAverages" JSONB NOT NULL,
    "recurringGaps" JSONB NOT NULL,
    "nextStep" TEXT NOT NULL DEFAULT '',
    "lastSessionAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackGoal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetScore" INTEGER NOT NULL,
    "targetDate" DATE,
    "label" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleFeedback_userId_roleSlug_key" ON "RoleFeedback"("userId", "roleSlug");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackGoal_userId_key" ON "FeedbackGoal"("userId");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_createdAt_idx" ON "InterviewSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewReport_userId_createdAt_idx" ON "InterviewReport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewReport_userId_roleSlug_createdAt_idx" ON "InterviewReport"("userId", "roleSlug", "createdAt");

-- AddForeignKey
ALTER TABLE "InterviewReport" ADD CONSTRAINT "InterviewReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewReport" ADD CONSTRAINT "InterviewReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleFeedback" ADD CONSTRAINT "RoleFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackGoal" ADD CONSTRAINT "FeedbackGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

