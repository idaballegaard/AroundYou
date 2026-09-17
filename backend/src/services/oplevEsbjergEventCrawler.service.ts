import { load } from "cheerio";
import { Configuration, HttpCrawler } from "crawlee";

const OPLEV_ESBJERG_EVENT_CALENDAR_URL = "https://oplev.esbjerg.dk/eventkalender";
export const OPLEV_ESBJERG_EVENT_SOURCE = "Oplev Esbjerg eventkalender";
const KULTUNAUT_EVENT_FEED_URL =
  "https://www.kultunaut.dk/perl/nautjs/type-esbjerglive4?mm=1&tmplid=arrlist&callback=aroundYouCallback";
const KULTUNAUT_EVENT_DETAIL_URL =
  "https://www.kultunaut.dk/perl/arrmore/type-esbjerglive4?ArrNr=";
const MAX_EVENTS_PER_CRAWL = 12;

export type OplevEsbjergEventCandidate = {
  sourceId: string;
  sourceUrl: string;
  title: string;
  description: string;
  dateText: string;
  locationText: string;
  addressText: string;
  category: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
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

const DANISH_MONTHS: Record<string, string> = {
  januar: "01",
  februar: "02",
  marts: "03",
  april: "04",
  maj: "05",
  juni: "06",
  juli: "07",
  august: "08",
  september: "09",
  oktober: "10",
  november: "11",
  december: "12",
};

function formatLocalDateTime(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute?: string,
): string {
  return `${year}-${month}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${(minute ?? "00").padStart(2, "0")}`;
}

// Kultunaut commonly uses strings such as "Ons. d. 16. september 2026, kl.
// 10-15.". Preserve the local time (rather than converting to UTC) because it
// is immediately shown in a datetime-local input for admin review.
export function parseKultunautDateRange(dateText: string): {
  startDate: string;
  endDate: string;
} {
  const dateMatch = dateText.match(
    /(?:d\.\s*)?(\d{1,2})\.\s*(januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)\s+(\d{4})/i,
  );
  const timeMatch = dateText.match(
    /kl\.\s*(\d{1,2})(?:[.:](\d{2}))?\s*(?:-|–|til)\s*(\d{1,2})(?:[.:](\d{2}))?/i,
  );
  const startTimeMatch = dateText.match(/kl\.\s*(\d{1,2})(?:[.:](\d{2}))?/i);

  if (!dateMatch || !startTimeMatch) {
    return { startDate: "", endDate: "" };
  }

  const [, day, monthName, year] = dateMatch;
  const month = DANISH_MONTHS[monthName.toLowerCase()];

  if (!month) {
    return { startDate: "", endDate: "" };
  }

  const startHour = timeMatch?.[1] ?? startTimeMatch[1];
  const startMinute = timeMatch?.[2] ?? startTimeMatch[2];
  return {
    startDate: formatLocalDateTime(year, month, day, startHour, startMinute),
    // Some Kultunaut cards state only when the event starts. Do not invent an
    // end time; the admin form explicitly asks for it in that case.
    endDate: timeMatch
      ? formatLocalDateTime(year, month, day, timeMatch[3], timeMatch[4])
      : "",
  };
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
      const dateText = details[0] ?? "";
      const dateRange = parseKultunautDateRange(dateText);

      return {
        sourceId: card.attr("data-arrnr") ?? "",
        sourceUrl: detailUrl,
        title: normalizeText(card.find(".card__event__content h2").first().text()),
        description: normalizeText(card.find(".card__event__content__text > p").first().text()),
        dateText,
        locationText: details[1] ?? "",
        addressText: "",
        category: normalizeText(card.find(".tag").first().text()),
        imageUrl: getAbsoluteUrl(
          card.find(".card__event__image-content img").first().attr("src") ??
            card.find(".card__event__image-content img").first().attr("data-src"),
        ),
        ...dateRange,
      };
    })
    .get()
    .filter((event) => Boolean(event.sourceId && event.title && event.sourceUrl));
}

function parseKultunautEventAddress(html: string): string {
  const $ = load(html);

  // The detail card's location row contains both its venue name and the
  // visitor-friendly street address, e.g. "Blue Water Dokken, Gl. Vardevej
  // 82, Esbjerg". The listing feed only provides the venue name.
  return normalizeText(
    $(".hero__event__content__info li")
      .filter((_index, element) => $(element).find(".svg-location").length > 0)
      .find("span")
      .first()
      .text(),
  );
}

async function addEventDetailAddresses(
  events: OplevEsbjergEventCandidate[],
): Promise<OplevEsbjergEventCandidate[]> {
  if (!events.length) {
    return events;
  }

  const addresses = new Map<string, string>();
  const crawler = new HttpCrawler(
    {
      maxConcurrency: 2,
      maxRequestRetries: 0,
      maxRequestsPerCrawl: events.length,
      requestHandlerTimeoutSecs: 20,
      useSessionPool: false,
      async requestHandler({ request, body }) {
        const sourceId = request.userData.sourceId;

        if (typeof sourceId === "string") {
          addresses.set(sourceId, parseKultunautEventAddress(body.toString()));
        }
      },
      // A single unavailable detail page must not prevent the rest of the
      // import. Such a candidate simply remains without an address.
      failedRequestHandler() {},
    },
    new Configuration({ persistStorage: false }),
  );

  await crawler.run(
    events.map((event) => ({
      url: `${KULTUNAUT_EVENT_DETAIL_URL}${encodeURIComponent(event.sourceId)}`,
      userData: { sourceId: event.sourceId },
    })),
  );

  return events.map((event) => ({
    ...event,
    addressText: addresses.get(event.sourceId) ?? "",
  }));
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

  const events = parseOplevEsbjergEvents(eventHtml).slice(
    0,
    Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL),
  );

  return {
    source: OPLEV_ESBJERG_EVENT_SOURCE,
    sourceUrl: OPLEV_ESBJERG_EVENT_CALENDAR_URL,
    crawledAt: new Date().toISOString(),
    events: await addEventDetailAddresses(events),
  };
}
