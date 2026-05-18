import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (!process.env.DBHOST) {
      throw new Error("DBHOST is not defined");
    }

    await mongoose.connect(process.env.DBHOST);

    console.log("Connected to MongoDB database successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // A backend without MongoDB cannot serve meaningful API traffic, so fail
    // startup loudly instead of running in a degraded state.
    process.exit(1);
  }
}
