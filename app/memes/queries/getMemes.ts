import { paginate, resolver } from "blitz"
import db, { Prisma } from "db"

export const MemeDefaultFields: Prisma.MemeSelect = {
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

interface GetMemesInput
  extends Pick<Prisma.MemeFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where: givenWhere, orderBy, skip = 0, take = 100 }: GetMemesInput, ctx) => {
    const { userId } = ctx.session

    const where: Prisma.MemeWhereInput = {
      ...givenWhere,
      createdByUserId: userId,
    }

    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: memes,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.meme.count({ where }),
      query: (paginateArgs) =>
        db.meme.findMany({
          ...paginateArgs,
          orderBy,
          where,
          select: MemeDefaultFields,
        }),
    })

    return {
      memes,
      nextPage,
      hasMore,
      count,
    }
  }
)
