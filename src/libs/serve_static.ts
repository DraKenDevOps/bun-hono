import type { MiddlewareHandler } from "hono";
import path from "path";
import env from "../env";

type ServeStaticOptions = {
    root?: string;
    path?: string;
    precompressed?: boolean;
    mimes?: Record<string, string>;
};
const baseServeStatic = (options: ServeStaticOptions): MiddlewareHandler => {
    let rootPath = !options.root ? path.resolve(`${env.PWD}/public`) : options.root;
    return async (c, next) => {
        if (c.finalized) {
            await next();
            return;
        }
        let filename = decodeURI(c.req.path);
        if (!filename) {
            return await next();
        }
        const filepath = path.resolve(`${rootPath}/${filename}`);
        let content = await getContent(filepath);
        if (content instanceof Response) {
            return c.newResponse(content.body, content);
        }

        if (content) {
            const mimeType = (options.mimes && getMimeType(filepath, options.mimes)) || getMimeType(filepath);
            c.header("Content-Type", mimeType || "application/octet-stream");
            // @ts-ignore
            return c.body(content);
        }
        await next();
        return;
    };
};

const getContent = async (filepath: string) => {
    const file = Bun.file(filepath);
    const exist = await file.exists();
    return exist ? file : null;
};

// mime utils
const getMimeType = (filename: string, mimes: Record<string, string> = baseMimes): string | undefined => {
    const regexp = /\.([a-zA-Z0-9]+?)$/;
    const match = filename.match(regexp);
    if (!match) {
        return;
    }
    let mimeType = mimes[match[1]];
    if (mimeType && mimeType.startsWith("text")) {
        mimeType += "; charset=utf-8";
    }
    return mimeType;
};
const getExtension = (mimeType: string) => {
    let ext = "";
    for (const key in baseMimes) {
        if (baseMimes[key] === mimeType) {
            ext = baseMimes[key];
            break;
        }
    }
    return ext;
};
type BaseMime = (typeof _baseMimes)[keyof typeof _baseMimes];
const _baseMimes = {
    aac: "audio/aac",
    avi: "video/x-msvideo",
    avif: "image/avif",
    av1: "video/av1",
    bin: "application/octet-stream",
    bmp: "image/bmp",
    css: "text/css",
    csv: "text/csv",
    eot: "application/vnd.ms-fontobject",
    epub: "application/epub+zip",
    gif: "image/gif",
    gz: "application/gzip",
    htm: "text/html",
    html: "text/html",
    ico: "image/x-icon",
    ics: "text/calendar",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "text/javascript",
    json: "application/json",
    jsonld: "application/ld+json",
    map: "application/json",
    mid: "audio/x-midi",
    midi: "audio/x-midi",
    mjs: "text/javascript",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mpeg: "video/mpeg",
    oga: "audio/ogg",
    ogv: "video/ogg",
    ogx: "application/ogg",
    opus: "audio/opus",
    otf: "font/otf",
    pdf: "application/pdf",
    png: "image/png",
    rtf: "application/rtf",
    svg: "image/svg+xml",
    tif: "image/tiff",
    tiff: "image/tiff",
    ts: "video/mp2t",
    ttf: "font/ttf",
    txt: "text/plain",
    wasm: "application/wasm",
    webm: "video/webm",
    weba: "audio/webm",
    webp: "image/webp",
    woff: "font/woff",
    woff2: "font/woff2",
    xhtml: "application/xhtml+xml",
    xml: "application/xml",
    zip: "application/zip",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2",
    gltf: "model/gltf+json",
    glb: "model/gltf-binary"
} as const;
const baseMimes: Record<string, BaseMime> = _baseMimes;

export const serveStatic = (options: ServeStaticOptions): MiddlewareHandler => {
    return async function serveStatic(c, next) {
        return baseServeStatic(options)(c, next);
    };
};
