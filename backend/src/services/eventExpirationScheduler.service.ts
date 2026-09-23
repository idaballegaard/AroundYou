import { archiveExpiredEventRecords } from "./event.service";

const CHECK_INTERVAL_MILLISECONDS = 15 * 60 * 1000;

let expirationTimer: NodeJS.Timeout | undefined;
let isArchiving = false;

export async function archiveExpiredEvents(): Promise<void> {
  if (isArchiving) {
    return;
  }

  isArchiving = true;

  try {
    const archivedCount = await archiveExpiredEventRecords();

    if (archivedCount > 0) {
      console.log(`Archived ${archivedCount} expired event(s).`);
    }
  } catch (error) {
    // A failed cleanup must never stop the API or future cleanup attempts.
    console.error("Could not archive expired events:", error);
  } finally {
    isArchiving = false;
  }
}

export async function startEventExpirationScheduler(): Promise<void> {
  if (expirationTimer) {
    return;
  }

  await archiveExpiredEvents();
  expirationTimer = setInterval(() => {
    void archiveExpiredEvents();
  }, CHECK_INTERVAL_MILLISECONDS);
}

export function stopEventExpirationScheduler(): void {
  if (expirationTimer) {
    clearInterval(expirationTimer);
    expirationTimer = undefined;
  }
}
