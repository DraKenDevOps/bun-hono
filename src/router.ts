import { Hono } from "hono";

const router = new Hono();

router.get("/", ctx => ctx.text("Hollowed out"));
// Will match `/api/animal` and `/api/animal/:type`
router.get("/animal/:type?", c => {
    const { type } = c.req.param();
    return c.text("Animal! " + type);
});
router.post("/login");

export default router;
