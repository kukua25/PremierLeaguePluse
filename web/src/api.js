/**
 * Dev uses the Vite proxy: /api/* -> http://localhost:5050
 * No env vars needed. In production you'll use absolute URLs.
 */
export async function fetchNews() {
  const url = `/api/news`; // relative: Vite forwards to Node during dev
  console.log("[fetchNews] GET", url);
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    console.error("[fetchNews] network error:", e);
    throw new Error("Network error contacting API via dev proxy");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[fetchNews] bad status:", res.status, text);
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
}
