/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `source` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `postedAt` on the `Job` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL,
DROP COLUMN "postedAt",
ADD COLUMN     "postedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "isVerified" SET DEFAULT false,
ALTER COLUMN "isSaved" SET DEFAULT false;

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentQues" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQuestion" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "score" INTEGER,
    "feedback" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewReport" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "technical" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewQuestion_sessionId_order_key" ON "InterviewQuestion"("sessionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewReport_sessionId_key" ON "InterviewReport"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_externalId_key" ON "Job"("externalId");

-- AddForeignKey
ALTER TABLE "InterviewQuestion" ADD CONSTRAINT "InterviewQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewReport" ADD CONSTRAINT "InterviewReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
