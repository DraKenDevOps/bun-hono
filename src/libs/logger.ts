import winston from "winston";
import path from "path";
import fs from "fs";
import env from "../env";

const logDir = path.resolve(`${env.PWD}/logs`);
fs.existsSync(logDir) || fs.mkdirSync(logDir);
const logpath = path.resolve(`${logDir}/${env.SERVICE_NAME}.log`);
const stream = fs.createWriteStream(logpath, "utf-8");

const customFormat = winston.format.combine(
    winston.format.timestamp(),
    // winston.format.logstash(),
    winston.format.printf(({ timestamp, level, message, ...meta }) =>
        JSON.stringify({
            "@timestamp": timestamp,
            "@message": message,
            "@field": {
                level: level.toUpperCase(),
                // @ts-ignore
                requestId: globalThis["requestId"],
                ...meta
            }
        })
    )
);

const logger = winston.createLogger({
    level: "verbose",
    format: customFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.colorize({ all: env.NODE_ENV !== "production" })
        }),
        new winston.transports.Stream({
            stream
        })
    ],
    defaultMeta: {
        service: env.SERVICE_NAME,
        mode: env.NODE_ENV,
        tz: env.TZ,
        version: env.VERSION,
        // @ts-ignore
        requestId: globalThis["requestId"]
    }
});

export default logger;
