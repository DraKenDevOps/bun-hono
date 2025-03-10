import { Hono } from "hono";
import { loginController, refresh } from "./APIs/auth/controllers";
import { uploadController } from "./APIs/files/controllers";
import * as jwt from "./utils/jwtoken";
import { initCaptcha, initCaptchaImg } from "./APIs/captcha";

const router = new Hono();

router.post("/login", loginController);
router.post("/upload", uploadController);
router.get("/refresh", jwt.verifJwt, refresh);
router.get("/captcha", initCaptcha);
router.get("/sucure/captchasrc", initCaptchaImg);

export default router;
