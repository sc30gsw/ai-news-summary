import type { Category, Source } from "~/features/news/types/schemas";

export const CATEGORY_LABELS = {
  all: "すべて",
  "ai-ml": "AI/ML",
  "react-frontend": "React/Frontend",
  typescript: "TypeScript",
  backend: "Backend",
  tools: "Tools",
} as const satisfies Record<Category, string>;

export const SOURCE_LABELS = {
  x: "X (Twitter)",
  web: "Web",
  rss: "RSS",
} as const satisfies Record<Source, string>;
