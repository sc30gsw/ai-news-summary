import type { Category, Source } from "~/features/news/types/news-schemas";

export const CATEGORY_LABELS = {
  all: "すべて",
  ai: "AI",
  frontend: "Frontend",
  backend: "Backend",
  infra: "Infra",
  mobile: "Mobile",
} as const satisfies Record<Category, string>;

export const SOURCE_LABELS = {
  x: "X (Twitter)",
  web: "Web",
  rss: "RSS",
} as const satisfies Record<Source, string>;

//? Limits for performance optimization
//? カテゴリごと約10件を目標（5カテゴリ × 10 = 50件）
export const MAX_ITEMS_PER_FEED = 8;
export const MAX_RSS_ARTICLES_TO_SUMMARIZE = 20;
export const MAX_SEARCH_RESULTS = 8;
export const MAX_ARTICLES_TO_SUMMARIZE = 30;
