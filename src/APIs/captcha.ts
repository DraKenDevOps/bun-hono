import type { Context } from "hono";
import db from "../utils/db";
import env from "../env";
import captcha from "../libs/captcha";

export async function initCaptcha(ctx: Context) {
    let num = Math.floor(Math.random() * 900000 + 100000).toString();
    const ip = ctx.get("ipAddress");
    if (env.NODE_ENV !== "production") num = "123456";
    const sql = "INSERT INTO tbl_verify_code (captcha_code,ip,created_date,status_validate) VALUES (?,?,now(),'no')";
    try {
        await db.execute(sql, [num, ip]);
    } catch (err) {
        console.error(ctx.get("requestId"), "INSERT INTO tbl_verify_code", err);
    }
    return ctx.text(num);
}

export async function initCaptchaImg(ctx: Context) {
    let num = Math.floor(Math.random() * 900000 + 100000).toString();
    const ip = ctx.get("ipAddress");
    if (env.NODE_ENV !== "production") num = "123456";
    const sql = "INSERT INTO tbl_verify_code (captcha_code,ip,created_date,status_validate) VALUES (?,?,now(),'no')";
    try {
        await db.execute(sql, [num, ip]);
    } catch (err) {
        console.error(ctx.get("requestId"), "INSERT INTO tbl_verify_code", err);
    }
    const img = captcha(100, 30, num);
    img.color(0, 0, 0, 0);
    img.color(80, 80, 80, 255);
    const buf = img.getBuffer();
    ctx.header("Content-Type", "image/png");
    return ctx.body(buf);
}
