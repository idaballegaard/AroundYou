import { load } from "cheerio";
import { Configuration, HttpCrawler } from "crawlee";
import { CrawledEventCandidateInput, saveCrawledEventCandidates } from "./crawledEventCandidate.service";

export const ESBJERG_LIBRARY_EVENT_SOURCE = "Esbjerg Kommunes Biblioteker arrangementer";
export const ESBJERG_LIBRARY_EVENT_CALENDAR_URL = "https://www.esbjergbibliotek.dk/arrangementer";
const EVENTS_PER_PAGE = 25;
const MAX_EVENTS_PER_CRAWL = 100;

export type EsbjergLibraryEventCrawl = {
  source: string;
  sourceUrl: string;
  crawledAt: string;
  events: CrawledEventCandidateInput[];
};

export class EsbjergLibraryEventCrawlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EsbjergLibraryEventCrawlerError";
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function absoluteUrl(value: string | undefined): string {
  return value ? new URL(value, ESBJERG_LIBRARY_EVENT_CALENDAR_URL).toString() : "";
}

function parseDateRange(value: string): { startDate: string; endDate: string } {
  const moments = [...value.matchAll(/(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/g)];
  const format = (match: RegExpMatchArray | undefined) =>
    match ? `${match[1]}T${match[2]}:${match[3]}` : "";

  return { startDate: format(moments[0]), endDate: format(moments[1]) };
}

function getEventCount(html: string): number {
  const $ = load(html);
  const resultText = normalizeText($(".result-pager__title").text());
  const match = resultText.match(/ud af (\d+) resultater/i);

  return match ? Number(match[1]) : 0;
}

function getPageUrl(page: number): string {
  return page === 0 ? ESBJERG_LIBRARY_EVENT_CALENDAR_URL : `${ESBJERG_LIBRARY_EVENT_CALENDAR_URL}?page=${page}`;
}

async function crawlEventPages(urls: string[]): Promise<string[]> {
  const htmlPages: string[] = [];
  let failureMessage = "Bibliotekets arrangementsside kunne ikke crawles.";
  const crawler = new HttpCrawler(
    {
      maxConcurrency: 1,
      maxRequestRetries: 0,
      maxRequestsPerCrawl: urls.length,
      requestHandlerTimeoutSecs: 20,
      useSessionPool: false,
      async requestHandler({ body }) {
        htmlPages.push(body.toString());
      },
      failedRequestHandler(_context, error) {
        failureMessage = error instanceof Error ? error.message : failureMessage;
      },
    },
    new Configuration({ persistStorage: false }),
  );

  await crawler.run(urls);

  if (!htmlPages.length) {
    throw new EsbjergLibraryEventCrawlerError(failureMessage);
  }

  return htmlPages;
}

export function parseEsbjergLibraryEvents(html: string): CrawledEventCandidateInput[] {
  const $ = load(html);

  // The source currently emits duplicate class attributes on the link. Its
  // list item and event URL pattern are stable across those markup variants.
  return $("li.content-list__item > a[href*='/arrangementer/']")
    .map((_index, element) => {
      const card = $(element);
      const sourceUrl = absoluteUrl(card.attr("href"));
      const dateContainer = card.find(".content-list-item__date > time").first();
      const locationText = normalizeText(
        card.find(".content-list-item__content-bottom-container__item").first().text(),
      );
      const dateText = normalizeText(dateContainer.text());

      return {
        sourceId: sourceUrl,
        sourceUrl,
        title: normalizeText(card.find(".content-list-item__title").text()),
        description: normalizeText(card.find(".content-list-item__description").text()),
        dateText: [dateText, normalizeText(card.find(".content-list-item__time").text())]
          .filter(Boolean)
          .join(", "),
        locationText,
        addressText: locationText,
        category: normalizeText(card.find(".content-list-item__tag").first().text()),
        imageUrl: absoluteUrl(card.find("img").first().attr("src")),
        ...parseDateRange(dateContainer.attr("datetime") ?? ""),
      };
    })
    .get()
    .filter((event) => Boolean(event.sourceId && event.title));
}

export async function crawlEsbjergLibraryEvents(
  limit = MAX_EVENTS_PER_CRAWL,
): Promise<EsbjergLibraryEventCrawl> {
  const requestedLimit = Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL);
  const firstPage = (await crawlEventPages([getPageUrl(0)]))[0];
  const eventCount = getEventCount(firstPage);
  const pageCount = Math.max(
    1,
    Math.ceil(Math.min(eventCount || EVENTS_PER_PAGE, requestedLimit) / EVENTS_PER_PAGE),
  );
  // The site's "Vis flere" pages are cumulative: page 2 includes the events
  // from pages 0 and 1. Fetching the final needed page avoids duplicates while
  // still collecting the complete upcoming result set.
  const resultPage = pageCount > 1
    ? (await crawlEventPages([getPageUrl(pageCount - 1)]))[0]
    : firstPage;

  return {
    source: ESBJERG_LIBRARY_EVENT_SOURCE,
    sourceUrl: ESBJERG_LIBRARY_EVENT_CALENDAR_URL,
    crawledAt: new Date().toISOString(),
    events: parseEsbjergLibraryEvents(resultPage).slice(0, requestedLimit),
  };
}

export async function importEsbjergLibraryEventCandidates(limit?: number) {
  const crawl = await crawlEsbjergLibraryEvents(limit);
  const persistence = await saveCrawledEventCandidates(
    crawl.source,
    crawl.events,
    crawl.crawledAt,
  );

  return { ...crawl, persistence };
}
