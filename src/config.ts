import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

const CONFIG_DIR = join(homedir(), ".ask");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface ModelConfig {
  shorthand: string;
}

interface Config {
  models: Record<string, ModelConfig>;
  aliases: Record<string, string>; // alias -> shorthand
  defaultModel: string;
}

const DEFAULT_CONFIG: Config = {
  models: {
    "x-ai/grok-4.1-fast": { shorthand: "grok-4.1-fast" },
    "openai/gpt-4o": { shorthand: "gpt-4o" },
    "kimi-k2.5": { shorthand: "kimi-k2.5" },
  },
  aliases: {},
  defaultModel: "x-ai/grok-4.1-fast",
};

export function getConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }
  try {
    const content = readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/** Extract shorthand from full model ID (everything after the /) */
export function extractShorthand(modelId: string): string {
  const parts = modelId.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : modelId;
}

/**
 * Resolve a model name/alias/prefix to a full model ID
 * Priority: exact full ID > exact shorthand > exact alias > prefix match on shorthand
 */
export function resolveModel(input: string): string | null {
  const config = getConfig();

  // 1. Exact full model ID match
  if (config.models[input]) {
    return input;
  }

  // 2. Exact shorthand match
  for (const [modelId, modelConfig] of Object.entries(config.models)) {
    if (modelConfig.shorthand === input) {
      return modelId;
    }
  }

  // 3. Exact alias match
  if (config.aliases[input]) {
    const shorthand = config.aliases[input];
    for (const [modelId, modelConfig] of Object.entries(config.models)) {
      if (modelConfig.shorthand === shorthand) {
        return modelId;
      }
    }
  }

  // 4. Prefix match on shorthand (first match wins)
  for (const [modelId, modelConfig] of Object.entries(config.models)) {
    if (modelConfig.shorthand.startsWith(input)) {
      return modelId;
    }
  }

  return null;
}

export function addModel(modelId: string): void {
  const config = getConfig();
  const shorthand = extractShorthand(modelId);
  config.models[modelId] = { shorthand };
  saveConfig(config);
}

export function removeModel(input: string): boolean {
  const config = getConfig();
  const modelId = resolveModel(input);
  if (modelId && config.models[modelId]) {
    delete config.models[modelId];
    // Clean up any aliases pointing to this model
    const shorthand = extractShorthand(modelId);
    for (const [alias, target] of Object.entries(config.aliases)) {
      if (target === shorthand) {
        delete config.aliases[alias];
      }
    }
    // Reset default if we removed the default model
    if (config.defaultModel === modelId) {
      const remaining = Object.keys(config.models);
      config.defaultModel = remaining[0] || "";
    }
    saveConfig(config);
    return true;
  }
  return false;
}

export function setDefaultModel(input: string): boolean {
  const modelId = resolveModel(input);
  if (modelId) {
    const config = getConfig();
    config.defaultModel = modelId;
    saveConfig(config);
    return true;
  }
  return false;
}

export function addAlias(shorthand: string, alias: string): boolean {
  const config = getConfig();
  // Verify the shorthand exists
  const exists = Object.values(config.models).some(
    (m) => m.shorthand === shorthand
  );
  if (exists) {
    config.aliases[alias] = shorthand;
    saveConfig(config);
    return true;
  }
  return false;
}

export function listModels(prefix?: string): Array<{ id: string; shorthand: string; isDefault: boolean }> {
  const config = getConfig();
  const models = Object.entries(config.models)
    .filter(([id]) => !prefix || id.startsWith(prefix))
    .map(([id, m]) => ({
      id,
      shorthand: m.shorthand,
      isDefault: id === config.defaultModel,
    }));
  return models;
}
