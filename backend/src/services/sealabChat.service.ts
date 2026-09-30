type SealabChatMessage = {
  role: "system" | "user";
  content: string;
};

type SealabChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export class SealabChatError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "SealabChatError";
    this.statusCode = statusCode;
  }
}

type SealabChatConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxMessageLength: number;
};

function getPositiveInteger(value: string | undefined, fallback: number): number {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback;
}

function getSealabChatConfig(): SealabChatConfig {
  const baseUrl = process.env.BASE_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.API_KEY?.trim();
  const model = process.env.MODEL?.trim();

  if (!baseUrl || !apiKey || !model) {
    throw new SealabChatError(
      "AI-forbindelsen mangler BASE_URL, API_KEY eller MODEL i backend/.env.",
      500,
    );
  }

  return {
    baseUrl,
    apiKey,
    model,
    timeoutMs: getPositiveInteger(process.env.TIMEOUT_MS, 90_000),
    maxMessageLength: getPositiveInteger(process.env.CHAT_MAX_MESSAGE_LENGTH, 2_000),
  };
}

function shouldUseMock(): boolean {
  return process.env.CHAT_USE_MOCK?.trim().toLowerCase() === "true";
}

function getCompletionEndpoint(baseUrl: string): string {
  return `${baseUrl}/chat/completions`;
}

/**
 * Sends a single, bounded chat request to Sealab's OpenAI-compatible API.
 * It deliberately has no database access and never writes model output itself.
 */
export async function createSealabChatCompletion(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 700,
): Promise<string> {
  const config = getSealabChatConfig();

  if (userPrompt.length > config.maxMessageLength) {
    throw new SealabChatError(
      `AI-forespørgslen er for lang. Maksimalt ${config.maxMessageLength} tegn er tilladt.`,
      400,
    );
  }

  if (shouldUseMock()) {
    return '{"shortDescription":null,"suggestedCategory":null,"suggestedLocation":null,"missingOrUncertainFields":[],"adminNote":"Mock-svar fra Sealab-klienten."}';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const messages: SealabChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let response: Response;

  try {
    response = await fetch(getCompletionEndpoint(config.baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new SealabChatError("AI-modellen svarede ikke inden for tidsgrænsen.", 504);
    }

    throw new SealabChatError("AI-modellen kunne ikke kontaktes.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Do not forward the provider's response: it can contain infrastructure
    // information which is not useful or safe to expose to an admin client.
    throw new SealabChatError("AI-modellen kunne ikke lave et forslag lige nu.", 502);
  }

  let data: SealabChatResponse;

  try {
    data = (await response.json()) as SealabChatResponse;
  } catch {
    throw new SealabChatError("AI-modellen returnerede et ugyldigt svar.");
  }

  const completion = data.choices?.[0]?.message?.content?.trim();
  if (!completion) {
    throw new SealabChatError("AI-modellen returnerede ikke et forslag.");
  }

  return completion;
}
