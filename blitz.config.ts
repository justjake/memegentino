import { BlitzConfig, sessionMiddleware, simpleRolesIsAuthorized } from "blitz"

const config: BlitzConfig = {
  middleware: [
    sessionMiddleware({
      cookiePrefix: "memegentino",
      isAuthorized: simpleRolesIsAuthorized,
      // Important: sameSite must be disabled for us to work in an iframe
      // such as a Notion embed block.
      sameSite: process.env.NODE_ENV === "production" ? "none" : undefined,
    }),
  ],
  /* Uncomment this to customize the webpack config
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Note: we provide webpack above so you should not `require` it
    // Perform customizations to webpack config
    // Important: return the modified config
    return config
  },
  */
}
module.exports = config
