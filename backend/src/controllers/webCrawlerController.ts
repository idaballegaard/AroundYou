import { Request, Response } from "express";
import { crawlPage, WebCrawlerError } from "../services/webCrawler.service";

export async function crawlWebsite(req: Request, res: Response): Promise<void> {
  try {
    const page = await crawlPage(req.body?.url);
    res.status(200).json(page);
  } catch (error) {
    if (error instanceof WebCrawlerError) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error("Web crawl failed:", error);
    res.status(502).json({ message: "Siden kunne ikke crawles." });
  }
}
