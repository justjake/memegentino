-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GeneratedImage" (
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
    "allowPublic" BOOLEAN,
    "allowWorkspace" BOOLEAN,
    "allowBySourceBlock" BOOLEAN,
    CONSTRAINT "GeneratedImage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GeneratedImage_createdWithTokenId_fkey" FOREIGN KEY ("createdWithTokenId") REFERENCES "NotionOAuthToken" ("bot_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GeneratedImage" ("allowBySourceBlock", "allowPublic", "allowWorkspace", "bottomText", "createdAt", "createdByUserId", "createdWithTokenId", "data", "effects", "id", "mimeType", "sourceBlockId", "sourceWorkspaceId", "topText", "updatedAt") SELECT "allowBySourceBlock", "allowPublic", "allowWorkspace", "bottomText", "createdAt", "createdByUserId", "createdWithTokenId", "data", "effects", "id", "mimeType", "sourceBlockId", "sourceWorkspaceId", "topText", "updatedAt" FROM "GeneratedImage";
DROP TABLE "GeneratedImage";
ALTER TABLE "new_GeneratedImage" RENAME TO "GeneratedImage";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
