import db from "db"
import { BlitzApiHandler, getSession } from "blitz"

const handler: BlitzApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    res.status(400).send(`not a get (was ${req.method})`)
    return
  }

  const { memeId } = req.query
  if (!memeId) {
    res.status(400).send("no meme id")
    return
  }

  const meme = await db.meme.findUnique({
    where: {
      id: memeId as string,
    },
  })

  if (!meme) {
    res.status(404).send("meme not found")
    return
  }

  const sendTheMeme = () => {
    res.setHeader("Content-Type", meme.mimeType)
    res.send(meme.data)
  }

  if (meme.allowPublic) {
    return sendTheMeme()
  }

  // Need to verify session
  const session = await getSession(req, res)
  if (!session.userId) {
    res.status(401).send("idk try logging in")
    return
  }

  if (meme.createdByUserId === session.userId) {
    return sendTheMeme()
  }

  if (meme.allowWorkspace) {
    const relevantToken = await db.notionOAuthToken.findFirst({
      where: {
        userId: session.userId,
        workspace_id: meme.sourceWorkspaceId,
      },
    })

    if (relevantToken) {
      return sendTheMeme()
    }
  }

  res.status(403).send("no meme 4 u (you need to log into the meme workspace)")
}

export default handler
