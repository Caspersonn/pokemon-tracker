-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectedCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectedCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterSeries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilterSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CollectedCard_userId_idx" ON "CollectedCard"("userId");

-- CreateIndex
CREATE INDEX "CollectedCard_setId_idx" ON "CollectedCard"("setId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectedCard_userId_setId_cardId_key" ON "CollectedCard"("userId", "setId", "cardId");

-- CreateIndex
CREATE INDEX "FilterSeries_userId_idx" ON "FilterSeries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FilterSeries_userId_seriesId_key" ON "FilterSeries"("userId", "seriesId");

-- CreateIndex
CREATE INDEX "WishlistSet_userId_idx" ON "WishlistSet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistSet_userId_setId_key" ON "WishlistSet"("userId", "setId");

-- AddForeignKey
ALTER TABLE "CollectedCard" ADD CONSTRAINT "CollectedCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilterSeries" ADD CONSTRAINT "FilterSeries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistSet" ADD CONSTRAINT "WishlistSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
