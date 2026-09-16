import { CheerioCrawler, Configuration } from "crawlee";

const MAX_TEXT_LENGTH = 20_000;

export type CrawledPage = {
  url: string;
  title: string;
  description: string;
  canonicalUrl: string;
  content: string;
};

export class WebCrawlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebCrawlerError";
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isPrivateIpAddress(hostname: string): boolean {
  return (
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^0\.0\.0\.0$/.test(hostname) ||
    /^::1$/.test(hostname) ||
    /^fc/i.test(hostname) ||
    /^fd/i.test(hostname) ||
    /^fe80:/i.test(hostname)
  );
}

export function validateCrawlUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new WebCrawlerError("Indtast en gyldig URL.");
  }

  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new WebCrawlerError("Indtast en gyldig URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new WebCrawlerError("Kun http- og https-URL'er kan crawles.");
  }

  const hostname = url.hostname.toLowerCase();

  // The endpoint accepts externally reachable public sites only. This prevents
  // the crawler from being used to read local services or cloud metadata URLs.
  if (hostname === "localhost" || hostname.endsWith(".localhost") || isPrivateIpAddress(hostname)) {
    throw new WebCrawlerError("Lokale og private adresser kan ikke crawles.");
  }

  return url.toString();
}

export async function crawlPage(inputUrl: string): Promise<CrawledPage> {
  const url = validateCrawlUrl(inputUrl);
  let page: CrawledPage | null = null;
  let failureMessage = "Siden kunne ikke crawles.";

  const crawler = new CheerioCrawler({
    maxConcurrency: 1,
    maxRequestRetries: 0,
    maxRequestsPerCrawl: 1,
    requestHandlerTimeoutSecs: 20,
    useSessionPool: false,
    async requestHandler({ $, request }) {
      $("script, style, noscript, svg, nav, footer, header, aside").remove();

      const contentRoot = $("main, article, [role='main']").first();
      const content = normalizeText((contentRoot.length ? contentRoot : $("body")).text()).slice(
        0,
        MAX_TEXT_LENGTH,
      );

      page = {
        url: request.loadedUrl ?? request.url,
        title: normalizeText($("title").first().text()),
        description: normalizeText($("meta[name='description']").attr("content") ?? ""),
        canonicalUrl: $("link[rel='canonical']").attr("href") ?? request.loadedUrl ?? request.url,
        content,
      };
    },
    failedRequestHandler({ error }) {
      failureMessage = error instanceof Error ? error.message : failureMessage;
    },
  }, new Configuration({ persistStorage: false }));

  await crawler.run([url]);

  if (!page) {
    throw new WebCrawlerError(failureMessage);
  }

  return page;
}
