// web/src/App.jsx
/**
 * Adds <div className="content-bg"> under the hero.
 * That wrapper owns the background image for the whole main area.
 */
import React, { useEffect, useState } from "react";
import { fetchNews } from "./api.js";
import ArticleList from "./ArticleList.jsx";
import Footer from "./Footer.jsx";


export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchNews();
        setNews(data.items || []);
        setError("");
      } catch (e) {
        console.error("Failed to load news:", e);
        setError(e?.message || "Failed to load news.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = q
    ? news.filter(
        (n) =>
          n.title?.toLowerCase().includes(q.toLowerCase()) ||
          n.summary?.toLowerCase().includes(q.toLowerCase())
      )
    : news;

  return (
    <>
      {/* HERO stays at the top (yellow band) */}
      <div className="hero">
        <div className="container-hero">
          <header className="header">
            <h1 className="title">PL Pulse</h1>
            <small className="subtitle">React + Node minimal demo</small>
          </header>
        </div>
      </div>

      {/* EVERYTHING BELOW THE HERO gets the background image */}
      <div className="content-bg">
        <div className="container">
          <div className="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles…"
            />
          </div>

          {loading && <p className="status">Loading…</p>}
          {error && <p className="status error">Failed to load news: {error}</p>}
          {!loading && !error && <ArticleList items={filtered} />}
          {!loading && !error && filtered.length === 0 && (
            <p className="status">No results.</p>
          )}
        </div>
      </div>

      <Footer />
    </>

  );
}
