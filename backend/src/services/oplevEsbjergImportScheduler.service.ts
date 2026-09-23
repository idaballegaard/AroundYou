import { importOplevEsbjergEventCandidates } from "./crawledEventCandidate.service";

const COPENHAGEN_TIME_ZONE = "Europe/Copenhagen";
const DEFAULT_IMPORT_HOUR = 6;

let scheduledImport: NodeJS.Timeout | undefined;
let importInProgress = false;

function isDailyImportEnabled(): boolean {
  const value = process.env.CRAWLER_DAILY_IMPORT_ENABLED?.trim().toLowerCase();
  return value !== "false" && value !== "0";
}

function getImportHour(): number {
  const configuredHour = Number(process.env.CRAWLER_DAILY_IMPORT_HOUR);

  return Number.isInteger(configuredHour) && configuredHour >= 0 && configuredHour <= 23
    ? configuredHour
    : DEFAULT_IMPORT_HOUR;
}

function getTimeZoneOffsetMilliseconds(date: Date): number {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: COPENHAGEN_TIME_ZONE,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offset?.match(/^GMT([+-])(\d{2}):(\d{2})$/);

  if (!match) {
    return 0;
  }

  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return (match[1] === "+" ? 1 : -1) * minutes * 60 * 1000;
}

function getNextImportTime(now = new Date()): Date {
  const localParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COPENHAGEN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(localParts.find((current) => current.type === type)?.value);
  const importHour = getImportHour();
  let localDateAtImportHour = new Date(
    Date.UTC(part("year"), part("month") - 1, part("day"), importHour),
  );
  let nextImport = new Date(
    localDateAtImportHour.getTime() - getTimeZoneOffsetMilliseconds(localDateAtImportHour),
  );

  if (nextImport <= now) {
    localDateAtImportHour = new Date(localDateAtImportHour.getTime() + 24 * 60 * 60 * 1000);
    nextImport = new Date(
      localDateAtImportHour.getTime() - getTimeZoneOffsetMilliseconds(localDateAtImportHour),
    );
  }

  return nextImport;
}

function scheduleNextImport(): void {
  const nextImport = getNextImportTime();
  const delay = nextImport.getTime() - Date.now();

  scheduledImport = setTimeout(() => {
    void runScheduledImport();
  }, delay);

  console.log(
    `Next Oplev Esbjerg event import is scheduled for ${nextImport.toLocaleString("da-DK", {
      timeZone: COPENHAGEN_TIME_ZONE,
    })}.`,
  );
}

async function runScheduledImport(): Promise<void> {
  if (importInProgress) {
    scheduleNextImport();
    return;
  }

  importInProgress = true;

  try {
    const result = await importOplevEsbjergEventCandidates();
    console.log(
      `Scheduled Oplev Esbjerg import completed: ${result.persistence.inserted} new and ${result.persistence.updated} updated candidates.`,
    );
  } catch (error) {
    console.error("Scheduled Oplev Esbjerg import failed:", error);
  } finally {
    importInProgress = false;
    scheduleNextImport();
  }
}

export function startOplevEsbjergImportScheduler(): void {
  if (!isDailyImportEnabled()) {
    console.log("Daily Oplev Esbjerg event import is disabled.");
    return;
  }

  if (scheduledImport) {
    return;
  }

  scheduleNextImport();
}

export function stopOplevEsbjergImportScheduler(): void {
  if (scheduledImport) {
    clearTimeout(scheduledImport);
    scheduledImport = undefined;
  }
}
