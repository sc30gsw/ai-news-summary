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
  x: "X",
} as const satisfies Record<Source, string>;
