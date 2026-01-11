import type { Category, Source } from "~/features/news/types/schemas";

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
