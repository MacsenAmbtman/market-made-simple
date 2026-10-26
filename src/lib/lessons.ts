export const lessons = [
  { slug: "what-is-a-stock", title: "What is a Stock?", minutes: 4, emoji: "🧩", blurb: "Owning a tiny slice of a real company." },
  { slug: "compound-interest", title: "Compound Interest Magic", minutes: 5, emoji: "✨", blurb: "How money grows on its own growth." },
  { slug: "index-vs-single", title: "Index Funds vs. Single Stocks", minutes: 6, emoji: "🧺", blurb: "One basket or one egg?" },
  { slug: "first-share", title: "How to Buy Your First Share", minutes: 5, emoji: "🛒", blurb: "From app download to first order." },
  { slug: "risk-basics", title: "Risk Without the Fear", minutes: 4, emoji: "🎢", blurb: "Why prices wiggle — and why that's okay." },
  { slug: "dividends", title: "Dividends Explained", minutes: 3, emoji: "💸", blurb: "Getting paid just for holding." },
];

const KEY = "stockify-completed";
export function getCompleted(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function markCompleted(slug: string) {
  const c = new Set(getCompleted()); c.add(slug);
  localStorage.setItem(KEY, JSON.stringify([...c]));
}
