import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtUser } from "../types/auth";
import { UserModel } from "../models/userModel";
import {
  getEffectivePermissions,
  normalizePermissions,
  normalizeRole,
} from "../utils/accessControl";
import { AUTH_COOKIE_NAME } from "../services/authToken.service";

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

function getRequestToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return getCookieValue(req.headers.cookie, AUTH_COOKIE_NAME);
}

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getRequestToken(req);

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET as string);

    if (typeof decoded === "string") {
      res.status(401).json({ message: "Invalid token format" });
      return;
    }

    const payload = decoded as JwtUser;
    const user = await UserModel.findById(payload.userID).select(
      "userName email firstName lastName role permissions isRestricted",
    );

    if (!user || user.isRestricted) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const role = normalizeRole(user.role);
    const permissions = getEffectivePermissions(
      role,
      normalizePermissions(user.permissions),
    );

    req.user = {
      userID: payload.userID,
      userName: user.userName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      permissions,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}
