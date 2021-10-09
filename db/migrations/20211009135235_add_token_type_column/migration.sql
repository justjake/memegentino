/*
  Warnings:

  - Added the required column `token_type` to the `NotionOAuthToken` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotionOAuthToken" (
    "bot_id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "workspace_name" TEXT,
    "workspace_icon" TEXT,
    "access_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    CONSTRAINT "NotionOAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NotionOAuthToken" ("access_token", "bot_id", "owner", "userId", "workspace_icon", "workspace_id", "workspace_name") SELECT "access_token", "bot_id", "owner", "userId", "workspace_icon", "workspace_id", "workspace_name" FROM "NotionOAuthToken";
DROP TABLE "NotionOAuthToken";
ALTER TABLE "new_NotionOAuthToken" RENAME TO "NotionOAuthToken";
CREATE UNIQUE INDEX "NotionOAuthToken_workspace_id_userId_key" ON "NotionOAuthToken"("workspace_id", "userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
