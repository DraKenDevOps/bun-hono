import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { cors } from "hono/cors";
import type { ServerWebSocket } from "bun";
import path from "path";
import prom from "prom-client";

import router from "./router";
import { loggerMiddle } from "./middlewares/logger";
import env from "./env";
import { serveStatic } from "./libs/serve_static";
import logger from "./libs/logger";

type Variables = {
    message: string;
    requestId: string;
    ipAddress: string;
};

const app = new Hono<{ Variables: Variables }>();
const register = new prom.Registry();
register.setDefaultLabels({
    worker: env.SERVICE_NAME
});
prom.collectDefaultMetrics({
    labels: { NODE_APP_INSTANCE: env.SERVICE_NAME },
    register
});
export const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();
app.use(cors());
app.use(loggerMiddle);
const rootPath = path.resolve(`${env.PWD}/uploads`);
app.use("*", serveStatic({ root: rootPath }));

app.get(
    "/ws",
    upgradeWebSocket(() => ({
        onMessage(event, ws) {
            console.log(`Message from client: ${event.data}`);
            ws.send("Hello from server!");
        },
        onClose: () => {
            console.log("Connection closed");
        }
    }))
);
app.get("/", (c) => c.text(`${c.req.method} ${c.req.path}`));
app.get("/check", (c) => c.text(`${c.req.method} ${c.req.path} ${env.SERVICE_NAME} is running...`));
app.get("/healthz", function (ctx) {
    return ctx.json({
        uptime: Math.floor(process.uptime()),
        status: "OK",
        message: "Good health",
        service: env.SERVICE_NAME,
        basepath: env.BASE_PATH
    });
});
app.get("/metrics", async (ctx) => {
    ctx.header("Content-Type", register.contentType);
    const metrics = await register.metrics();
    return ctx.text(metrics);
});
app.route(`/${env.BASE_PATH}/v1`, router);

app.notFound((c) =>
    c.json(
        {
            status: "error",
            message: "Service not found"
        },
        404
    )
);
app.onError((err, ctx) => {
    logger.error(err["message"], { error: err });
    return ctx.json(
        {
            status: "error",
            message: "Something went wrong"
        },
        500
    );
});

export default app;
