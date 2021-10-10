import { enhancePrisma } from "blitz"
import { Prisma, PrismaClient } from "@prisma/client"

const EnhancedPrisma = enhancePrisma(PrismaClient)

export const NotionOAuthTokenDefaultFields = {
  bot_id: true,
  workspace_icon: true,
  workspace_id: true,
  workspace_name: true,
} as const

export const MemeDefaultFields = {
  id: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
  createdWithTokenId: true,
  topText: true,
  bottomText: true,
  effects: true,
  sourceBlockId: true,
  sourceWorkspaceId: true,
  allowBySourceBlock: true,
  allowPublic: true,
  allowWorkspace: true,
  mimeType: true,
} as const

export * from "@prisma/client"
export default new EnhancedPrisma()
