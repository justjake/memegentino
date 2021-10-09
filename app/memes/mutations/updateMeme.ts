import { resolver } from "blitz"
import db from "db"
import { z } from "zod"

const UpdateMeme = z.object({
  id: z.string().uuid(),
  allowPublic: z.boolean().optional(),
  allowWorkspace: z.boolean().optional(),
  allowBySourceBlock: z.boolean().optional(),
})

export default resolver.pipe(
  resolver.zod(UpdateMeme),
  resolver.authorize(),
  async ({ id, ...data }, ctx) => {
    const meme = await db.meme.updateMany({
      where: { id, createdByUserId: ctx.session.userId },
      data,
    })

    return meme
  }
)
