import { load } from "cheerio";
import { Configuration, HttpCrawler } from "crawlee";
import { CrawledEventCandidateInput, saveCrawledEventCandidates } from "./crawledEventCandidate.service";

export const BUSINESS_ESBJERG_EVENT_SOURCE = "Business Esbjerg arrangementer";
export const BUSINESS_ESBJERG_EVENT_CALENDAR_URL = "https://www.businessesbjerg.com/arrangementer";
const BUSINESS_ESBJERG_EVENTS_API_URL =
  "https://www.businessesbjerg.com/actions/quantity-site/site/get-events?siteId=1";
const MAX_EVENTS_PER_CRAWL = 100;

type BusinessEsbjergApiEvent = {
  id: number | string;
  heading: string;
  date: string;
  month: string;
  url: string;
  isExpired: boolean;
  image?: { src?: string };
};

type BusinessEsbjergApiResponse = {
  data?: {
    grid?: {
      items?: BusinessEsbjergApiEvent[];
      pages?: number;
    };
  };
};

export type BusinessEsbjergEventCrawl = {
  source: string;
  sourceUrl: string;
  crawledAt: string;
  events: CrawledEventCandidateInput[];
};

export class BusinessEsbjergEventCrawlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessEsbjergEventCrawlerError";
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getApiUrl(page: number): string {
  return page > 1 ? `${BUSINESS_ESBJERG_EVENTS_API_URL}&page=${page}` : BUSINESS_ESBJERG_EVENTS_API_URL;
}

async function crawlApiPages(urls: string[]): Promise<BusinessEsbjergApiResponse[]> {
  const pages: BusinessEsbjergApiResponse[] = [];
  let failureMessage = "Business Esbjergs arrangementsside kunne ikke crawles.";
  const crawler = new HttpCrawler(
    {
      maxConcurrency: 2,
      maxRequestRetries: 0,
      maxRequestsPerCrawl: urls.length,
      requestHandlerTimeoutSecs: 20,
      useSessionPool: false,
      async requestHandler({ body }) {
        pages.push(JSON.parse(body.toString()) as BusinessEsbjergApiResponse);
      },
      failedRequestHandler(_context, error) {
        failureMessage = error instanceof Error ? error.message : failureMessage;
      },
    },
    new Configuration({ persistStorage: false }),
  );

  await crawler.run(urls);

  if (!pages.length) {
    throw new BusinessEsbjergEventCrawlerError(failureMessage);
  }

  return pages;
}

function getYearForEvent(month: number, day: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const eventDate = new Date(currentYear, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // The calendar only exposes day and month. Events that have already passed
  // this year therefore belong to the following calendar year.
  return eventDate < today ? currentYear + 1 : currentYear;
}

function parseDate(dayText: string, monthText: string): string {
  const months: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    maj: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    okt: 10,
    nov: 11,
    dec: 12,
  };
  const day = Number(dayText);
  const month = months[monthText.toLowerCase().slice(0, 3)];

  if (!Number.isInteger(day) || !month) return "";

  return `${getYearForEvent(month, day)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTimeRange(value: string): { startTime: string; endTime: string } {
  const times = [...value.matchAll(/(\d{1,2})[.:](\d{2})/g)].map(
    (match) => `${match[1].padStart(2, "0")}:${match[2]}`,
  );

  return { startTime: times[0] ?? "", endTime: times[1] ?? "" };
}

async function addEventDetails(
  events: CrawledEventCandidateInput[],
): Promise<CrawledEventCandidateInput[]> {
  const details = new Map<string, Partial<CrawledEventCandidateInput>>();
  const crawler = new HttpCrawler(
    {
      maxConcurrency: 2,
      maxRequestRetries: 0,
      maxRequestsPerCrawl: events.length,
      requestHandlerTimeoutSecs: 20,
      useSessionPool: false,
      async requestHandler({ request, body }) {
        const sourceId = request.userData.sourceId;
        if (typeof sourceId !== "string") return;

        const $ = load(body.toString());
        const timeText = normalizeText($(".time-location__time").text());
        const locationText = normalizeText($(".time-location__location").text());
        const { startTime, endTime } = parseTimeRange(timeText);
        const startDate = String(request.userData.startDate ?? "").slice(0, 10);

        details.set(sourceId, {
          description: normalizeText($(".eventpage__description").text()),
          locationText,
          addressText: locationText,
          dateText: [startDate, timeText].filter(Boolean).join(", "),
          startDate: startDate && startTime ? `${startDate}T${startTime}` : startDate,
          endDate: startDate && endTime ? `${startDate}T${endTime}` : "",
        });
      },
      // One inaccessible detail page must not prevent importing the rest.
      failedRequestHandler() {},
    },
    new Configuration({ persistStorage: false }),
  );

  await crawler.run(
    events.map((event) => ({
      url: event.sourceUrl,
      userData: { sourceId: event.sourceId, startDate: event.startDate },
    })),
  );

  return events.map((event) => ({ ...event, ...details.get(event.sourceId) }));
}

export async function crawlBusinessEsbjergEvents(
  limit = MAX_EVENTS_PER_CRAWL,
): Promise<BusinessEsbjergEventCrawl> {
  const requestedLimit = Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL);
  const [firstPage] = await crawlApiPages([getApiUrl(1)]);
  const pageCount = Math.max(1, firstPage.data?.grid?.pages ?? 1);
  const remainingPages = pageCount > 1
    ? await crawlApiPages(Array.from({ length: pageCount - 1 }, (_value, index) => getApiUrl(index + 2)))
    : [];
  const apiEvents = [firstPage, ...remainingPages].flatMap((page) => page.data?.grid?.items ?? []);

  const events = apiEvents
    .filter((event) => !event.isExpired)
    .map((event) => {
      const date = parseDate(event.date, event.month);
      return {
        sourceId: String(event.id),
        sourceUrl: event.url,
        title: normalizeText(event.heading),
        description: "",
        dateText: [event.date, event.month, date.slice(0, 4)].filter(Boolean).join(" "),
        locationText: "",
        addressText: "",
        category: "Erhverv",
        imageUrl: event.image?.src ?? "",
        startDate: date ? `${date}T00:00` : "",
        endDate: "",
      };
    })
    .filter((event) => Boolean(event.sourceId && event.sourceUrl && event.title && event.startDate))
    .slice(0, requestedLimit);

  return {
    source: BUSINESS_ESBJERG_EVENT_SOURCE,
    sourceUrl: BUSINESS_ESBJERG_EVENT_CALENDAR_URL,
    crawledAt: new Date().toISOString(),
    events: await addEventDetails(events),
  };
}

export async function importBusinessEsbjergEventCandidates(limit?: number) {
  const crawl = await crawlBusinessEsbjergEvents(limit);
  const persistence = await saveCrawledEventCandidates(crawl.source, crawl.events, crawl.crawledAt);
  return { ...crawl, persistence };
}
