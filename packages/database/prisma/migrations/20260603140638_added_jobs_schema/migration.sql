-- CreateEnum
CREATE TYPE "jobType" AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'other');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('startup', 'faang', 'company', 'hft', 'other');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyLetter" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "salary" INTEGER,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "type" "jobType" NOT NULL,
    "category" "JobCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT[],
    "applyUrl" TEXT NOT NULL,
    "postedAt" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL,
    "isSaved" BOOLEAN NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
