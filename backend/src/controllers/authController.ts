import { Request, Response } from "express";
import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie,
} from "../services/authToken.service";
import {
  AuthServiceError,
  authenticateUser,
  getUserProfile,
  registerNewUser,
  restrictUserProfile,
  toAuthUser,
  updateUserProfile,
} from "../services/auth.service";
import {
  validateUserLogin,
  validateUserRegistration,
} from "../validators/auth.validators";

function sendAuthServiceError(res: Response, error: AuthServiceError): void {
  res.status(error.statusCode).json({
    error: error.message,
    message: error.message,
  });
}

function sendValidationError(res: Response, message: string): void {
  res.status(400).json({
    error: message,
    message,
  });
}

export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = validateUserRegistration(req.body);

    if (error) {
      sendValidationError(res, error.details[0].message);
      return;
    }

    const savedUser = await registerNewUser(value);

    res.status(201).json({
      error: null,
      data: {
        userName: savedUser.userName,
      },
    });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      sendAuthServiceError(res, err);
      return;
    }

    console.error("Register error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Internal server error",
    });
  }
}

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = validateUserLogin(req.body);

    if (error) {
      sendValidationError(res, error.details[0].message);
      return;
    }

    const user = await authenticateUser(value);
    const token = createAuthToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      token,
      user: toAuthUser(user),
    });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      sendAuthServiceError(res, err);
      return;
    }

    console.error("Login error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Internal server error",
    });
  }
}

export async function logoutUser(req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.status(204).send();
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
      return;
    }

    const user = await getUserProfile(userID);
    const token = createAuthToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      token,
      ...toAuthUser(user),
    });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      sendAuthServiceError(res, err);
      return;
    }

    console.error("GetMe error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Internal server error",
    });
  }
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
      return;
    }

    const updatedUser = await updateUserProfile(
      userID,
      req.body as Record<string, unknown>,
    );

    res.status(200).json(toAuthUser(updatedUser));
  } catch (err) {
    if (err instanceof AuthServiceError) {
      sendAuthServiceError(res, err);
      return;
    }

    console.error("UpdateMe error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Internal server error",
    });
  }
}

export async function restrictUser(req: Request, res: Response): Promise<void> {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
      return;
    }

    const updatedUser = await restrictUserProfile(userID);

    res.status(200).json({
      message: "Account restricted",
      isRestricted: updatedUser.isRestricted,
    });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      sendAuthServiceError(res, err);
      return;
    }

    console.error("RestrictUser error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Internal server error",
    });
  }
}
