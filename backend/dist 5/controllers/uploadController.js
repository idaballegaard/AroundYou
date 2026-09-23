"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedUploadImageType = isAllowedUploadImageType;
exports.uploadSingleImage = uploadSingleImage;
exports.uploadImage = uploadImage;
exports.getUploadedImage = getUploadedImage;
const multer_1 = __importDefault(require("multer"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
]);
const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp"]);
const getFileExtension = (fileName) => {
    const extension = fileName.split(".").pop();
    return extension ? extension.toLowerCase() : "";
};
function extensionMatchesMimeType(extension, mimeType) {
    // Check both MIME type and extension. Browser-provided MIME alone is not
    // enough to prevent renamed unsupported files.
    if (mimeType === "image/png")
        return extension === "png";
    if (mimeType === "image/webp")
        return extension === "webp";
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
        return extension === "jpg" || extension === "jpeg";
    }
    return false;
}
function isAllowedUploadImageType(fileName, mimeType) {
    // Keep this in a named export so tests can cover upload type validation
    // without going through multer.
    const extension = getFileExtension(fileName);
    return (allowedMimeTypes.has(mimeType) &&
        allowedExtensions.has(extension) &&
        extensionMatchesMimeType(extension, mimeType));
}
const imageUpload = (0, multer_1.default)({
    // Memory storage is intentional: validated files are streamed into GridFS
    // manually, and never written to the local filesystem.
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (!isAllowedUploadImageType(file.originalname, file.mimetype)) {
            callback(new Error("Kun PNG-, JPG- og WEBP-billeder er tilladt"));
            return;
        }
        callback(null, true);
    },
});
function uploadSingleImage(req, res, next) {
    imageUpload.single("image")(req, res, (error) => {
        if (!error) {
            next();
            return;
        }
        if (error instanceof multer_1.default.MulterError && error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ message: "Billedet må højst være 5 MB" });
            return;
        }
        const message = error instanceof Error
            ? error.message
            : "Billedet kunne ikke uploades";
        res.status(400).json({ message });
    });
}
const getImagesBucket = () => {
    // GridFS depends on the active mongoose connection; fail early if uploads are
    // called before the database is ready.
    if (!mongoose_1.default.connection.db) {
        throw new Error("MongoDB database is not connected");
    }
    return new mongodb_1.GridFSBucket(mongoose_1.default.connection.db, { bucketName: "images" });
};
const saveImageToDatabase = (file) => __awaiter(void 0, void 0, void 0, function* () {
    // Generate a server-side filename to avoid trusting user-provided names while
    // preserving useful metadata for debugging.
    const bucket = getImagesBucket();
    const extension = getFileExtension(file.originalname);
    const fileName = `${Date.now()}-${new mongodb_1.ObjectId().toString()}.${extension}`;
    return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(fileName, {
            metadata: {
                contentType: file.mimetype,
                originalName: file.originalname,
                uploadedAt: new Date(),
            },
        });
        uploadStream.on("error", reject);
        uploadStream.on("finish", () => resolve(uploadStream.id));
        uploadStream.end(file.buffer);
    });
});
function getApiBaseUrl(req) {
    var _a;
    // Production can force a public API base URL. Local development derives it
    // from the incoming request host.
    const configuredApiBaseUrl = (_a = process.env.API_BASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (configuredApiBaseUrl) {
        return configuredApiBaseUrl.replace(/\/$/, "");
    }
    return `${req.protocol}://${req.get("host")}/api`;
}
function uploadImage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadedFile = req.file;
        if (!uploadedFile) {
            res.status(400).json({ message: "Der blev ikke uploadet noget billede" });
            return;
        }
        try {
            const imageId = yield saveImageToDatabase(uploadedFile);
            const imageUrl = `${getApiBaseUrl(req)}/images/${imageId.toString()}`;
            res.status(201).json({ imageUrl });
        }
        catch (error) {
            console.error("Upload image error:", error);
            res.status(500).json({ message: "Billedet kunne ikke uploades" });
        }
    });
}
function getUploadedImage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const imageIdParam = req.params.id;
        if (!imageIdParam || Array.isArray(imageIdParam) || !mongodb_1.ObjectId.isValid(imageIdParam)) {
            res.status(400).json({ message: "Billedet har et ugyldigt id" });
            return;
        }
        try {
            const bucket = getImagesBucket();
            const imageId = new mongodb_1.ObjectId(imageIdParam);
            const imageFile = yield bucket.find({ _id: imageId }).next();
            if (!imageFile) {
                res.status(404).json({ message: "Billedet blev ikke fundet" });
                return;
            }
            const metadata = imageFile.metadata;
            // Reapply the original content type from upload metadata and prevent MIME
            // sniffing when browsers render the streamed GridFS file.
            if (metadata === null || metadata === void 0 ? void 0 : metadata.contentType) {
                res.setHeader("Content-Type", metadata.contentType);
            }
            res.setHeader("X-Content-Type-Options", "nosniff");
            bucket.openDownloadStream(imageId).pipe(res);
        }
        catch (error) {
            console.error("Get uploaded image error:", error);
            res.status(500).json({ message: "Billedet kunne ikke indlæses" });
        }
    });
}
//# sourceMappingURL=uploadController.js.map