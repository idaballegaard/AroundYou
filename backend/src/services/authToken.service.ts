import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../interfaces/user";
import { getEffectivePermissions } from "../utils/accessControl";

export const AUTH_COOKIE_NAME = "aroundyou_auth";

function shouldUseSecureCookie(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    process.env.FRONTEND_ORIGIN?.startsWith("https://") === true
  );
}

const useSecureCookie = shouldUseSecureCookie();

const AUTH_COOKIE_OPTIONS: CookieOptions = {
  // The frontend stores the bearer token in memory. This HttpOnly cookie lets
  // the backend restore a session after refresh without exposing the token to JS.
  httpOnly: true,
  secure: useSecureCookie,
  sameSite: useSecureCookie ? "none" : "lax",
  path: "/api",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

type AuthTokenUser = {
  _id: { toString(): string };
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: User["role"];
  permissions: User["permissions"];
};

export function createAuthToken(user: AuthTokenUser): string {
  // Keep this expiry aligned with AUTH_COOKIE_OPTIONS.maxAge so browser refreshes
  // do not preserve an already-expired token.
  return jwt.sign(
    {
      userID: user._id.toString(),
      userName: user.userName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: getEffectivePermissions(user.role, user.permissions),
    },
    process.env.TOKEN_SECRET as string,
    { expiresIn: "7d" },
  );
}

export function setAuthCookie(res: Response, token: string): void {
  // Always set the cookie when issuing/refeshing a token so browser refresh and
  // direct API calls share the same session source.
  res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: undefined,
  });
}
