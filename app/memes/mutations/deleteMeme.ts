import { resolver } from "blitz"
import db from "db"
import { z } from "zod"

const DeleteMeme = z.object({
  id: z.string(),
})

export default resolver.pipe(
  resolver.zod(DeleteMeme),
  resolver.authorize(),
  async ({ id }, ctx) => {
    const meme = await db.meme.deleteMany({
      where: {
        createdByUserId: ctx.session.userId,
        id,
      },
    })

    return meme
  }
)
