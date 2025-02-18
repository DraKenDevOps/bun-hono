import app /**,{ websocket } */ from "./app";
import env from "./env";

const server = Bun.serve({
    port: env.PORT,
    hostname: env.HOST,
    fetch: (req, server) => {
        const ip = server.requestIP(req);
        if (ip?.address) req.headers.set("X-Remote-Ip", ip?.address);
        return app.fetch(req);
    },
    // fetch: app.fetch,
    id: "864a7cd4-d76f-4d0c-b501-9a293337c50f"
});
if (server) console.log("Listening on...", server.port);

const shutdown = (signal: NodeJS.Signals) => {
    console.log(`${signal} signal received`);
    console.log("Shutting down server...");
    server.stop();
    console.log("Server stopped.");
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
