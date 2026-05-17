import { NextFunction, Request, Response } from "express";
import { UserPermission } from "../constants/enums";

export function requirePermission(permission: UserPermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Permissions are normalized in verifyToken, so route checks can stay
    // declarative and avoid role-specific branching.
    const permissions = req.user?.permissions ?? [];

    if (!permissions.includes(permission)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}
