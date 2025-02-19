import type { Context } from "hono";
import { writeFile, exists, mkdir } from "fs/promises";
import path from "path";
import env from "../../env";

export async function uploadController(ctx: Context) {
    const body = await ctx.req.formData();
    const file = body.get("file");
    const dest = body.get("dest");
    const subdest = body.get("subdest");
    if (!file || !(file instanceof File)) return ctx.json({ status: "error", message: "Invalid file upload" });
    console.log(
        ctx.get("requestId"),
        JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type
        })
    );
    const buffer = Buffer.from(await file.arrayBuffer());
    const extname = path.extname(file.name);
    let filename = crypto.randomUUID().replace(/-/g, "");
    if (extname.startsWith(".")) {
        filename = filename + extname;
    } else {
        filename = `${filename}.${extname}`;
    }
    let dir = path.resolve(`${env.PWD}/uploads/`);
    if (dest) {
        dir = path.resolve(`${dir}/${dest}/`);
        if (subdest) dir = path.resolve(`${dir}/${subdest}/`);
    }
    try {
        (await exists(dir)) || (await mkdir(dir));
    } catch (err) {
        console.error(ctx.get("requestId"), "Error check exist and mkdir:",err);
    }
    const filePath = path.resolve(`${dir}/${filename}`);
    try {
        await writeFile(filePath, buffer);
    } catch (err) {
        console.error(ctx.get("requestId"), "Error write file:", err);
        return ctx.json({
            status: "error",
            message: JSON.stringify(err)
        });
    }
    return ctx.json({ status: "success", message: "File uploaded successfully!", filename });
}
