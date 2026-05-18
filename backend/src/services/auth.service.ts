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
  // Keep auth responses free of database-only fields and always expand the
  // effective permissions so the frontend does not need to understand role
  // inheritance rules.
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
  // Check unique fields before hashing so validation errors stay specific and
  // cheap compared with bcrypt work.
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
  // Users can log in with either email or username. The failure message stays
  // generic so attackers cannot enumerate registered identifiers.
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

  if (user.isRestricted) {
    throw new AuthServiceError(
      "Brugeren kan ikke logge ind, fordi kontoen er begrænset.",
      403,
    );
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
  // Only whitelisted string fields are accepted from the profile endpoint; role,
  // permissions, password, and restriction state cannot be changed here.
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
  // "Delete account" is implemented as restriction so historical user-generated
  // content can remain while the account can no longer authenticate.
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
