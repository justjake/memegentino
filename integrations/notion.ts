import * as notionApiTypes from "@notionhq/client/build/src/api-endpoints"

import { Strategy } from "passport-strategy"
import https from "https"
import { GetUserResponse } from "@notionhq/client/build/src/api-endpoints"

export interface NotionOAuthToken {
  access_token: string
  token_type: "bearer"
  bot_id: string
  workspace_id: string
  workspace_name?: string
  workspace_icon?: string
  owner: { type: "workspace" } | { type: "user"; user: NotionPersonUser }
}

export interface NotionStrategyOptions {
  clientID: string
  clientSecret: string
  callbackURL: string
  tokenURL?: string
  authorizationURL?: string
  getProfileURL?: string
  state?: string
}

export interface NotionVerifyCallback {
  (
    req: unknown, // req,
    accessToken: string, // oauthData.access_token,
    _unknown: undefined, // ? undefined,
    oauthData: NotionOAuthToken, // ? Notion OAuth response?
    userProfileData: GetUserResponse, // ? get /v1/users/me response?
    callback: (err: Error | undefined, user: unknown, info: unknown) => void
  ): void
}

/*
  This class cribbed from https://github.com/rat9615/passport-notion/blob/c5011ec115081e04d395743366dfdcef87eb6ef8/lib/passport-notion/strategy.js
  
  MIT License

  Copyright (c) 2021 Rohan R (https://github.com/rat9615)
  (Modified for Typescript by Jake Teton-Landis)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

 */
export class NotionStrategy extends Strategy {
  name: string
  private _verify: NotionVerifyCallback
  private _options: NotionStrategyOptions
  private _clientSecret: string
  private _clientID: string
  private _tokenURL: string
  private _authorizationURL: string
  private _getProfileURL: string

  constructor(options: NotionStrategyOptions, verify: NotionVerifyCallback) {
    super()

    if (!verify) {
      throw new TypeError("NotionStrategy requires a verify callback")
    }
    if (!options.clientID) {
      throw new TypeError("NotionStrategy requires a clientID")
    }
    if (!options.clientSecret) {
      throw new TypeError("NotionStrategy requires a clientSecret")
    }
    if (!options.callbackURL) {
      throw new TypeError("NotionStrategy require an Callback URL option")
    }

    this.name = "notion"
    this._verify = verify
    this._options = options
    this._clientSecret = options.clientSecret
    this._clientID = options.clientID
    this._tokenURL = options.tokenURL || "https://api.notion.com/v1/oauth/token"
    this._authorizationURL = options.authorizationURL || "https://api.notion.com/v1/oauth/authorize"
    this._getProfileURL = options.getProfileURL || "https://api.notion.com/v1/users"
  }

  async authenticate(
    req: Parameters<Strategy["authenticate"]>[0],
    options: Parameters<Strategy["authenticate"]>[1]
  ) {
    options = options || {}
    if (req.query && req.query.code) {
      try {
        const oauthData = await this.getOAuthAccessToken(req.query.code as string)
        if (oauthData.owner.type !== "user") {
          throw new Error(`Notion API token not owned by user, instead: ${oauthData.owner.type}`)
        }

        this._verify(
          req,
          oauthData.access_token,
          undefined,
          oauthData,
          oauthData.owner.user,
          (err, user, info) => {
            if (err) return this.error(err)
            if (!user) return this.fail(info as any /* ??? */)
            this.success(user)
          }
        )
      } catch (error) {
        this.error(error)
      }
    } else {
      const authUrl = new URL(this._authorizationURL)
      authUrl.searchParams.set("client_id", this._clientID)
      authUrl.searchParams.set("redirect_uri", this._options.callbackURL)
      authUrl.searchParams.set("response_type", "code")
      if (this._options?.state) {
        authUrl.searchParams.set("state", this._options.state)
      }
      const location = authUrl.toString()
      this.redirect(location)
    }
  }

  async getOAuthAccessToken(code: string): Promise<NotionOAuthToken> {
    let accessTokenURLObject = new URL(this._tokenURL)

    const accessTokenBody = {
      grant_type: "authorization_code",
      code,
      redirect_uri: this._options.callbackURL,
    }

    const encodedCredential = Buffer.from(`${this._clientID}:${this._clientSecret}`).toString(
      "base64"
    )

    const requestOptions = {
      hostname: accessTokenURLObject.hostname,
      path: accessTokenURLObject.pathname,
      headers: {
        Authorization: `Basic ${encodedCredential}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }

    return new Promise<NotionOAuthToken>((resolve, reject) => {
      const accessTokenRequest = https.request(requestOptions, (res) => {
        let data = ""
        res.on("data", (d) => {
          data += d
        })

        res.on("end", () => {
          try {
            resolve(JSON.parse(data))
          } catch (error) {
            reject(error)
          }
        })
      })

      accessTokenRequest.on("error", reject)
      accessTokenRequest.write(JSON.stringify(accessTokenBody))
      accessTokenRequest.end()
    })
  }
}

export type NotionPersonUser = Extract<notionApiTypes.GetUserResponse, { type: "person" }>

export function getPersonUser(user: notionApiTypes.GetUserResponse): NotionPersonUser {
  if (user.type === "person") {
    return user
  }

  if (user.type === "bot") {
    const bot = user.bot

    if (bot.owner.type === "workspace") {
      throw new Error("Workspace bots don't have a person")
    }

    if (!("type" in bot.owner.user)) {
      throw new Error("Owner user object has no type field")
    }

    return getPersonUser(bot.owner.user)
  }

  throw new Error(`Notion user object has unknown type: ${(user as any).type}`)
}
