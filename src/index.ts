#!/usr/bin/env bun
import { ask } from "./ask";
import {
  addAlias,
  addModel,
  getConfig,
  listModels,
  removeModel,
  resolveModel,
  setDefaultModel,
} from "./config";

const args = process.argv.slice(2);

function printUsage(): void {
  console.log(`Usage: ask [model] "prompt"
       ask models add <model-id>
       ask models list [prefix]
       ask models default <model>
       ask models rm <model>
       ask alias <shorthand> <alias>

Examples:
  ask "What is the meaning of life?"        # uses default model
  ask grok "Hello!"                         # prefix matches grok-4.1-fast
  ask gpt-4o "Explain TypeScript"           # exact shorthand
  ask x-ai/grok-4.1-fast "..."              # full model ID`);
}

async function handleModelsCommand(subArgs: string[]): Promise<void> {
  const [action, ...rest] = subArgs;

  switch (action) {
    case "add": {
      const modelId = rest[0];
      if (!modelId || !modelId.includes("/")) {
        console.error("Error: Please provide a full model ID (e.g., x-ai/grok-4.1-fast)");
        process.exit(1);
      }
      addModel(modelId);
      console.log(`Added model: ${modelId}`);
      break;
    }
    case "list": {
      const prefix = rest[0];
      const models = listModels(prefix);
      if (models.length === 0) {
        console.log("No models configured.");
      } else {
        for (const m of models) {
          const defaultMarker = m.isDefault ? " (default)" : "";
          console.log(`${m.id} → ${m.shorthand}${defaultMarker}`);
        }
      }
      break;
    }
    case "default": {
      const input = rest[0];
      if (!input) {
        console.error("Error: Please provide a model name or prefix");
        process.exit(1);
      }
      if (setDefaultModel(input)) {
        const modelId = resolveModel(input);
        console.log(`Default model set to: ${modelId}`);
      } else {
        console.error(`Error: Model '${input}' not found`);
        process.exit(1);
      }
      break;
    }
    case "rm": {
      const input = rest[0];
      if (!input) {
        console.error("Error: Please provide a model name or prefix");
        process.exit(1);
      }
      if (removeModel(input)) {
        console.log(`Removed model matching: ${input}`);
      } else {
        console.error(`Error: Model '${input}' not found`);
        process.exit(1);
      }
      break;
    }
    default:
      console.error(`Unknown models subcommand: ${action}`);
      printUsage();
      process.exit(1);
  }
}

function handleAliasCommand(subArgs: string[]): void {
  const [shorthand, alias] = subArgs;
  if (!shorthand || !alias) {
    console.error("Error: Usage: ask alias <shorthand> <alias>");
    process.exit(1);
  }
  if (addAlias(shorthand, alias)) {
    console.log(`Added alias: ${alias} → ${shorthand}`);
  } else {
    console.error(`Error: Shorthand '${shorthand}' not found`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const firstArg = args[0];

  // Handle subcommands
  if (firstArg === "models") {
    await handleModelsCommand(args.slice(1));
    return;
  }

  if (firstArg === "alias") {
    handleAliasCommand(args.slice(1));
    return;
  }

  if (firstArg === "--help" || firstArg === "-h") {
    printUsage();
    return;
  }

  // Handle ask command
  let modelInput: string | undefined;
  let prompt: string;

  if (args.length === 1) {
    // Single arg = prompt with default model
    prompt = args[0]!;
  } else {
    // First arg might be model, rest is prompt
    const possibleModel = args[0]!;
    const resolved = resolveModel(possibleModel);

    if (resolved) {
      modelInput = possibleModel;
      prompt = args.slice(1).join(" ");
    } else {
      // First arg isn't a model, treat entire args as prompt
      prompt = args.join(" ");
    }
  }

  const config = getConfig();
  const modelId = modelInput ? resolveModel(modelInput) : config.defaultModel;

  if (!modelId) {
    console.error(`Error: Could not resolve model '${modelInput}'`);
    process.exit(1);
  }

  if (!prompt) {
    console.error("Error: No prompt provided");
    process.exit(1);
  }

  await ask(modelId, prompt);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
