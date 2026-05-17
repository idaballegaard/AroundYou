import bcrypt from "bcrypt";
import { UserModel } from "../models/userModel";
import { USER_PERMISSIONS } from "../constants/enums";

export async function ensureDefaultAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const userName = process.env.ADMIN_USERNAME ?? "admin";

  if (!email || !password) {
    return;
  }

  // Startup bootstrap is idempotent: deployments can repair missing admin
  // privileges without recreating the account or changing its password.
  const existingAdmin = await UserModel.findOne({ email });

  if (existingAdmin) {
    const needsUpdate =
      existingAdmin.role !== "admin" ||
      existingAdmin.permissions.length !== USER_PERMISSIONS.length;

    if (!needsUpdate) {
      return;
    }

    existingAdmin.role = "admin";
    existingAdmin.permissions = [...USER_PERMISSIONS];
    await existingAdmin.save();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await new UserModel({
    firstName: process.env.ADMIN_FIRST_NAME ?? "Default",
    lastName: process.env.ADMIN_LAST_NAME ?? "Admin",
    userName,
    email,
    password: hashedPassword,
    role: "admin",
    permissions: [...USER_PERMISSIONS],
  }).save();
}
