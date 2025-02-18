import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import env from "../env";

async function logHttp(ctx: Context, next: Next, ignorePaths: string[] = []) {
    const { method, path } = ctx.req;
    let ip = ctx.req.header("X-Remote-Ip");
    if (env.NODE_ENV == "production") ip = ctx.req.header("X-Real-Ip") || ctx.req.header("x-forwarded-for") || "unknown"
    const reqId = crypto.randomUUID();
    if (ignorePaths && ignorePaths.some((p) => p.includes(path))) {
        if (env.NODE_ENV !== "production") console.info(`[INFO] [Request] ${ip} ${reqId} ${method} ${path}`);
        await next();
        return;
    }
    const contentType = ctx.req.header("Content-Type");
    let reqbody = "";
    if (contentType) {
        if (contentType?.includes("json")) {
            reqbody = JSON.stringify(await ctx.req.json());
        } else if (contentType?.includes("text")) {
            reqbody = await ctx.req.text();
        } else {
            reqbody = `Request body is ${contentType}`;
        }
    }
    console.log(`[INFO] [Request] ${ip} ${reqId} ${method} ${path} ${reqbody}`);

    ctx.set("requestId", reqId);
    // @ts-ignore
    if (!global["requestId"]) global["requestId"] = reqId;
    const start = performance.now();
    await next();
    const end = performance.now();
    // return;
    const res = ctx.res.clone();
    const resbody = await res.text();
    console.log(`[INFO] [Response] ${reqId} ${method} ${path} - ${ctx.res.status} (${end - start}ms)`, resbody);
}

export const loggerMiddle = createMiddleware((ctx, next) => logHttp(ctx, next, ["/metrics"]));
