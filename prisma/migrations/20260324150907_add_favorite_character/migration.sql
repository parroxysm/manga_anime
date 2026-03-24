-- CreateTable
CREATE TABLE "FavoriteCharacter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "characterId" TEXT NOT NULL,
    CONSTRAINT "FavoriteCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteCharacter_userId_characterId_key" ON "FavoriteCharacter"("userId", "characterId");
