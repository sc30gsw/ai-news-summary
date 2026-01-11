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
  web: "Web",
  rss: "RSS",
} as const satisfies Record<Source, string>;

//? Limits for performance optimization
//? カテゴリごと約10件を目標（5カテゴリ × 10 = 50件）
//? xAI APIが不安定なため、RSSをメインソースとして多めに取得
export const MAX_ITEMS_PER_FEED = 15;
export const MAX_RSS_ARTICLES_TO_SUMMARIZE = 60;
export const MAX_SEARCH_RESULTS = 10;
export const MAX_ARTICLES_TO_SUMMARIZE = 40;
