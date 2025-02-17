import { Hono, type Context } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";

import path from "path";
// import type { BlankEnv, BlankInput } from "hono/types";
import router from "./router";
import { loggerMiddle } from "./middlewares/logger";
import env from "./env";

type Variables = {
    message: string;
};

const app = new Hono<{ Variables: Variables }>();
export const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();
app.use(cors());
// app.use("*", logger());
const rootPath = path.resolve(`${env.PWD}/uploads`);
app.use(serveStatic({ root: rootPath }));
app.use("/favicon.ico", serveStatic({ path: "./favicon.ico" }));

async function healthCheck(ctx: Context) {
    return ctx.json({
        uptime: Math.floor(process.uptime()),
        status: "OK",
        message: "Good health",
        basepath: env.BASE_PATH
    });
}
app.use(loggerMiddle);

app.get("/", c => c.text("GET /"));
app.post("/", c => c.text("POST /"));
app.put("/", c => c.text("PUT /"));
app.delete("/", c => c.text("DELETE /"));
// Wildcard
app.get("/wild/*/card", c => c.text("GET /wild/*/card"));
// Any HTTP methods
app.all("/hello", c => c.text("Any Method /hello"));
// Custom HTTP method
app.on("PURGE", "/cache", c => c.text("PURGE Method /cache"));
// Multiple Method
app.on(["PUT", "DELETE"], "/post", c => c.text("PUT or DELETE /post"));
// Multiple Paths
app.on("GET", ["/hello", "/ja/hello", "/en/hello"], c => c.text("Hello"));
app.get("/user/:name", c => {
    const name = c.req.param("name");
    return c.json({ name });
});
app.get("/posts/:id/comment/:comment_id", c => {
    const { id, comment_id } = c.req.param();
    return c.json({ id, comment_id });
});
app.get("/post/:date{[0-9]+}/:title{[a-z]+}", c => {
    const { date, title } = c.req.param();
    return c.json({
        date,
        title
    });
});
app.get("/agent", c => {
    const userAgent = c.req.header("User-Agent");
    return c.json({
        userAgent
    });
});
app.get("/welcome", c => {
    // Set headers
    c.header("X-Message", "Hello!");
    c.header("Content-Type", "text/plain");

    // Set HTTP status code
    c.status(201);

    // Return the response body
    return c.body("Thank you for coming");
    // return c.body("Thank you for coming", 201, {
    //     "X-Message": "Hello!",
    //     "Content-Type": "text/plain"
    // });
});

app.get("/redirect", c => {
    return c.redirect("https://example.com");
});
app.get("/redirect-permanently", c => {
    return c.redirect("https://example.com", 301);
});

app.use(async (c, next) => {
    c.set("message", "Hono is cool!!");
    await next();
});

app.get("/pass-from-middle", c => {
    const message = c.get("message");
    return c.text(`The message is "${message}"`);
});

/**
 * Get all params at once
 * Get multiple querystring parameter values, e.g. /search?tags=A&tags=B
 */
app.get("/search", c => {
    const query = c.req.query("q");
    const { q, limit, offset } = c.req.query();
    // tags will be string[]
    const tags = c.req.queries("tags");
    return c.json({
        query,
        q,
        limit,
        offset,
        tags
    });
});

app.get(
    "/ws",
    upgradeWebSocket(c => ({
        onMessage(event, ws) {
            console.log(`Message from client: ${event.data}`);
            ws.send("Hello from server!");
        },
        onClose: () => {
            console.log("Connection closed");
        }
    }))
);
app.get("/ok", ctx => ctx.text("OK"));
app.get("/healthz", healthCheck);
app.route("/api", router);

export default app;
