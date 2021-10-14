import { paginate, resolver } from "blitz"
import db, { MemeDefaultFields, Prisma } from "db"

export interface GetMemesInput
  extends Pick<Prisma.MemeFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where: givenWhere = {}, orderBy, skip = 0, take = 100 }: GetMemesInput, ctx) => {
    const { userId } = ctx.session

    const { OR, ...safeWhere } = givenWhere

    const where: Prisma.MemeWhereInput = {
      ...safeWhere,
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
