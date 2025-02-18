import type { Context } from "hono";
import { writeFile } from "fs/promises";
import path from "path";
import env from "../../env";

export async function uploadController(ctx: Context) {
    const body = await ctx.req.formData();
    const file = body.get("file");
    if (!file || !(file instanceof File)) return ctx.json({ status: "error", message: "Invalid file upload" });
    console.log(ctx.get("requestId"),{
        name: file.name,
        size: file.size,
        type: file.type,
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    const extname = path.extname(file.name);
    let filename = crypto.randomUUID().replace(/-/g, "");
    if (extname.startsWith(".")) {
        filename = filename + extname;
    } else {
        filename = `${filename}.${extname}`;
    }
    const filePath = path.resolve(`${env.PWD}/uploads/${filename}`);
    await writeFile(filePath, buffer);
    return ctx.json({ status: "success", message: "File uploaded successfully!", filename });
}
