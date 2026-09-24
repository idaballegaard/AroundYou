import { load } from "cheerio";
import { Configuration, HttpCrawler } from "crawlee";
import { CrawledEventCandidateInput, saveCrawledEventCandidates } from "./crawledEventCandidate.service";

export const ESBJERG_CITY_EVENT_SOURCE = "Esbjerg City eventkalender";
export const ESBJERG_CITY_EVENT_CALENDAR_URL = "https://www.esbjergcity.dk/det-sker/";
const MAX_EVENTS_PER_CRAWL = 50;

export type EsbjergCityEventCrawl = {
  source: string;
  sourceUrl: string;
  crawledAt: string;
  events: CrawledEventCandidateInput[];
};

export class EsbjergCityEventCrawlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EsbjergCityEventCrawlerError";
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeYear(value: string): string {
  return value.length === 2 ? `20${value}` : value;
}

function formatDate(year: string, month: string, day: string): string {
  return `${normalizeYear(year)}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00`;
}

function parseDateRange(value: string): { startDate: string; endDate: string; title: string } {
  const range = value.match(
    /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*(?:-|–)\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*(.*)$/,
  );
  const single = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*(.*)$/);

  if (range) {
    return {
      startDate: formatDate(range[3] ?? range[6], range[2], range[1]),
      endDate: formatDate(range[6], range[5], range[4]),
      title: normalizeText(range[7]),
    };
  }

  if (single) {
    const date = formatDate(single[3], single[2], single[1]);
    return { startDate: date, endDate: date, title: normalizeText(single[4]) };
  }

  return { startDate: "", endDate: "", title: normalizeText(value) };
}

function isUpcoming(startDate: string): boolean {
  return Boolean(startDate) && startDate.slice(0, 10) >= new Date().toISOString().slice(0, 10);
}

export function parseEsbjergCityEvents(html: string): CrawledEventCandidateInput[] {
  const $ = load(html);

  return $("article.dt_portfolio_category-kalender")
    .map((_index, element) => {
      const card = $(element);
      const sourceUrl = card.find(".entry-title a").first().attr("href") ?? "";
      const rawTitle = normalizeText(card.find(".entry-title").text());
      const parsed = parseDateRange(rawTitle);

      return {
        sourceId: card.attr("data-post-id") ?? sourceUrl,
        sourceUrl,
        title: parsed.title,
        description: "",
        dateText: rawTitle,
        locationText: "Esbjerg City",
        addressText: "",
        category: "Byliv",
        imageUrl: card.find("img").first().attr("data-src") ?? "",
        startDate: parsed.startDate,
        endDate: parsed.endDate,
      };
    })
    .get()
    .filter((event) => Boolean(event.sourceId && event.sourceUrl && event.title && isUpcoming(event.startDate)));
}

async function crawlPage(url: string): Promise<string> {
  let html = "";
  let failureMessage = "Esbjerg Citys eventside kunne ikke crawles.";
  const crawler = new HttpCrawler(
    {
      maxConcurrency: 1,
      maxRequestRetries: 0,
      maxRequestsPerCrawl: 1,
      requestHandlerTimeoutSecs: 20,
      useSessionPool: false,
      async requestHandler({ body }) {
        html = body.toString();
      },
      failedRequestHandler(_context, error) {
        failureMessage = error instanceof Error ? error.message : failureMessage;
      },
    },
    new Configuration({ persistStorage: false }),
  );

  await crawler.run([url]);

  if (!html) {
    throw new EsbjergCityEventCrawlerError(failureMessage);
  }

  return html;
}

async function addEventDescriptions(
  events: CrawledEventCandidateInput[],
): Promise<CrawledEventCandidateInput[]> {
  const descriptions = new Map<string, string>();
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
        descriptions.set(
          sourceId,
          normalizeText($(".project-content .wpb_text_column p").first().text()),
        );
      },
      // A protected or unavailable detail page must not block other events.
      failedRequestHandler() {},
    },
    new Configuration({ persistStorage: false }),
  );

  await crawler.run(events.map((event) => ({ url: event.sourceUrl, userData: { sourceId: event.sourceId } })));

  return events.map((event) => ({ ...event, description: descriptions.get(event.sourceId) ?? "" }));
}

export async function crawlEsbjergCityEvents(
  limit = MAX_EVENTS_PER_CRAWL,
): Promise<EsbjergCityEventCrawl> {
  const requestedLimit = Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL);
  const events = parseEsbjergCityEvents(await crawlPage(ESBJERG_CITY_EVENT_CALENDAR_URL))
    .slice(0, requestedLimit);

  return {
    source: ESBJERG_CITY_EVENT_SOURCE,
    sourceUrl: ESBJERG_CITY_EVENT_CALENDAR_URL,
    crawledAt: new Date().toISOString(),
    events: await addEventDescriptions(events),
  };
}

export async function importEsbjergCityEventCandidates(limit?: number) {
  const crawl = await crawlEsbjergCityEvents(limit);
  const persistence = await saveCrawledEventCandidates(crawl.source, crawl.events, crawl.crawledAt);
  return { ...crawl, persistence };
}
