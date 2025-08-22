/**
 * Express API returning BBC Premier League articles.
 * - Uses rss-parser to read the official BBC PL RSS feed
 * - Sends back ORIGINAL article links (no example.com)
 * - Kept simple CORS + tiny logger for learning
 */

const express = require("express");
const RSSParser = require("rss-parser");

const app = express();
const parser = new RSSParser();

// BBC Premier League feed (you can change to other BBC feeds if you like)
const BBC_PL_RSS = "https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml";

// --- tiny request logger so you see each hit
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// --- dev CORS (OK for learning; restrict in prod)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// sanity routes
app.get("/", (_req, res) => res.type("text/plain").send("OK"));
app.get("/api/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

/**
 * GET /api/news
 * - Fetches the BBC PL RSS, maps items to a clean shape
 * - Ensures the "link" we send is the BBC ORIGINAL article URL.
 */
app.get("/api/news", async (_req, res) => {
  try {
    const feed = await parser.parseURL(BBC_PL_RSS);

    // Map each RSS item into our frontend shape
    let items = (feed.items || []).map((it) => ({
      id: `bbc-${it.guid || it.id || it.link}`,      // stable-ish id
      title: (it.title || "").trim(),
      link: it.link,                                  // ← ORIGINAL BBC link
      source: "bbc",
      publishedAt: new Date(it.isoDate || it.pubDate || Date.now()).toISOString(),
      summary: (it.contentSnippet || it.summary || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 240)
    }));

    // Sort newest first and limit (optional)
    items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    items = items.slice(0, 40);

    res.json({ items, count: items.length });
  } catch (err) {
    console.error("BBC fetch error:", err);
    res.status(500).json({ error: "Failed to fetch BBC news" });
  }
});

const PORT = Number(process.env.PORT) || 5050; // keep using 5050 in dev
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
