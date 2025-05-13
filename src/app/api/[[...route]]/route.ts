import { Hono } from "hono"
import { twitterAPI } from "./twitter"
import { handle } from "hono/vercel"
import { Bindings } from "./bindings"

const app = new Hono<{ Bindings: Bindings }>().basePath("/api")
const route = app.route("/twitter", twitterAPI)

export type AppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
