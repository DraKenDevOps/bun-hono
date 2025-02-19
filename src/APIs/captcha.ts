import type { Context } from "hono";
import db from "../utils/db";
import env from "../env";

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
