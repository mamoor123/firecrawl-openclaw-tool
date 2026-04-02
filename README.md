# 🔥 Firecrawl Browser Engine Tool for OpenClaw

Deep-level web scraping, interaction, and content extraction powered by [Firecrawl](https://www.firecrawl.dev).

## Features

- **Scrape** — Full JS-rendered pages → clean Markdown (Shadow DOM, iFrames supported)
- **Interact** — Click buttons, fill forms, handle infinite scrolling (natural language or Playwright code)
- **Crawl** — Recursively extract content from entire sites
- **Map** — Discover all links on a site (free, no credits)
- **Deep Search** — Scrape a site + extract the first N sub-links automatically

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/mamoor123/firecrawl-openclaw-tool.git
cd firecrawl-openclaw-tool
```

No `npm install` needed — single file using native `fetch`. Works on **Node 18+**.

### 2. Get a Firecrawl API key

Sign up at https://www.firecrawl.dev/app/api-keys

Free tier includes **500 credits**. No credit card needed.

### 3. Set the key

```bash
export FIRECRAWL_API_KEY="fc-YOUR_KEY"

# To persist across sessions:
echo 'export FIRECRAWL_API_KEY="fc-YOUR_KEY"' >> ~/.bashrc
source ~/.bashrc
```

## Usage

### Scrape a page → clean Markdown

```bash
node firecrawl-tool.js scrape "https://example.com"
```

### Interact — click, fill, scroll

```bash
# 1. Scrape to get a session ID
node firecrawl-tool.js scrape "https://amazon.com"
# Note the "scrapeId" from the response

# 2. Interact with the page
node firecrawl-tool.js interact "<scrapeId>" "Click the search button"
node firecrawl-tool.js interact "<scrapeId>" "Type 'laptop' in the search box"
node firecrawl-tool.js interact "<scrapeId>" "Scroll down 3 times to load more"
node firecrawl-tool.js interact "<scrapeId>" "What are the top 3 product prices?"

# 3. Run Playwright code directly (advanced)
node firecrawl-tool.js interact:code "<scrapeId>" "await page.click('button.load-more')"

# 4. Stop when done
node firecrawl-tool.js interact:stop "<scrapeId>"
```

### Crawl an entire site

```bash
node firecrawl-tool.js crawl "https://docs.example.com" 50
#                            ↑ URL                      ↑ page limit (default: 10)
```

### Map — find all links (free)

```bash
node firecrawl-tool.js map "https://docs.example.com"
```

### Deep Search — the power command

```bash
node firecrawl-tool.js deep-search "https://docs.example.com" "API reference" 5
#                                   ↑ URL                    ↑ query        ↑ sub-links to extract
```

Automatically:
1. Scrapes the main page → Markdown
2. Discovers all sub-links on the domain
3. Extracts clean Markdown from the first N sub-links

## Commands Reference

| Command | Description | Credits |
|---------|-------------|---------|
| `scrape <url>` | Scrape URL → clean Markdown | 1 |
| `interact <scrapeId> <prompt>` | Natural-language page interaction | 1/call |
| `interact:code <scrapeId> <code>` | Playwright code execution | 1/call |
| `interact:stop <scrapeId>` | Stop interaction session | free |
| `crawl <url> [limit]` | Crawl entire site | 1/page |
| `map <url>` | Discover all links on a site | free |
| `deep-search <url> <query> [limit]` | Scrape + extract first N sub-links | 1+N |

## Output

All commands return JSON. Key fields:

```json
{
  "data": {
    "markdown": "# Page Title\n\nFull page content as Markdown...",
    "metadata": {
      "title": "Page Title",
      "scrapeId": "019d4d48-...",
      "sourceURL": "https://example.com",
      "statusCode": 200
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIRECRAWL_API_KEY` | Yes | Your Firecrawl API key |
| `FIRECRAWL_API_URL` | No | Self-hosted endpoint (default: cloud API) |

## Install as OpenClaw Skill

```bash
# Copy to OpenClaw skills directory
cp -r . ~/.openclaw/skills/firecrawl/
```

The agent will auto-discover it on next session.

## Requirements

- Node.js 18+ (for native `fetch`)
- Firecrawl API key

## License

MIT

## OpenClaw Integration

### Add to your AGENTS.md

Add this to `~/.openclaw/workspace/AGENTS.md` so the agent knows about the tool:

```markdown
## Firecrawl Tool

When the user asks to scrape, crawl, extract, or interact with websites:
- Tool location: `~/.openclaw/skills/firecrawl/firecrawl-tool.js`
- API key: set via `FIRECRAWL_API_KEY` env var
- Commands: scrape, interact, interact:code, interact:stop, crawl, map, deep-search
- Usage: `node ~/.openclaw/skills/firecrawl/firecrawl-tool.js <command> <args>`

Capabilities:
- Scrapes JS-rendered pages to clean Markdown (Shadow DOM, iFrames handled)
- Interacts with pages: click, fill forms, scroll (natural language or Playwright)
- Crawls entire sites recursively
- Discovers all links on a site (free)
- Deep search: main page + N sub-links in one command
```

### Example prompts for the agent

```
"Scrape https://react.dev and summarize the page"
"Deep search https://docs.python.org for 'asyncio', extract 5 pages"
"Map all links on https://example.com"
"Interact with https://amazon.com - search for headphones and tell me the top 3 prices"
"Crawl https://docs.firecrawl.dev, limit 20 pages"
```
