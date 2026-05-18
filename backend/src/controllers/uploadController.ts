import { NextFunction, Request, Response } from "express";
import type { FileFilterCallback } from "multer";
import multer from "multer";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp"]);

const getFileExtension = (fileName: string): string => {
  const extension = fileName.split(".").pop();
  return extension ? extension.toLowerCase() : "";
};

function extensionMatchesMimeType(extension: string, mimeType: string): boolean {
  // Check both MIME type and extension. Browser-provided MIME alone is not
  // enough to prevent renamed unsupported files.
  if (mimeType === "image/png") return extension === "png";
  if (mimeType === "image/webp") return extension === "webp";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return extension === "jpg" || extension === "jpeg";
  }

  return false;
}

export function isAllowedUploadImageType(fileName: string, mimeType: string): boolean {
  // Keep this in a named export so tests can cover upload type validation
  // without going through multer.
  const extension = getFileExtension(fileName);

  return (
    allowedMimeTypes.has(mimeType) &&
    allowedExtensions.has(extension) &&
    extensionMatchesMimeType(extension, mimeType)
  );
}

const imageUpload = multer({
  // Memory storage is intentional: validated files are streamed into GridFS
  // manually, and never written to the local filesystem.
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    if (!isAllowedUploadImageType(file.originalname, file.mimetype)) {
      callback(new Error("Kun PNG-, JPG- og WEBP-billeder er tilladt"));
      return;
    }

    callback(null, true);
  },
});

export function uploadSingleImage(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  imageUpload.single("image")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "Billedet må højst være 5 MB" });
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Billedet kunne ikke uploades";

    res.status(400).json({ message });
  });
}

const getImagesBucket = () => {
  // GridFS depends on the active mongoose connection; fail early if uploads are
  // called before the database is ready.
  if (!mongoose.connection.db) {
    throw new Error("MongoDB database is not connected");
  }

  return new GridFSBucket(mongoose.connection.db, { bucketName: "images" });
};

const saveImageToDatabase = async (file: Express.Multer.File) => {
  // Generate a server-side filename to avoid trusting user-provided names while
  // preserving useful metadata for debugging.
  const bucket = getImagesBucket();
  const extension = getFileExtension(file.originalname);
  const fileName = `${Date.now()}-${new ObjectId().toString()}.${extension}`;

  return new Promise<ObjectId>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(fileName, {
      metadata: {
        contentType: file.mimetype,
        originalName: file.originalname,
        uploadedAt: new Date(),
      },
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id as ObjectId));
    uploadStream.end(file.buffer);
  });
};

function getApiBaseUrl(req: Request): string {
  // Production can force a public API base URL. Local development derives it
  // from the incoming request host.
  const configuredApiBaseUrl = process.env.API_BASE_URL?.trim();

  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}/api`;
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    res.status(400).json({ message: "Der blev ikke uploadet noget billede" });
    return;
  }

  try {
    const imageId = await saveImageToDatabase(uploadedFile);
    const imageUrl = `${getApiBaseUrl(req)}/images/${imageId.toString()}`;

    res.status(201).json({ imageUrl });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ message: "Billedet kunne ikke uploades" });
  }
}

export async function getUploadedImage(
  req: Request,
  res: Response,
): Promise<void> {
  const imageIdParam = req.params.id;

  if (!imageIdParam || Array.isArray(imageIdParam) || !ObjectId.isValid(imageIdParam)) {
    res.status(400).json({ message: "Billedet har et ugyldigt id" });
    return;
  }

  try {
    const bucket = getImagesBucket();
    const imageId = new ObjectId(imageIdParam);
    const imageFile = await bucket.find({ _id: imageId }).next();

    if (!imageFile) {
      res.status(404).json({ message: "Billedet blev ikke fundet" });
      return;
    }

    const metadata = imageFile.metadata as
      | { contentType?: string }
      | undefined;

    // Reapply the original content type from upload metadata and prevent MIME
    // sniffing when browsers render the streamed GridFS file.
    if (metadata?.contentType) {
      res.setHeader("Content-Type", metadata.contentType);
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    bucket.openDownloadStream(imageId).pipe(res);
  } catch (error) {
    console.error("Get uploaded image error:", error);
    res.status(500).json({ message: "Billedet kunne ikke indlæses" });
  }
}
