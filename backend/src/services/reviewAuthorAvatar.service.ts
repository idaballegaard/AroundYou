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
    ...review,
    authorAvatar: avatarByUserName.get(getAuthorName(review)) ?? "",
  }));
}

export async function attachAuthorAvatar(
  review: unknown | null | undefined,
): Promise<PlainReview | null> {
  return review ? (await attachAuthorAvatars([review]))[0] ?? null : null;
}
