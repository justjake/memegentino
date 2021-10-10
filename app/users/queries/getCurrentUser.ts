import { Ctx } from "blitz"
import db, { NotionOAuthTokenDefaultFields } from "db"

export default async function getCurrentUser(_ = null, { session }: Ctx) {
  if (!session.userId) return null

  const user = await db.user.findFirst({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      notionOAuthTokens: {
        select: NotionOAuthTokenDefaultFields,
      },
    },
  })

  return user
}
