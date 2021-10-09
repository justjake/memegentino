-- CreateTable
CREATE TABLE "GeneratedImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdByUserId" INTEGER NOT NULL,
    "createdWithTokenId" TEXT NOT NULL,
    "topText" TEXT,
    "bottomText" TEXT,
    "effects" TEXT,
    "sourceBlockId" TEXT NOT NULL,
    "sourceWorkspaceId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "allowPublic" BOOLEAN NOT NULL,
    "allowWorkspace" BOOLEAN NOT NULL,
    "allowBySourceBlock" BOOLEAN NOT NULL,
    CONSTRAINT "GeneratedImage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GeneratedImage_createdWithTokenId_fkey" FOREIGN KEY ("createdWithTokenId") REFERENCES "NotionOAuthToken" ("bot_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
