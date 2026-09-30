import path from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type CandidateListResponse = {
  candidates?: Array<{ id?: string }>;
};

type SuggestionResponse = {
  aiSuggestion?: unknown;
};

type McpToolResult = {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

function isMcpToolResult(value: unknown): value is McpToolResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "content" in value &&
    Array.isArray((value as { content?: unknown }).content)
  );
}

function getToolText(result: unknown): string {
  if (!isMcpToolResult(result)) {
    throw new Error("MCP-værktøjet returnerede et uventet task-svar.");
  }

  if (result.isError) {
    throw new Error(result.content.find((item) => item.type === "text")?.text ?? "MCP-værktøjet fejlede.");
  }

  const text = result.content.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error("MCP-værktøjet returnerede ikke tekstdata.");
  }

  return text;
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("MCP-værktøjet returnerede ikke gyldig JSON.");
  }
}

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve(__dirname, "../mcp/crawledEventCandidateMcpServer.js")],
    cwd: path.resolve(__dirname, "../.."),
    stderr: "inherit",
  });
  const client = new Client(
    { name: "around-you-mcp-verification", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    await client.connect(transport);

    const candidateList = parseJson<CandidateListResponse>(
      getToolText(
        await client.callTool({
          name: "list_new_crawled_event_candidates",
          arguments: { limit: 1 },
        }),
      ),
    );
    const candidateId = candidateList.candidates?.[0]?.id;

    if (!candidateId) {
      console.log("Ingen nye eventkandidater at teste med.");
      return;
    }

    const suggestion = parseJson<SuggestionResponse>(
      getToolText(
        await client.callTool({
          name: "generate_crawled_event_suggestion",
          arguments: { candidateId },
        }),
      ),
    );

    if (!suggestion.aiSuggestion || typeof suggestion.aiSuggestion !== "object") {
      throw new Error("Sealab returnerede ikke et struktureret AI-forslag.");
    }

    console.log(`AI-forslag blev verificeret for kandidat ${candidateId}.`);
    console.log("Kandidaten er ikke ændret eller publiceret.");
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    "MCP-verifikation fejlede:",
    error instanceof Error ? error.message : "Ukendt fejl",
  );
  process.exit(1);
});
