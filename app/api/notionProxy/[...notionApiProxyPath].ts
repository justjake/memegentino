import { BlitzApiHandler, getSession, NextApiRequest, NextApiResponse } from "blitz"
import db from "db"
import {
  APIErrorCode,
  Client as NotionApiClient,
  isNotionClientError,
  LogLevel,
} from "@notionhq/client"
import { ClientOptions } from "@notionhq/client/build/src/Client"
import { env } from "integrations/unix"

const WORKSPACE_ID_PREFIX = "workspace_id:"

interface ProxyErrorResponse {
  object: "error"
  code: "proxy_error"
  message: string
}

interface NotionErrorResponse {
  object: "error"
  code: APIErrorCode
  message: string
}

type NotionProxyErrorResponse = ProxyErrorResponse | NotionErrorResponse

function notionApiProxy(args: {
  removeRouteQueryParam?: string
  /**
   * Authenticate the request, and return the Notion client options to use for
   * the request. Typically this involves validating the user's session,
   * anti-CSRF measures, then fetching the OAuth token associated with the
   * user's session from a data store.
   *
   * On success, should call `callback` with a ClientOptions object containing
   * an `auth` attribute.
   *
   * On error, should send an error response itself.
   */
  authenticateClientOptions: (
    req: NextApiRequest,
    res: NextApiResponse<ProxyErrorResponse>,
    callback: (options: ClientOptions & { auth: NonNullable<ClientOptions["auth"]> }) => void
  ) => void
}): BlitzApiHandler<NotionProxyErrorResponse> {
  const { authenticateClientOptions, removeRouteQueryParam } = args

  return async function notionApiProxy(req, res) {
    const { url, method, body } = req
    if (!url || !method) {
      res.statusCode = 400
      res.send({
        object: "error",
        code: "proxy_error",
        message: "Missing request data",
      })
      return
    }

    const clientOptions = await new Promise<ClientOptions>((resolve) =>
      authenticateClientOptions(req, res, resolve)
    )

    const parsed = new URL(url)
    if (removeRouteQueryParam) {
      parsed.searchParams.delete(removeRouteQueryParam)
    }

    let path = parsed.toString().split("/v1/").slice(1).join("/v1/")
    const client = new NotionApiClient(clientOptions)

    try {
      const result = await client.request<any>({
        path,
        method: method as any,
        body,
      })

      res.statusCode = 200
      res.send(result)
      // console.log("200 ok", result)
    } catch (error) {
      console.error("notionProxy: error", error, { url, path, method, body, query: req.query })
      if (!isNotionClientError(error)) {
        res.statusCode = 500
        res.send({
          object: "error",
          code: "proxy_error",
          message: error?.message,
        })
        return
      }

      if (error.name === "RequestTimeoutError") {
        res.statusCode = 500
        res.send({
          object: "error",
          code: "proxy_error",
          message: error.message,
        })
        return
      }

      res.statusCode = error.status
      for (const [header, value] of Array.from(error.headers.entries())) {
        res.setHeader(header, value)
      }
      res.send(error.body as any)
    }
  }
}

export default notionApiProxy({
  removeRouteQueryParam: "notionApiProxyPath",
  authenticateClientOptions: async (req, res, callback) => {
    const { userId } = await getSession(req, res)
    if (!userId) {
      res.statusCode = 401
      res.send({
        object: "error",
        code: "proxy_error",
        message: "Not authenticated",
      })
      return
    }

    const authorization = (req.headers.authorization || "").split(/\s+/)
    const workspace = authorization[authorization.length - 1]
    const workspaceId = workspace?.slice(WORKSPACE_ID_PREFIX.length)

    if (!workspace || !workspace.startsWith(WORKSPACE_ID_PREFIX) || !workspaceId) {
      res.statusCode = 400
      res.send({
        object: "error",
        code: "proxy_error",
        message: `Authorization header does not contain "${WORKSPACE_ID_PREFIX}"`,
      })
      return
    }

    const notionOAuthToken = await db.notionOAuthToken.findFirst({
      where: {
        userId,
        workspace_id: workspaceId,
      },
    })

    if (!notionOAuthToken) {
      res.statusCode = 404
      res.send({
        object: "error",
        code: "proxy_error",
        message: `Workspace ${workspaceId} not found`,
      })
      return
    }

    callback({
      auth: notionOAuthToken.access_token,
      baseUrl: env("NOTION_BASE_URL"),
      fetch(url, init) {
        // console.log("fetch", url, init)
        return fetch(url, init)
      },
    })
  },
})
