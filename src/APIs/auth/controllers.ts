import type { Context } from "hono";
import db from "../../utils/db";
import { decryptText } from "../../utils/functions";
import * as jwt from "../../utils/jwtoken";

export async function loginController(ctx: Context) {
    const body = await ctx.req.json();
    const username = body["username"];
    const password = body["password"];
    try {
        let sql = `select ad.level, st.first_name, st.position, password as enc_password from tbl_admin ad
        left join tbl_staff st on st.id = ad.staff_id
        where username = ?;`;
        const [users] = await db.query<Array<any>>(sql, [username]);
        if (users.length == 0)
            return ctx.json({
                status: "error",
                message: "Username not found"
            });

        const enc_pass = users[0]["enc_password"];
        const dec_pass = decryptText(enc_pass);
        if (password !== dec_pass)
            return ctx.json({
                status: "error",
                message: "Password is invalid"
            });

        const pl = {
            username,
            firstname: users[0]["first_name"],
            level: users[0]["level"],
            position: users[0]["position"]
        } as any;
        const token = jwt.signJwt(pl);
        pl["token"] = token;
        return ctx.json(pl);
    } catch (err) {
        console.error(err);
        return ctx.json({
            status: "error",
            message: "Something went wrong"
        });
    }
}

export async function refresh(ctx: Context) {
    const payload = ctx.get("jwtPayload");
    let token = ctx.req.header("X-Access-Token") as string;
    token = ctx.req.header("Authorization") ? `${ctx.req.header("Authorization")}`.replace("Bearer ", "") : token;
    return ctx.json({
        username: payload["username"],
        firstname: payload["firstname"],
        level: payload["level"],
        position: payload["position"],
        token
    });
}
