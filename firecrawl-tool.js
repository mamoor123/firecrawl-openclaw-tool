#!/usr/bin/env node
/**
 * Firecrawl CLI Wrapper for OpenClaw
 * 
 * Commands:
 *   scrape <url>              - Scrape a single URL, return clean markdown
 *   interact <scrapeId> <prompt> - Interact with a scraped page
 *   interact:code <scrapeId> <code> - Run Playwright code on page
 *   interact:stop <scrapeId>  - Stop an interaction session
 *   crawl <url> [limit]       - Crawl site, extract markdown from N pages
 *   map <url>                 - Discover all links on a site
 *   deep-search <url> <query> [limit] - Crawl site + extract first N sub-links
 *
 * Env: FIRECRAWL_API_KEY (required)
 */

const API = process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev/v2';
const KEY = process.env.FIRECRAWL_API_KEY;

if (!KEY) {
  console.error(JSON.stringify({ error: 'FIRECRAWL_API_KEY not set' }));
  process.exit(1);
}

const [,, cmd, ...args] = process.argv;

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) {
    console.error(JSON.stringify({ error: data.error || res.statusText, status: res.status }));
    process.exit(1);
  }
  return data;
}

async function pollJob(jobId, intervalMs = 2000, maxWaitMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await api('GET', `/crawl/${jobId}`);
    if (status.status === 'completed') return status;
    if (status.status === 'failed') {
      console.error(JSON.stringify({ error: 'Crawl job failed', details: status }));
      process.exit(1);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  console.error(JSON.stringify({ error: 'Crawl timed out' }));
  process.exit(1);
}

async function scrape(url, extraOpts = {}) {
  const body = {
    url,
    formats: ['markdown'],
    onlyMainContent: false,
    waitFor: 3000,
    ...extraOpts,
  };
  return api('POST', '/scrape', body);
}

async function cmdScrape(url) {
  const data = await scrape(url);
  console.log(JSON.stringify(data, null, 2));
}

async function cmdInteract(scrapeId, prompt) {
  const data = await api('POST', `/scrape/${scrapeId}/interact`, { prompt });
  console.log(JSON.stringify(data, null, 2));
}

async function cmdInteractCode(scrapeId, code) {
  const data = await api('POST', `/scrape/${scrapeId}/interact`, { code });
  console.log(JSON.stringify(data, null, 2));
}

async function cmdInteractStop(scrapeId) {
  const data = await api('DELETE', `/scrape/${scrapeId}/interact`);
  console.log(JSON.stringify(data, null, 2));
}

async function cmdCrawl(url, limit = 10) {
  const body = {
    url,
    limit: parseInt(limit),
    scrapeOptions: {
      formats: ['markdown'],
      onlyMainContent: false,
      waitFor: 3000,
    },
  };
  const job = await api('POST', '/crawl', body);
  if (!job.success && !job.id) {
    console.error(JSON.stringify({ error: 'Failed to start crawl', details: job }));
    process.exit(1);
  }
  const result = await pollJob(job.id);
  console.log(JSON.stringify(result, null, 2));
}

async function cmdMap(url) {
  const data = await api('POST', '/map', { url, limit: 100 });
  console.log(JSON.stringify(data, null, 2));
}

async function cmdDeepSearch(url, query, limit = 5) {
  // Step 1: Scrape the main page
  console.error(`[deep-search] Scraping main page: ${url}`);
  const mainPage = await scrape(url);
  const scrapeId = mainPage?.data?.metadata?.scrapeId;

  // Step 2: Map the site to find sub-links
  console.error(`[deep-search] Mapping site links...`);
  let links = [];
  try {
    const mapResult = await api('POST', '/map', { url, limit: 50 });
    links = mapResult?.links || [];
  } catch (e) {
    // Fallback: extract links from markdown
    const md = mainPage?.data?.markdown || '';
    const linkMatches = md.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    links = linkMatches.map(m => {
      const match = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
      return match ? match[2] : null;
    }).filter(Boolean);
  }

  // Filter to same-domain sub-links
  const baseUrl = new URL(url);
  const subLinks = links
    .filter(l => {
      try {
        const u = new URL(l, url);
        return u.hostname === baseUrl.hostname && u.href !== baseUrl.href;
      } catch { return false; }
    })
    .slice(0, parseInt(limit));

  console.error(`[deep-search] Found ${subLinks.length} sub-links, extracting...`);

  // Step 3: Extract markdown from each sub-link
  const results = [{
    url: url,
    title: mainPage?.data?.metadata?.title || '',
    markdown: mainPage?.data?.markdown || '',
    source: 'main-page',
  }];

  for (const link of subLinks) {
    try {
      console.error(`[deep-search] Extracting: ${link}`);
      const page = await scrape(link);
      results.push({
        url: link,
        title: page?.data?.metadata?.title || '',
        markdown: page?.data?.markdown || '',
        source: 'sub-link',
      });
    } catch (e) {
      results.push({ url: link, error: e.message, source: 'sub-link' });
    }
  }

  // Stop the interaction session if we had one
  if (scrapeId) {
    try { await api('DELETE', `/scrape/${scrapeId}/interact`); } catch {}
  }

  console.log(JSON.stringify({ query, totalExtracted: results.length, pages: results }, null, 2));
}

// Dispatch
switch (cmd) {
  case 'scrape':
    cmdScrape(args[0]);
    break;
  case 'interact':
    cmdInteract(args[0], args.slice(1).join(' '));
    break;
  case 'interact:code':
    cmdInteractCode(args[0], args.slice(1).join(' '));
    break;
  case 'interact:stop':
    cmdInteractStop(args[0]);
    break;
  case 'crawl':
    cmdCrawl(args[0], args[1] || 10);
    break;
  case 'map':
    cmdMap(args[0]);
    break;
  case 'deep-search':
    cmdDeepSearch(args[0], args[1] || '', args[2] || 5);
    break;
  default:
    console.error(`Usage: firecrawl-tool <command> [args]

Commands:
  scrape <url>                          Scrape URL -> clean markdown
  interact <scrapeId> <prompt>          Natural-language page interaction
  interact:code <scrapeId> <code>       Playwright code execution
  interact:stop <scrapeId>              Stop interaction session
  crawl <url> [limit]                   Crawl entire site (default 10 pages)
  map <url>                             Discover all links on a site
  deep-search <url> <query> [limit]     Scrape + extract first N sub-links

Env:
  FIRECRAWL_API_KEY    Required. Get yours at https://www.firecrawl.dev/app/api-keys
  FIRECRAWL_API_URL    Optional. Self-hosted endpoint (default: cloud API)`);
    process.exit(1);
}
