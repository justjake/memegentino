import { resolver } from "blitz"
import db from "db"
import { z } from "zod"

const K = 1024
const M = K * K

export const CreateMeme = z.object({
  createdWithTokenId: z.string().uuid(),
  sourceBlockId: z.string().uuid(),
  mimeType: z.string().nonempty(),
  dataBase64: z.string().max(M * 2, "max data size is 2mb"),

  topText: z.string().optional(),
  bottomText: z.string().optional(),
  effects: z.string().optional(),

  allowPublic: z.boolean().optional(), // anyone on the internet can view
  allowWorkspace: z.boolean().optional(), // only people logged in with the same workspace can view
  allowBySourceBlock: z.boolean().optional(), // OK if the reader is in the workspace and can read the source block
})

export default resolver.pipe(
  resolver.zod(CreateMeme),
  resolver.authorize(),
  async (input: z.infer<typeof CreateMeme>, ctx) => {
    const token = await db.notionOAuthToken.findFirst({
      where: {
        bot_id: input.createdWithTokenId,
        userId: ctx.session.userId,
      },
      rejectOnNotFound: true,
    })

    const { dataBase64, ...memeInput } = input

    const meme = await db.meme.create({
      data: {
        ...memeInput,
        data: Buffer.from(dataBase64, "base64"),
        createdByUserId: ctx.session.userId,
        sourceWorkspaceId: token.workspace_id,
      },
    })

    return meme
  }
)
