export default {
    PWD: process.cwd(),
    NODE_ENV: Bun.env["NODE_ENV"],
    VERSION: Bun.env["VERSION"],
    TZ: Bun.env["TZ"],
    PORT: Number(Bun.env["PORT"]) || 8000,
    HOST: Bun.env["HOST"] || "0.0.0.0",
    BASE_PATH: Bun.env["BASE_PATH"] || "api"
};
