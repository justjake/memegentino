import { resolver, NotFoundError } from "blitz"
import db, { MemeDefaultFields } from "db"
import { z } from "zod"

const GetMeme = z.object({
  id: z.string(),
})

export default resolver.pipe(resolver.zod(GetMeme), resolver.authorize(), async ({ id }, ctx) => {
  // TODO: in multi-tenant app, you must add validation to ensure correct tenant
  const meme = await db.meme.findFirst({
    where: { id, createdByUserId: ctx.session.userId },
    select: MemeDefaultFields,
  })

  if (!meme) throw new NotFoundError()

  return meme
})
