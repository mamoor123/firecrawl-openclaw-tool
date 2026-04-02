# 🔥 Firecrawl Browser Engine Tool for OpenClaw

Deep-level web scraping, interaction, and content extraction powered by [Firecrawl](https://www.firecrawl.dev).

## Features

- **Scrape** — Full JS-rendered pages → clean Markdown (Shadow DOM, iFrames supported)
- **Interact** — Click buttons, fill forms, handle infinite scrolling (natural language or Playwright code)
- **Crawl** — Recursively extract content from entire sites
- **Map** — Discover all links on a site
- **Deep Search** — Scrape a site + extract the first N sub-links automatically

## Quick Start

```bash
# 1. Set your API key (get one at https://www.firecrawl.dev/app/api-keys)
export FIRECRAWL_API_KEY="fc-YOUR_KEY"

# 2. Scrape a page
node firecrawl-tool.js scrape "https://example.com"

# 3. Interact with a page
node firecrawl-tool.js scrape "https://example.com"  # get scrapeId
node firecrawl-tool.js interact "<scrapeId>" "Click the search button"

# 4. Deep search a documentation portal (extract first 5 sub-links)
node firecrawl-tool.js deep-search "https://docs.example.com" "API reference" 5
```

## Commands

| Command | Description |
|---------|-------------|
| `scrape <url>` | Scrape URL → clean Markdown |
| `interact <scrapeId> <prompt>` | Natural-language page interaction |
| `interact:code <scrapeId> <code>` | Playwright code execution |
| `interact:stop <scrapeId>` | Stop interaction session |
| `crawl <url> [limit]` | Crawl entire site (default 10 pages) |
| `map <url>` | Discover all links on a site |
| `deep-search <url> <query> [limit]` | Scrape + extract first N sub-links |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIRECRAWL_API_KEY` | Yes | Your Firecrawl API key |
| `FIRECRAWL_API_URL` | No | Self-hosted endpoint (default: cloud API) |

## Install as OpenClaw Skill

Copy this directory to `~/.openclaw/skills/firecrawl/` and the agent will auto-discover it.

## License

MIT
