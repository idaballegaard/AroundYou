import { Types } from "mongoose";
import { NotificationModel } from "../models/notificationModel";
import { UserModel } from "../models/userModel";

type ReportedReview = {
  _id: Types.ObjectId;
  title: string;
  reports: { reportedBy: string }[];
};

type AuthoredReview = {
  _id: Types.ObjectId;
  author: string;
  title: string;
};

async function getReviewAuthorUserId(author: string): Promise<string | null> {
  const user = await UserModel.findOne({ userName: author }).select("_id");
  return user?._id.toString() ?? null;
}

function uniqueUserIds(userIds: Array<string | null | undefined>): string[] {
  return [...new Set(userIds.filter((userId): userId is string => !!userId))];
}

export async function notifyReviewReporters(
  review: ReportedReview,
  actionTaken: boolean,
): Promise<void> {
  const recipients = uniqueUserIds(
    review.reports.map((report) => report.reportedBy),
  );
  if (recipients.length === 0) return;

  await NotificationModel.insertMany(
    recipients.map((recipientUserId) => ({
      recipientUserId,
      type: actionTaken
        ? "review_report_action_taken"
        : "review_report_no_action",
      title: actionTaken ? "Din rapport er behandlet" : "Din rapport er lukket",
      message: actionTaken
        ? `Din rapport af anmeldelsen "${review.title}" var succesfuld. Anmeldelsen er blevet fjernet efter gennemgang.`
        : `Din rapport af anmeldelsen "${review.title}" blev gennemgået, men der blev ikke fundet brud på reglerne.`,
      reviewId: review._id.toString(),
    })),
  );
}

export async function notifyReviewAuthorReviewRemoved(
  review: AuthoredReview,
  ruleBroken: string,
): Promise<void> {
  const authorUserId = await getReviewAuthorUserId(review.author);
  if (!authorUserId) return;

  await NotificationModel.create({
    recipientUserId: authorUserId,
    type: "review_removed",
    title: "Din anmeldelse er fjernet",
    message: `Din anmeldelse "${review.title}" er blevet fjernet, fordi den brød reglen: ${ruleBroken}.`,
    reviewId: review._id.toString(),
  });
}
