// CORS images can't be copied to <canvas> because security
// https://github.com/niklasvh/html2canvas-proxy-nodejs/blob/master/server.js

import db from "db"
import { BlitzApiHandler, getSession, resolver } from "blitz"

export default resolver.pipe(resolver.authorize(), async ({ req, res }, ctx) => {})
