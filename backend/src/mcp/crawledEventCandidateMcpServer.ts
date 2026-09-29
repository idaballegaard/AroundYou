import dotenvFlow from "dotenv-flow";
import mongoose from "mongoose";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { CrawledEventCandidateModel } from "../models/crawledEventCandidateModel";

dotenvFlow.config();

type QualityIssue = {
  field: "startTime" | "location" | "image" | "description";
  message: string;
};

function hasStartTime(startDate: string): boolean {
  return Boolean(startDate) && !startDate.endsWith("T00:00");
}

function getQualityIssues(candidate: {
  startDate: string;
  locationText: string;
  addressText: string;
  imageUrl: string;
  description: string;
}): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (!hasStartTime(candidate.startDate)) {
    issues.push({
      field: "startTime",
      message: "Kandidaten mangler et konkret starttidspunkt.",
    });
  }

  if (!candidate.locationText.trim() && !candidate.addressText.trim()) {
    issues.push({
      field: "location",
      message: "Kandidaten mangler både stednavn og adresse.",
    });
  }

  if (!candidate.imageUrl.trim()) {
    issues.push({
      field: "image",
      message: "Kandidaten mangler et billede.",
    });
  }

  if (candidate.description.trim().length < 3) {
    issues.push({
      field: "description",
      message: "Kandidaten mangler en brugbar beskrivelse.",
    });
  }

  return issues;
}

/**
 * Creates the first, intentionally read-only MCP surface for the event crawler.
 * The connected language model can inspect one unreviewed candidate, but cannot
 * approve, reject, edit, or publish it through MCP.
 */
export function createCrawledEventCandidateMcpServer(): McpServer {
  const server = new McpServer({
    name: "around-you-crawler",
    version: "1.0.0",
  });

  server.registerTool(
    "list_new_crawled_event_candidates",
    {
      title: "Vis nye crawlede eventkandidater",
      description:
        "Henter en kort, nyeste-først oversigt over eventkandidater, som endnu ikke er gennemgået. Brug id'et med get_crawled_event_candidate for at læse en kandidats fulde data.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(25)
          .default(10)
          .describe("Antal kandidater, der skal returneres. Maksimalt 25."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ limit }) => {
      const candidates = await CrawledEventCandidateModel.find({ status: "new" })
        .sort({ crawledAt: -1, _id: -1 })
        .limit(limit)
        .lean();

      const response = {
        candidates: candidates.map((candidate) => ({
          id: candidate._id.toString(),
          title: candidate.title,
          source: candidate.source,
          dateText: candidate.dateText,
          startDate: candidate.startDate,
          locationText: candidate.locationText,
          addressText: candidate.addressText,
          category: candidate.category,
          sourceUrl: candidate.sourceUrl,
          qualityIssues: getQualityIssues(candidate).map((issue) => issue.field),
        })),
        returnedCount: candidates.length,
        nextStep:
          "Vælg højst én kandidat og brug get_crawled_event_candidate for at læse dens fulde oplysninger.",
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_crawled_event_candidate",
    {
      title: "Hent crawlet eventkandidat",
      description:
        "Henter én ny, ikke-gennemgået eventkandidat fra AroundYou. Værktøjet er kun til læsning og må bruges til at foreslå resumé, kategori eller manglende oplysninger.",
      inputSchema: {
        candidateId: z
          .string()
          .regex(/^[a-f\d]{24}$/i, "candidateId skal være et gyldigt MongoDB-id."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ candidateId }) => {
      const candidate = await CrawledEventCandidateModel.findOne({
        _id: candidateId,
        status: "new",
      }).lean();

      if (!candidate) {
        return {
          content: [
            {
              type: "text",
              text: "Der blev ikke fundet en ny eventkandidat med det angivne id.",
            },
          ],
          isError: true,
        };
      }

      const qualityIssues = getQualityIssues(candidate);
      const response = {
        candidate: {
          id: candidate._id.toString(),
          source: candidate.source,
          sourceUrl: candidate.sourceUrl,
          title: candidate.title,
          description: candidate.description,
          dateText: candidate.dateText,
          startDate: candidate.startDate,
          endDate: candidate.endDate,
          locationText: candidate.locationText,
          addressText: candidate.addressText,
          category: candidate.category,
          imageUrl: candidate.imageUrl,
          crawledAt: candidate.crawledAt.toISOString(),
        },
        qualityIssues,
        suggestedNextStep: qualityIssues.length
          ? "Foreslå manglende eller forbedrede oplysninger til admin. Du må ikke publicere kandidaten."
          : "Kandidaten har de grundlæggende oplysninger. Du kan foreslå et kort resumé og en kategori til admin.",
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

async function connectToMcpDatabase(): Promise<void> {
  if (!process.env.DBHOST) {
    throw new Error("DBHOST is not defined");
  }

  await mongoose.connect(process.env.DBHOST);
}

async function main(): Promise<void> {
  await connectToMcpDatabase();

  const server = createCrawledEventCandidateMcpServer();
  await server.connect(new StdioServerTransport());
}

if (require.main === module) {
  main().catch((error: unknown) => {
    // stdout is reserved for MCP's JSON-RPC protocol.
    console.error("Could not start the AroundYou crawler MCP server:", error);
    process.exit(1);
  });
}
