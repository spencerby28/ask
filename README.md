# ask

Simple CLI to query LLMs via OpenRouter and Moonshot APIs.

## Install

```bash
bunx @28s/ask "Hello!"
```

Or install globally:

```bash
bun add -g @28s/ask
```

## Setup

Set your API keys:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
export MOONSHOT_API_KEY=sk-...
```

## Usage

```bash
# Query with default model
ask "What is the meaning of life?"

# Use a specific model (prefix matching)
ask grok "Hello!"           # matches grok-4.1-fast
ask kimi "Hello!"           # uses Kimi K2.5 via Moonshot
ask gpt-4o "Explain TypeScript"

# Full model ID
ask x-ai/grok-4.1-fast "..."
```

## Model Management

```bash
# List configured models
ask models list

# Add a model (auto-generates shorthand from name after /)
ask models add anthropic/claude-3.5-sonnet

# Set default model
ask models default kimi

# Remove a model
ask models rm gpt-4o
```

## Aliases

```bash
# Add custom alias
ask alias kimi-k2.5 k
ask k "Hello!"
```

## Config

Config stored at `~/.ask/config.json`

## Providers

- **OpenRouter**: Models with `provider/model` format (e.g., `x-ai/grok-4.1-fast`)
- **Moonshot**: Models starting with `kimi-` (e.g., `kimi-k2.5`)

## License

MIT
