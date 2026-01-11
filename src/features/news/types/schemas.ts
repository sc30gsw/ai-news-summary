import * as v from "valibot";

export const CategorySchema = v.picklist(["all", "ai", "frontend", "backend", "infra", "mobile"]);

export type Category = v.InferOutput<typeof CategorySchema>;

export const SourceSchema = v.picklist(["x", "web", "rss"]);

export type Source = v.InferOutput<typeof SourceSchema>;

export const NewsArticleSchema = v.object({
  id: v.string(),
  title: v.string(),
  summary: v.string(),
  originalUrl: v.pipe(v.string(), v.url()),
  source: SourceSchema,
  category: CategorySchema,
  publishedAt: v.string(),
  fetchedAt: v.string(),
  citations: v.optional(v.array(v.string())),
  feedName: v.optional(v.string()),
});

export type NewsArticle = v.InferOutput<typeof NewsArticleSchema>;

export const NewsListSchema = v.array(NewsArticleSchema);

export type NewsList = v.InferOutput<typeof NewsListSchema>;
