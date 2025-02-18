import { sign, verify } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { Context, Next } from "hono";
import env from "../env";

const iss = "Laogw Ltd";
const sub = "info@laogw.la";
const aud = "https://www.laogw.la";

/**
  * !Sign jwt: DOMException {
  * !line: 24,
  * !column: 41,
  * !sourceURL: "c:\\Users\\Anakin\\bun-hono\\node_modules\\hono\\dist\\utils\\jwt\\jws.js",
  * !stack: "importKey@[native code]\n@c:\\Users\\Anakin\\bun-hono\\node_modules\\hono\\dist\\utils\\jwt\\jws.js:24:41\nimportPrivateKey@c:\\Users\\Anakin\\bun-hono\\node_modules\\hono\\dist\\utils\\jwt\\jws.js:12:33\n@c:\\Users\\Anakin\\bun-hono\\node_modules\\hono\\dist\\utils\\jwt\\jws.js:2:77\nsigning@c:\\Users\\Anakin\\bun-hono\\node_modules\\hono\\dist\\utils\\jwt\\jws.js:1:24\n@c:\\Users\\Anakin\\bun-hono\\node_modules\\hono\\dist\\utils\\jwt\\jwt.js:32:91\nsign@c:\\Users\\Anakin\\bun-hono\\node_modules\\hono\\dist\\utils\\jwt\\jwt.js:24:19\n@c:\\Users\\Anakin\\bun-hono\\src\\utils\\jwt.ts:8:23\nsignJwt@c:\\Users\\Anakin\\bun-hono\\src\\utils\\jwt.ts:1:31\n@c:\\Users\\Anakin\\bun-hono\\src\\APIs\\auth\\controllers.ts:24:33",
  * !code: 0,
  * !name: "DataError",
  * !message: "Data provided to an operation does not meet requirements", }
*/
export async function signJwt(payload: JWTPayload) {
    payload.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    payload.sub = sub;
    payload.iss = iss;
    payload.aud = aud;
    let token = "";
    try {
        token = await sign(payload, env.JWT_PRIVATE_KEY, "PS256");
    } catch (err) {
        console.error("Sign jwt:", err);
    }
    return token;
}

export async function verifyJwt(ctx: Context, next: Next) {
    let token = ctx.req.header("X-Access-Token") as string;
    token = ctx.req.header("Authorization") ? `${ctx.req.header("Authorization")}`.replace("Bearer ", "") : token;
    if (!token) {
        if (env.NODE_ENV !== "production") {
            await next();
            return;
        }
        return ctx.json({ status: "error", message: "No jwt provided." });
    }

    try {
        const payload = await verify(token, env.JWT_PUBLIC_KEY, "PS256");
        if (!payload) {
            return ctx.json({
                status: "error",
                message: "Failed to decode jwt"
            });
        } else {
            ctx.set("jwtPayload", payload);
            await next();
        }
    } catch (err) {
        console.error("Verify jwt:", err);
        return ctx.json({
            status: "error",
            message: "Failed to verify jwt"
        });
    }
}
