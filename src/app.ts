import { Hono } from "hono";
import { serveStatic, createBunWebSocket } from "hono/bun";
import { cors } from "hono/cors";
import type { ServerWebSocket } from "bun";
import path from "path";
import prom from "prom-client";

import router from "./router";
import { loggerMiddle } from "./middlewares/logger";
import env from "./env";

type Variables = {
    message: string;
    requestId: string;
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
app.use("/static/*", serveStatic({ root: rootPath, path: rootPath }));

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
app.get("/healthz", function (ctx) {
    return ctx.json({
        uptime: Math.floor(process.uptime()),
        status: "OK",
        message: "Good health",
        basepath: env.BASE_PATH
    });
});
app.get("/metrics", async (ctx) => {
    ctx.header("Content-Type", register.contentType);
    const metrics = await register.metrics();
    return ctx.text(metrics);
});
app.route("/api", router);

export default app;
