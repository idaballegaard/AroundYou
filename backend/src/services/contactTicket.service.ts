import { ContactTicket } from "../interfaces/contactTicket";
import { NotificationType } from "../interfaces/notification";
import { ContactTicketModel } from "../models/contactTicketModel";
import { NotificationModel } from "../models/notificationModel";

type ContactTicketNotificationType = Extract<
  NotificationType,
  | "contact_ticket_seen"
  | "contact_ticket_in_progress"
  | "contact_ticket_completed"
  | "contact_ticket_reopened"
  | "contact_ticket_rejected"
>;

// Centralized notification copy used for contact ticket status updates.
const CONTACT_TICKET_NOTIFICATION_COPY: Record<
  ContactTicketNotificationType,
  { title: string; getMessage: (subject: string) => string }
> = {
  contact_ticket_seen: {
    title: "Din henvendelse er set",
    getMessage: (subject) => `Admin har set din henvendelse "${subject}".`,
  },

  contact_ticket_in_progress: {
    title: "Din henvendelse behandles",
    getMessage: (subject) =>
      `Admin arbejder nu på din henvendelse "${subject}".`,
  },

  contact_ticket_completed: {
    title: "Din henvendelse er afsluttet",
    getMessage: (subject) =>
      `Admin har markeret din henvendelse "${subject}" som afsluttet.`,
  },

  contact_ticket_reopened: {
    title: "Din henvendelse er genåbnet",
    getMessage: (subject) => `Admin har genåbnet din henvendelse "${subject}".`,
  },

  contact_ticket_rejected: {
    title: "Din henvendelse er afvist",
    getMessage: (subject) => `Admin har afvist din henvendelse "${subject}".`,
  },
};

// Creates and sends a notification to the original ticket submitter.
async function notifyContactTicketSubmitter(
  ticket: ContactTicket,
  type: ContactTicketNotificationType,
  messageSuffix = "",
): Promise<void> {
  const copy = CONTACT_TICKET_NOTIFICATION_COPY[type];
  const message = `${copy.getMessage(ticket.subject)}${messageSuffix}`;

  await NotificationModel.create({
    recipientUserId: ticket.submittedBy,
    type,
    title: copy.title,
    message,
    link: "/contact",
  });
}

// Marks a ticket as seen by an admin.
export async function markTicketSeen(
  id: string,
  adminUserId?: string,
): Promise<ContactTicket | null> {
  const ticket = await ContactTicketModel.findById(id);
  if (!ticket) return null;

  // Only notify the submitter the first time the ticket is opened.
  const shouldNotify = !ticket.seenAt;

  if (!ticket.seenAt) {
    ticket.seenAt = new Date();
    ticket.seenBy = adminUserId;
    await ticket.save();
  }

  if (shouldNotify) {
    await notifyContactTicketSubmitter(ticket, "contact_ticket_seen");
  }

  return ticket;
}

// Moves a ticket into the in-progress state.
export async function startTicketWork(
  id: string,
  adminUserId?: string,
): Promise<ContactTicket | null> {
  const ticket = await ContactTicketModel.findById(id);
  if (!ticket) return null;

  // Avoid duplicate notifications when the ticket is already in progress.
  const shouldNotify = ticket.status !== "in_progress";

  ticket.status = "in_progress";
  ticket.inProgressAt = new Date();
  ticket.inProgressBy = adminUserId;

  ticket.seenAt = ticket.seenAt ?? new Date();
  ticket.seenBy = ticket.seenBy ?? adminUserId;

  ticket.completedAt = undefined;
  ticket.completedBy = undefined;

  ticket.rejectedAt = undefined;
  ticket.rejectedBy = undefined;
  ticket.rejectionReason = undefined;

  await ticket.save();

  if (shouldNotify) {
    await notifyContactTicketSubmitter(ticket, "contact_ticket_in_progress");
  }

  return ticket;
}

// Marks a ticket as completed.
export async function completeTicket(
  id: string,
  adminUserId?: string,
): Promise<ContactTicket | null> {
  const ticket = await ContactTicketModel.findById(id);
  if (!ticket) return null;

  // Avoid duplicate notifications when the ticket is already completed.
  const shouldNotify = ticket.status !== "completed";

  ticket.status = "completed";
  ticket.completedAt = new Date();
  ticket.completedBy = adminUserId;

  ticket.seenAt = ticket.seenAt ?? new Date();
  ticket.seenBy = ticket.seenBy ?? adminUserId;

  ticket.rejectedAt = undefined;
  ticket.rejectedBy = undefined;
  ticket.rejectionReason = undefined;

  await ticket.save();

  if (shouldNotify) {
    await notifyContactTicketSubmitter(ticket, "contact_ticket_completed");
  }

  return ticket;
}

// Reopens a previously completed or rejected ticket.
export async function reopenTicket(
  id: string,
  adminUserId?: string,
): Promise<ContactTicket | null> {
  const ticket = await ContactTicketModel.findById(id);
  if (!ticket) return null;

  // Only notify if the ticket was previously closed or rejected.
  const shouldNotify =
    ticket.status === "completed" || ticket.status === "rejected";

  ticket.status = "open";

  ticket.completedAt = undefined;
  ticket.completedBy = undefined;

  ticket.rejectedAt = undefined;
  ticket.rejectedBy = undefined;
  ticket.rejectionReason = undefined;

  ticket.inProgressAt = undefined;
  ticket.inProgressBy = undefined;

  ticket.seenAt = ticket.seenAt ?? new Date();
  ticket.seenBy = ticket.seenBy ?? adminUserId;

  await ticket.save();

  if (shouldNotify) {
    await notifyContactTicketSubmitter(ticket, "contact_ticket_reopened");
  }

  return ticket;
}

// Rejects a ticket and stores the provided rejection reason.
export async function rejectTicket(
  id: string,
  reason: string,
  adminUserId?: string,
): Promise<ContactTicket | null> {
  const ticket = await ContactTicketModel.findById(id);
  if (!ticket) return null;

  // Avoid duplicate rejection notifications with the same reason.
  const shouldNotify =
    ticket.status !== "rejected" || ticket.rejectionReason !== reason;

  ticket.status = "rejected";
  ticket.rejectedAt = new Date();
  ticket.rejectedBy = adminUserId;
  ticket.rejectionReason = reason;

  ticket.completedAt = undefined;
  ticket.completedBy = undefined;

  ticket.inProgressAt = undefined;
  ticket.inProgressBy = undefined;

  ticket.seenAt = ticket.seenAt ?? new Date();
  ticket.seenBy = ticket.seenBy ?? adminUserId;

  await ticket.save();

  if (shouldNotify) {
    await notifyContactTicketSubmitter(
      ticket,
      "contact_ticket_rejected",
      ` Begrundelse: ${reason}`,
    );
  }

  return ticket;
}
