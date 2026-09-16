import { load } from "cheerio";
import { Configuration, HttpCrawler } from "crawlee";

const OPLEV_ESBJERG_EVENT_CALENDAR_URL = "https://oplev.esbjerg.dk/eventkalender";
export const OPLEV_ESBJERG_EVENT_SOURCE = "Oplev Esbjerg eventkalender";
const KULTUNAUT_EVENT_FEED_URL =
  "https://www.kultunaut.dk/perl/nautjs/type-esbjerglive4?mm=1&tmplid=arrlist&callback=aroundYouCallback";
const MAX_EVENTS_PER_CRAWL = 12;

export type OplevEsbjergEventCandidate = {
  sourceId: string;
  sourceUrl: string;
  title: string;
  description: string;
  dateText: string;
  locationText: string;
  category: string;
  imageUrl: string;
};

export type OplevEsbjergEventCrawl = {
  source: string;
  sourceUrl: string;
  crawledAt: string;
  events: OplevEsbjergEventCandidate[];
};

export class OplevEsbjergEventCrawlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OplevEsbjergEventCrawlerError";
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getAbsoluteUrl(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return new URL(value, OPLEV_ESBJERG_EVENT_CALENDAR_URL).toString();
}

export function extractKultunautHtml(responseBody: string): string {
  const payloadStart = responseBody.indexOf("({");
  const payloadEnd = responseBody.lastIndexOf(");}");

  if (payloadStart < 0 || payloadEnd < 0) {
    throw new OplevEsbjergEventCrawlerError("Eventfeedet havde et ukendt format.");
  }

  try {
    const payload = JSON.parse(responseBody.slice(payloadStart + 1, payloadEnd)) as { html?: unknown };

    if (typeof payload.html !== "string") {
      throw new OplevEsbjergEventCrawlerError("Eventfeedet indeholdt ingen eventliste.");
    }

    return payload.html;
  } catch (error) {
    if (error instanceof OplevEsbjergEventCrawlerError) {
      throw error;
    }

    throw new OplevEsbjergEventCrawlerError("Eventfeedet kunne ikke læses.");
  }
}

export function parseOplevEsbjergEvents(html: string): OplevEsbjergEventCandidate[] {
  const $ = load(html);

  return $(".card-events [data-arrnr]")
    .map((_index, element) => {
      const card = $(element);
      const detailUrl = getAbsoluteUrl(card.find("a.card__event").first().attr("href"));
      const details = card
        .find(".card__event__content > ul > li span")
        .map((_detailIndex, detail) => normalizeText($(detail).text()))
        .get();

      return {
        sourceId: card.attr("data-arrnr") ?? "",
        sourceUrl: detailUrl,
        title: normalizeText(card.find(".card__event__content h2").first().text()),
        description: normalizeText(card.find(".card__event__content__text > p").first().text()),
        dateText: details[0] ?? "",
        locationText: details[1] ?? "",
        category: normalizeText(card.find(".tag").first().text()),
        imageUrl: getAbsoluteUrl(
          card.find(".card__event__image-content img").first().attr("src") ??
            card.find(".card__event__image-content img").first().attr("data-src"),
        ),
      };
    })
    .get()
    .filter((event) => Boolean(event.sourceId && event.title && event.sourceUrl));
}

export async function crawlOplevEsbjergEvents(
  limit = MAX_EVENTS_PER_CRAWL,
): Promise<OplevEsbjergEventCrawl> {
  let eventHtml = "";
  let failureMessage = "Oplev Esbjergs eventkalender kunne ikke crawles.";

  const crawler = new HttpCrawler(
    {
      maxConcurrency: 1,
      maxRequestRetries: 0,
      maxRequestsPerCrawl: 1,
      requestHandlerTimeoutSecs: 20,
      useSessionPool: false,
      additionalMimeTypes: ["application/javascript"],
      async requestHandler({ body }) {
        eventHtml = extractKultunautHtml(body.toString());
      },
      failedRequestHandler(_context, error) {
        failureMessage = error instanceof Error ? error.message : failureMessage;
      },
    },
    new Configuration({ persistStorage: false }),
  );

  await crawler.run([KULTUNAUT_EVENT_FEED_URL]);

  if (!eventHtml) {
    throw new OplevEsbjergEventCrawlerError(failureMessage);
  }

  return {
    source: OPLEV_ESBJERG_EVENT_SOURCE,
    sourceUrl: OPLEV_ESBJERG_EVENT_CALENDAR_URL,
    crawledAt: new Date().toISOString(),
    events: parseOplevEsbjergEvents(eventHtml).slice(0, Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL)),
  };
}
