import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";

async function logHttp(ctx: Context, next: Next) {
    const { method, url } = ctx.req;
    const reqId = crypto.randomUUID();
    console.log(`[Request] ${reqId} ${method} ${url}`);

    const start = performance.now();
    await next();
    const end = performance.now();

    // Clone response before reading
    // const clonedResponse = new Response(ctx.res.body, ctx.res);
    const clonedRes = ctx.res.clone();
    const responseText = await clonedRes.text();
    console.log(`[Response] ${reqId} ${method} ${url} - ${ctx.res.status} (${end - start}ms)`);
    console.log(`${reqId} Response Body:`, responseText);
}

export const loggerMiddle = createMiddleware(logHttp);
