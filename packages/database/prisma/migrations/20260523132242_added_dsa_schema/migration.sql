/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "password" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "lcId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topic" TEXT,
    "acceptanceRate" DOUBLE PRECISION,
    "leetcodeUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemCompany" (
    "id" TEXT NOT NULL,
    "frequency" INTEGER,
    "timeWindow" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problemId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ProblemCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_lcId_key" ON "Problem"("lcId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "ProblemCompany_problemId_idx" ON "ProblemCompany"("problemId");

-- CreateIndex
CREATE INDEX "ProblemCompany_companyId_idx" ON "ProblemCompany"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemCompany_problemId_companyId_timeWindow_key" ON "ProblemCompany"("problemId", "companyId", "timeWindow");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemCompany" ADD CONSTRAINT "ProblemCompany_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemCompany" ADD CONSTRAINT "ProblemCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
