import { findAllFiles } from "app/core/components/MemeTemplateGallery"
import { resolver, NotFoundError, AuthorizationError } from "blitz"
import db, { MemeDefaultFields } from "db"
import { getStableNotionFileKey, serverNotionClient } from "integrations/notion"
import { z } from "zod"

const GetTemplate = z.object({
  workspaceId: z.string(),
  blockId: z.string(),
})

export default resolver.pipe(
  resolver.zod(GetTemplate),
  resolver.authorize(),
  async ({ workspaceId, blockId }, ctx) => {
    const { userId } = ctx.session

    const notionToken = await db.notionOAuthToken.findFirst({
      where: {
        userId,
        workspace_id: workspaceId,
      },
    })

    if (!notionToken) {
      throw new AuthorizationError()
    }

    const notion = serverNotionClient(notionToken)

    const page = await notion.pages.retrieve({
      page_id: blockId,
    })

    if (!("properties" in page)) {
      throw new NotFoundError()
    }

    const files = findAllFiles(page)
    const fileMap: Record<string, string> = {}

    await Promise.all(
      files.map(async (file) => {
        // const controller = new AbortController()
        // const { signal } = controller

        const res = await fetch(file.url /*{ signal }*/)
        const contentType = res.headers.get("Content-Type") || ""
        const isImage = contentType.startsWith("image/") || file.url.match(/\.(png|jpe?g|heic|gif)/)
        if (!isImage) {
          // controller.abort()
          return
        }

        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString("base64")

        fileMap[getStableNotionFileKey(file.url)] = `data:${contentType};base64,${base64}`
      })
    )

    return fileMap
  }
)
