-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "NotionOAuthToken" (
    "bot_ui" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "workspace_name" TEXT,
    "workspace_icon" TEXT,
    "access_token" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    CONSTRAINT "NotionOAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
