import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const moonshot = createOpenAICompatible({
  name: "moonshot",
  baseURL: "https://api.moonshot.ai/v1",
  apiKey: process.env.MOONSHOT_API_KEY,
});

type Provider = "openrouter" | "moonshot";

function getProvider(modelId: string): Provider {
  // Moonshot models start with "kimi-"
  if (modelId.startsWith("kimi-")) {
    return "moonshot";
  }
  // OpenRouter models have provider/model format
  return "openrouter";
}

export async function ask(modelId: string, prompt: string): Promise<void> {
  const provider = getProvider(modelId);

  if (provider === "moonshot") {
    if (!process.env.MOONSHOT_API_KEY) {
      console.error("Error: MOONSHOT_API_KEY environment variable is not set");
      process.exit(1);
    }
    const result = streamText({
      model: moonshot(modelId),
      prompt,
    });
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  } else {
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Error: OPENROUTER_API_KEY environment variable is not set");
      process.exit(1);
    }
    const result = streamText({
      model: openrouter(modelId),
      prompt,
    });
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  }

  console.log(); // Final newline
}
