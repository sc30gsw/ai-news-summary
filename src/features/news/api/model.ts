import * as v from "valibot";

export namespace NewsApiModel {
  export const categoryFilterSchema = v.picklist([
    "all",
    "ai-ml",
    "react-frontend",
    "typescript",
    "backend",
    "tools",
  ]);
  export type categoryFilter = v.InferOutput<typeof categoryFilterSchema>;

  export const sourceSchema = v.picklist(["x", "web", "rss"]);
  export type source = v.InferOutput<typeof sourceSchema>;

  export const categorySchema = v.picklist([
    "ai-ml",
    "react-frontend",
    "typescript",
    "backend",
    "tools",
  ]);
  export type category = v.InferOutput<typeof categorySchema>;

  export const listQuerySchema = v.object({
    category: v.optional(categoryFilterSchema),
  });
  export type listQuery = v.InferOutput<typeof listQuerySchema>;

  export const articleResponseSchema = v.object({
    id: v.string(),
    title: v.string(),
    summary: v.string(),
    originalUrl: v.pipe(v.string(), v.url()),
    source: sourceSchema,
    category: categorySchema,
    publishedAt: v.string(),
    fetchedAt: v.string(),
    citations: v.optional(v.array(v.string())),
  });
  export type articleResponse = v.InferOutput<typeof articleResponseSchema>;

  export const listResponseSchema = v.array(articleResponseSchema);
  export type listResponse = v.InferOutput<typeof listResponseSchema>;

  export type FetchAllRequestParams = {
    category?: categoryFilter;
  };
}
