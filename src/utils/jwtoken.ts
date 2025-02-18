import jwt, { type SignOptions, type VerifyOptions } from "jsonwebtoken";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { Context, Next } from "hono";
import env from "../env";

const iss = "Laogw Ltd";
const sub = "info@laogw.la";
const aud = "https://www.laogw.la";
const signOptions: SignOptions = {
    issuer: iss,
    subject: sub,
    audience: aud,
    expiresIn: "24h",
    algorithm: "RS256"
};
const verifyOptions: VerifyOptions = {
    issuer: iss,
    subject: sub,
    audience: aud,
    maxAge: "24h",
    algorithms: ["RS256"]
};

export const signJwt = (payload: object) => {
    let token = "";
    try {
        token = jwt.sign(payload, env.JWT_PRIVATE_KEY, signOptions);
    } catch (e) {
        console.error("Sign token error", { error: e });
    }
    return token;
};

export const verifJwt = async (ctx: Context, next: Next) => {
    let token = ctx.req.header("X-Access-Token") as string;
    token = ctx.req.header("Authorization") ? `${ctx.req.header("Authorization")}`.replace("Bearer ", "") : token;
    if (!token) {
        if (env.NODE_ENV !== "production") {
            ctx.set("jwtPayload", {
                username: "support",
                firstname: "Lgw",
                level: "support",
                position: "support",
                token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InN1cHBvcnQiLCJmaXJzdG5hbWUiOiJMZ3ciLCJsZXZlbCI6InN1cHBvcnQiLCJwb3NpdGlvbiI6InN1cHBvcnQiLCJpYXQiOjE3Mzk4NjAwMTYsImV4cCI6MTczOTk0NjQxNiwiYXVkIjoiaHR0cHM6Ly93d3cubGFvZ3cubGEiLCJpc3MiOiJMYW9ndyBMdGQiLCJzdWIiOiJpbmZvQGxhb2d3LmxhIn0.Sws6EpCSCrv5Z7ASQboKXEe3YCtN0geuzS-KK8GbP14wAvpJNfCo_yM6reJDwlQEVNDVQVrMtMSTxmjqsRrJwtCTHkqMC1P4t-rtSrOxCnMWzRyLnlovfgJ-NDXfujlrv6ipEEYi-W9qLqQfS86V7BiZFCS-YCYskR-3zQqzikcaKiFNRZM9VvvBe4szSrN4hQSKC5jYc_whgf_ZJCm_qe3dLfWUPb8WQ4McX9qf4Eto0s-hAtzwzuSAtsDpTd-4fevA8MAyno0nMvLwUfD1ZZTtw09qK29w3HWGQf48ETPqWJiUKWpdyxg2YOG2S7Q97lme1sRlmrdWFfc7L-dAqw"
            });
            await next();
            return;
        }
        return ctx.json({ status: "error", message: "No jwt provided." });
    }
    try {
        const payload = jwt.verify(token, env.JWT_PUBLIC_KEY, verifyOptions) as JWTPayload;
        if (!payload) {
            return ctx.json({
                status: "error",
                message: "Failed to decode jwt"
            });
        } else {
            ctx.set("jwtPayload", payload);
            await next();
        }
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return ctx.json({
                status: "error",
                message: "jwt is expired."
            });
        } else if (error instanceof jwt.JsonWebTokenError) {
            return ctx.json({
                status: "error",
                message: "Token authentication error."
            });
        }
    }
};
