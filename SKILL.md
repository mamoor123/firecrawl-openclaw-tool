# Firecrawl Browser Engine Tool

Deep-level web scraping, interaction, and content extraction using the Firecrawl API.

## Prerequisites

Set your API key (get one at https://www.firecrawl.dev/app/api-keys):
```bash
export FIRECRAWL_API_KEY="fc-YOUR_API_KEY"
```

Optionally add it to your shell profile (`~/.bashrc` or `~/.zshrc`).

For self-hosted Firecrawl instances:
```bash
export FIRECRAWL_API_URL="https://firecrawl.your-domain.com"
```

## Commands

### 1. Scrape — Clean Markdown Snapshots

Scrape a single URL and get the full rendered page as clean Markdown (not raw HTML).

```bash
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js scrape "https://example.com"
```

- Renders JavaScript (SPAs, React, Vue, etc.)
- Accesses content inside Shadow DOMs and iFrames (Firecrawl's headless browser handles these)
- Returns structured output: `data.markdown`, `data.metadata`, `data.links`
- Use `waitFor` (default 3000ms) to ensure dynamic content loads

### 2. Interact — Click, Fill, Scroll

After scraping, interact with the page using natural language or Playwright code.

**Step 1: Scrape the page (get scrapeId)**
```bash
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js scrape "https://example.com"
# Note the scrapeId from data.metadata.scrapeId
```

**Step 2: Interact with natural language**
```bash
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact "<scrapeId>" "Click the 'Next' button"
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact "<scrapeId>" "Fill the search box with 'machine learning' and submit"
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact "<scrapeId>" "Scroll down 3 times to load more content"
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact "<scrapeId>" "Click all 'Load More' buttons until content stops appearing"
```

**Step 2 (alt): Interact with Playwright code**
```bash
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact:code "<scrapeId>" "await page.click('button.load-more'); await page.waitForTimeout(2000);"
```

**Step 3: Stop the session**
```bash
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact:stop "<scrapeId>"
```

### 3. Crawl — Extract Multiple Pages

Recursively crawl an entire site and extract markdown from every page.

```bash
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js crawl "https://docs.example.com" 50
# Args: <url> [limit] (default limit: 10 pages)
```

- Discovers pages via sitemaps and link traversal
- Handles JavaScript rendering, rate limiting, retries
- Each page returns `markdown`, `metadata`, and `links`

### 4. Map — Discover Site Structure

Find all links on a site without scraping content.

```bash
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js map "https://docs.example.com"
```

### 5. Deep Search — The Power Combo

Search a specific site and extract content from the first N sub-links. This is the command you described in requirement #4.

```bash
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js deep-search "https://docs.example.com" "API reference" 5
# Args: <url> <query> [limit] (default limit: 5)
```

**What it does:**
1. Scrapes the main page → clean markdown
2. Maps the site to discover all sub-links
3. Filters to same-domain links only
4. Extracts clean markdown from the first N sub-links
5. Returns everything as structured JSON

## Output Format

All commands output JSON. Key fields:

| Field | Description |
|-------|-------------|
| `data.markdown` | Full page content as Markdown |
| `data.metadata.title` | Page title |
| `data.metadata.scrapeId` | Session ID for interactions |
| `data.links` | All links found on page |
| `data.metadata.sourceURL` | Final URL (after redirects) |

## Interaction Capabilities

Firecrawl's Interact endpoint handles:

| Action | Example Prompt |
|--------|---------------|
| Click buttons | "Click the 'Accept Cookies' button" |
| Fill forms | "Type 'search query' in the search box" |
| Infinite scroll | "Scroll down 5 times to load all items" |
| Navigate | "Click the third navigation link" |
| Extract dynamic data | "What is the current price shown?" |
| Handle modals | "Close the popup modal" |
| Shadow DOM | Automatically handled by the headless browser |
| iFrames | Automatically handled by the headless browser |

## Credit Costs

- Scrape: 1 credit per page
- Interact: 1 credit per interaction call
- Crawl: 1 credit per page crawled
- Map: Free (link discovery only)
- JSON extraction: +4 credits per page

## Example Workflow: Documentation Portal Deep Extraction

```bash
# 1. Get the API key ready
export FIRECRAWL_API_KEY="fc-xxxxx"

# 2. Deep search a docs site — extract top 5 sub-pages
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js deep-search "https://docs.firecrawl.dev" "scraping API" 5

# 3. Or interact step-by-step:
# Scrape first
SCRAPE_DATA=$(node ~/.openclaw/skills/firecrawl/firecrawl-tool.js scrape "https://docs.firecrawl.dev")
SCRAPE_ID=$(echo "$SCRAPE_DATA" | jq -r '.data.metadata.scrapeId')

# Navigate
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact "$SCRAPE_ID" "Click on the 'Features' section"
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact "$SCRAPE_ID" "Scroll down to find the 'Scrape' documentation"

# Clean up
node ~/.openclaw/skills/firecrawl/firecrawl-tool.js interact:stop "$SCRAPE_ID"
```
