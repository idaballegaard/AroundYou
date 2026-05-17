import bcrypt from "bcrypt";
import { UserModel } from "../models/userModel";
import { getEffectivePermissions } from "../utils/accessControl";
import { pickTrimmedStringFields } from "../utils/stringFields";
import type { LoginUserInput, RegisterUserInput } from "../validators/auth.validators";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export type AuthenticatedUser = {
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userAvatar: string;
  role: string;
  permissions: string[];
};

export type AuthenticatedUserDocument = {
  _id: { toString(): string };
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userAvatar: string;
  role: Parameters<typeof getEffectivePermissions>[0];
  permissions: Parameters<typeof getEffectivePermissions>[1];
};

export function toAuthUser(user: AuthenticatedUserDocument): AuthenticatedUser {
  return {
    userName: user.userName,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userAvatar: user.userAvatar,
    role: user.role,
    permissions: getEffectivePermissions(user.role, user.permissions),
  };
}

export async function registerNewUser(input: RegisterUserInput) {
  const emailExists = await UserModel.findOne({ email: input.email });
  if (emailExists) {
    throw new AuthServiceError("Email already exists", 409);
  }

  const userNameExists = await UserModel.findOne({
    userName: input.userName,
  });

  if (userNameExists) {
    throw new AuthServiceError("Username already exists", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(input.password, salt);

  const user = new UserModel({
    firstName: input.firstName,
    lastName: input.lastName,
    userName: input.userName,
    email: input.email,
    password: hashedPassword,
  });

  return user.save();
}

export async function authenticateUser(input: LoginUserInput) {
  const user = await UserModel.findOne({
    $or: [{ email: input.identifier }, { userName: input.identifier }],
  });

  if (!user) {
    throw new AuthServiceError("Invalid credentials", 401);
  }

  const validPassword = await bcrypt.compare(input.password, user.password);

  if (!validPassword) {
    throw new AuthServiceError("Invalid credentials", 401);
  }

  return user;
}

export async function getUserProfile(userID: string) {
  const user = await UserModel.findById(userID).select("-password");

  if (!user) {
    throw new AuthServiceError("User not found", 404);
  }

  return user;
}

export async function updateUserProfile(userID: string, payload: Record<string, unknown>) {
  const updates = pickTrimmedStringFields(payload, [
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
  ]);

  const updatedUser = await UserModel.findByIdAndUpdate(userID, updates, {
    new: true,
    runValidators: true,
  }).select("userName email firstName lastName userAvatar role permissions");

  if (!updatedUser) {
    throw new AuthServiceError("User not found", 404);
  }

  return updatedUser;
}

export async function restrictUserProfile(userID: string) {
  const updatedUser = await UserModel.findByIdAndUpdate(
    userID,
    { isRestricted: true },
    { new: true, runValidators: true },
  ).select("isRestricted");

  if (!updatedUser) {
    throw new AuthServiceError("User not found", 404);
  }

  return updatedUser;
}
