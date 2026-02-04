-- CreateTable
CREATE TABLE "NeededCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeededCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantedCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WantedCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NeededCard_userId_idx" ON "NeededCard"("userId");

-- CreateIndex
CREATE INDEX "NeededCard_setId_idx" ON "NeededCard"("setId");

-- CreateIndex
CREATE UNIQUE INDEX "NeededCard_userId_setId_cardId_key" ON "NeededCard"("userId", "setId", "cardId");

-- CreateIndex
CREATE INDEX "WantedCard_userId_idx" ON "WantedCard"("userId");

-- CreateIndex
CREATE INDEX "WantedCard_setId_idx" ON "WantedCard"("setId");

-- CreateIndex
CREATE UNIQUE INDEX "WantedCard_userId_setId_cardId_key" ON "WantedCard"("userId", "setId", "cardId");

-- AddForeignKey
ALTER TABLE "NeededCard" ADD CONSTRAINT "NeededCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantedCard" ADD CONSTRAINT "WantedCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
