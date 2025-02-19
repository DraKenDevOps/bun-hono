import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import logger from "../libs/logger";
import env from "../env";

async function logHttp(ctx: Context, next: Next, ignorePaths: string[] = []) {
    const { method, path, url } = ctx.req;
    let ip = ctx.req.header("X-Remote-Ip");
    if (env.NODE_ENV == "production") ip = ctx.req.header("X-Real-Ip") || ctx.req.header("X-Forwarded-For") || "unknown";
    const requestId = crypto.randomUUID();
    if (ignorePaths && ignorePaths.some((p) => p.includes(path))) {
        if (env.NODE_ENV !== "production") console.info(`[INFO] [Request] ${ip} ${requestId} ${method} ${path}`);
        await next();
        return;
    }
    let reqbody = await getRequestBody(ctx);
    logger.info("Request", {
        requestId,
        ip,
        method,
        url: url.split(/\//g).pop(),
        path,
        reqbody
    });
    ctx.set("requestId", requestId);
    ctx.set("ipAddress", ip);
    // @ts-ignore
    if (!global["requestId"]) global["requestId"] = requestId;
    const start = performance.now();
    await next();
    const time = performance.now() - start;
    let resbody = await getResponseBody(ctx);
    logger.info("Response", {
        requestId,
        code: ctx.res.status,
        status: ctx.res.statusText,
        time: `${time}ms`,
        resbody
    });
}
async function getRequestBody(ctx: Context) {
    const contentType = ctx.req.header("Content-Type");
    let reqbody = "";
    try {
        if (contentType) {
            if (contentType?.includes("json")) {
                reqbody = await ctx.req.json();
            } else if (contentType?.includes("text")) {
                reqbody = await ctx.req.text();
            } else {
                reqbody = `Request body is ${contentType}`;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return reqbody;
}
async function getResponseBody(ctx: Context) {
    const res = ctx.res.clone();
    const resContent = res.headers.get("Content-Type");
    let resbody = "";
    try {
        if (resContent) {
            if (resContent.includes("json")) {
                resbody = await res.json();
            } else if (resContent.includes("text")) {
                resbody = await res.text();
            } else {
                resbody = `Response body is ${resContent}`;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return resbody;
}

export const loggerMiddle = createMiddleware((ctx, next) => logHttp(ctx, next, ["/metrics"]));
