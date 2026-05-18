import { Router } from "express";
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  restrictUser,
  updateMe,
} from "../controllers/authController";
import { authRateLimiter, contentWriteRateLimiter } from "../middleware/rateLimit";
import { verifyToken } from "../middleware/verifyUserToken";

const router = Router();

router.post("/user/register", authRateLimiter, registerUser);
router.post("/user/login", authRateLimiter, loginUser);
router.post("/user/logout", logoutUser);
router.get("/user/me", verifyToken, getMe);
router.put("/user/me", verifyToken, contentWriteRateLimiter, updateMe);
router.patch("/user/me/restrict", verifyToken, restrictUser);

export default router;
