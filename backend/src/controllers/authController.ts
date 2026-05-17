import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Joi, { ValidationResult } from "joi";

import { UserModel } from "../models/userModel";
import { User } from "../interfaces/user";
import { getEffectivePermissions } from "../utils/accessControl";
import { pickTrimmedStringFields } from "../utils/stringFields";
import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie,
} from "../services/authToken.service";

/**
 * REGISTER USER
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { error } = validateUserRegistration(req.body);

    if (error) {
      res.status(400).json({
        error: error.details[0].message,
        message: error.details[0].message,
      });
      return;
    }

    const emailExists = await UserModel.findOne({ email: req.body.email });
    if (emailExists) {
      res.status(409).json({
        error: "Email already exists",
        message: "Email already exists",
      });
      return;
    }

    const userNameExists = await UserModel.findOne({
      userName: req.body.userName,
    });

    if (userNameExists) {
      res.status(409).json({
        error: "Username already exists",
        message: "Username already exists",
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new UserModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      userName: req.body.userName,
      email: req.body.email,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    res.status(201).json({
      error: null,
      data: {
        userName: savedUser.userName,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Internal server error",
    });
  }
}

/**
 * LOGIN USER
 */
export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { error } = validateUserLogin(req.body);

    if (error) {
      res.status(400).json({
        error: error.details[0].message,
        message: error.details[0].message,
      });
      return;
    }

    const { identifier, password } = req.body;

    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { userName: identifier }],
    });

    if (!user) {
      res
        .status(401)
        .json({ error: "Invalid credentials", message: "Invalid credentials" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res
        .status(401)
        .json({ error: "Invalid credentials", message: "Invalid credentials" });
      return;
    }

    const token = createAuthToken(user);

    setAuthCookie(res, token);

    res.status(200).json({
      token,
      user: {
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userAvatar: user.userAvatar,
        role: user.role,
        permissions: getEffectivePermissions(user.role, user.permissions),
      },
    });
  } catch (err) {
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

/**
 * VALIDATION - REGISTER
 */
export function validateUserRegistration(data: User): ValidationResult {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(255).required(),
    lastName: Joi.string().min(2).max(255).required(),
    userName: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().min(5).max(255).required(),
    password: Joi.string().min(6).max(30).required(),
  });

  return schema.validate(data);
}

/**
 * VALIDATION - LOGIN
 */
export function validateUserLogin(
  data: Record<string, unknown>,
): ValidationResult {
  const schema = Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().min(6).max(30).required(),
  });

  return schema.validate(data);
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userID).select("-password");

    if (!user) {
      res
        .status(404)
        .json({ error: "User not found", message: "User not found" });
      return;
    }

    const token = createAuthToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      token,
      userName: user.userName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userAvatar: user.userAvatar,
      role: user.role,
      permissions: getEffectivePermissions(user.role, user.permissions),
    });
  } catch (err) {
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

    const updates = pickTrimmedStringFields(
      req.body as Record<string, unknown>,
      [
        "userName",
        "email",
        "firstName",
        "lastName",
        "userAvatar",
        "country",
        "city",
        "street",
        "streetNumber",
        "postalCode",
      ],
    );

    const updatedUser = await UserModel.findByIdAndUpdate(userID, updates, {
      new: true,
      runValidators: true,
    }).select("userName email firstName lastName userAvatar role permissions");

    if (!updatedUser) {
      res
        .status(404)
        .json({ error: "User not found", message: "User not found" });
      return;
    }

    res.status(200).json({
      userName: updatedUser.userName,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      userAvatar: updatedUser.userAvatar,
      role: updatedUser.role,
      permissions: getEffectivePermissions(
        updatedUser.role,
        updatedUser.permissions,
      ),
    });
  } catch (err) {
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

    const updatedUser = await UserModel.findByIdAndUpdate(
      userID,
      { isRestricted: true },
      { new: true, runValidators: true },
    ).select("isRestricted");

    if (!updatedUser) {
      res
        .status(404)
        .json({ error: "User not found", message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Account restricted",
      isRestricted: updatedUser.isRestricted,
    });
  } catch (err) {
    console.error("RestrictUser error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Internal server error",
    });
  }
}
