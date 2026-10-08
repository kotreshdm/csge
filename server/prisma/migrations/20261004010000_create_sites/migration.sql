CREATE TABLE "sites" (
    "id" BIGSERIAL NOT NULL,
    "layoutId" BIGINT NOT NULL,
    "siteNo" TEXT NOT NULL,
    "eastWest" DECIMAL(12,2) NOT NULL,
    "northSouth" DECIMAL(12,2) NOT NULL,
    "totalSqFeet" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "registeredAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "allottedMemberId" BIGINT,
    "allotmentDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sites_layoutId_siteNo_key" ON "sites"("layoutId", "siteNo");
CREATE INDEX "sites_layoutId_idx" ON "sites"("layoutId");
CREATE INDEX "sites_allottedMemberId_idx" ON "sites"("allottedMemberId");
CREATE INDEX "sites_status_idx" ON "sites"("status");

ALTER TABLE "sites"
ADD CONSTRAINT "sites_layoutId_fkey"
FOREIGN KEY ("layoutId") REFERENCES "layouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sites"
ADD CONSTRAINT "sites_allottedMemberId_fkey"
FOREIGN KEY ("allottedMemberId") REFERENCES "members"("memberId") ON DELETE SET NULL ON UPDATE CASCADE;