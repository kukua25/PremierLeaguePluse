/**
 * Clickable cards:
 * - Clicking anywhere on the card opens the ORIGINAL article (new tab)
 * - Keyboard accessible (Enter/Space) via role="link" + tabIndex
 */
import React from "react";

export default function ArticleList({ items }) {
  const openArticle = (url) => {
    // Open in a new tab securely (no access back via window.opener)
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid">
      {items.map((a) => (
        <article
          key={a.id}
          className="card"
          role="link"
          tabIndex={0}
          onClick={() => openArticle(a.link)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openArticle(a.link);
            }
          }}
          aria-label={a.title}
          title={a.title}
        >
          {/* No nested <a>; the entire card is the link now */}
          <h3>{a.title}</h3>
          <p className="summary">{a.summary}</p>
          <div className="meta">
            <span>{a.source?.toUpperCase()}</span>{" • "}
            <time dateTime={a.publishedAt}>
              {new Date(a.publishedAt).toLocaleString()}
            </time>
          </div>
        </article>
      ))}
    </div>
  );
}
