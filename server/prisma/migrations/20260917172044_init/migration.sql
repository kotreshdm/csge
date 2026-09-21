-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('SUPERUSER', 'MEMBER', 'ASSOCIATE');

-- CreateTable
CREATE TABLE "members" (
    "memberId" BIGSERIAL NOT NULL,
    "memberCode" VARCHAR(50) NOT NULL,
    "memberType" "MemberType" NOT NULL DEFAULT 'MEMBER',
    "name" VARCHAR(150) NOT NULL,
    "careOfName" VARCHAR(150),
    "addressLine1" VARCHAR(255),
    "addressLine2" VARCHAR(255),
    "city" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "mobile" VARCHAR(20),
    "email" VARCHAR(150),
    "dob" TIMESTAMP(3),
    "joinDate" TIMESTAMP(3),
    "passwordHash" VARCHAR(255),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("memberId")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_memberCode_key" ON "members"("memberCode");

-- CreateIndex
CREATE INDEX "members_name_idx" ON "members"("name");

-- CreateIndex
CREATE INDEX "members_mobile_idx" ON "members"("mobile");

-- CreateIndex
CREATE INDEX "members_city_idx" ON "members"("city");

-- CreateIndex
CREATE INDEX "members_memberType_idx" ON "members"("memberType");
