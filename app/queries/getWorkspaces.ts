import { resolver } from "blitz"
import db, { NotionOAuthTokenDefaultFields, Prisma } from "db"
import { z } from "zod"

const GetWorkspaces = z.object({})

export default resolver.pipe(
  resolver.zod(GetWorkspaces),
  resolver.authorize(),
  async (input, ctx) => {
    const notionOauthTokens = await db.notionOAuthToken.findMany({
      where: {
        userId: ctx.session.userId,
      },
      select: NotionOAuthTokenDefaultFields,
    })

    return notionOauthTokens
  }
)
