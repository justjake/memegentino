// app/api/auth/[...auth].ts
import { passportAuth } from "blitz"
import db from "db"
import { getPersonUser, NotionStrategy } from "integrations/notion"
import { env } from "integrations/unix"

export default passportAuth({
  successRedirectUrl: "/",
  errorRedirectUrl: "/error",
  strategies: [
    {
      strategy: new NotionStrategy(
        {
          clientID: env("NOTION_CLIENT_ID"),
          clientSecret: env("NOTION_CLIENT_SECRET"),
          callbackURL: "http://localhost:3000/api/auth/notion/callback",
          getProfileURL: `${env("NOTION_BASE_URL")}/v1/users/me`,
          tokenURL: `${env("NOTION_BASE_URL")}/v1/oauth/token`,
          authorizationURL: `${env("NOTION_BASE_URL")}/v1/oauth/authorize?owner=user`,
        },
        async (_req, _accessToken, _unknown, fetchedOauthData, userProfileData, callback) => {
          try {
            const personUser = getPersonUser(userProfileData)
            const email = personUser.person.email

            const { name, avatar_url: avatarUrl } = personUser
            const oauthData = {
              ...fetchedOauthData,
              owner: JSON.stringify(fetchedOauthData.owner),
            }

            const user = await db.user.upsert({
              where: {
                email: personUser.person.email,
              },
              update: {
                name,
                email,
                avatarUrl,
                notionOAuthTokens: {
                  upsert: {
                    where: {
                      bot_id: oauthData.bot_id,
                    },
                    create: oauthData,
                    update: oauthData,
                  },
                },
              },
              create: {
                name,
                email,
                avatarUrl,
                notionOAuthTokens: {
                  create: oauthData,
                },
              },
            })

            callback(
              undefined,
              {
                publicData: {
                  userId: user.id,
                  role: "USER",
                },
              },
              undefined
            )
          } catch (error) {
            console.error("passportAuth verify error:", error)
            callback(error, false, undefined)
          }
        }
      ),
    },
  ],
})
