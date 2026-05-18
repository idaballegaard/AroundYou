import { UserModel } from "../models/userModel";

type PlainReview = Record<string, unknown> & {
  author?: unknown;
  authorAvatar?: string;
};

type ObjectWithToObject = {
  toObject: () => unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function hasToObject(value: unknown): value is ObjectWithToObject {
  return isPlainObject(value) && typeof value.toObject === "function";
}

function toPlainReview(review: unknown): PlainReview {
  // Controllers may pass Mongoose documents or already-plain objects. Normalize
  // here so response shaping is independent of how the query was executed.
  if (hasToObject(review)) {
    const plainReview = review.toObject();
    return isPlainObject(plainReview) ? plainReview : {};
  }

  return isPlainObject(review) ? { ...review } : {};
}

function getAuthorName(review: PlainReview): string {
  return typeof review.author === "string" ? review.author : "";
}

export async function attachAuthorAvatars(reviews: unknown[]): Promise<PlainReview[]> {
  // Reviews store author names, not user ids. Batch by unique username so list
  // endpoints enrich avatars with one user query instead of N queries.
  const plainReviews = reviews.map(toPlainReview);
  const authorNames = Array.from(
    new Set(
      plainReviews
        .map(getAuthorName)
        .filter((authorName) => authorName.length > 0),
    ),
  );

  if (authorNames.length === 0) {
    return plainReviews;
  }

  const users = await UserModel.find({ userName: { $in: authorNames } })
    .select("userName userAvatar")
    .lean();
  const avatarByUserName = new Map(
    users.map((user) => [user.userName, user.userAvatar ?? ""]),
  );

  return plainReviews.map((review) => ({
    // Keep the original review payload intact and add a response-only avatar
    // field for the frontend/admin panel.
    ...review,
    authorAvatar: avatarByUserName.get(getAuthorName(review)) ?? "",
  }));
}

export async function attachAuthorAvatar(
  review: unknown | null | undefined,
): Promise<PlainReview | null> {
  return review ? (await attachAuthorAvatars([review]))[0] ?? null : null;
}
