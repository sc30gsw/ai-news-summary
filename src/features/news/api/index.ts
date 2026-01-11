import { Elysia } from "elysia";
import * as v from "valibot";
import { NewsFetchError, ValidationError } from "~/features/news/api/error";
import { NewsApiModel } from "~/features/news/api/model";
import { NewsService } from "~/features/news/api/service";

export const newsPlugin = new Elysia({ prefix: "/news", name: "news" })
  .error({
    NewsFetchError,
    ValidationError,
  })
  .onError(({ code, error, set }) => {
    switch (code) {
      case "NewsFetchError":
        set.status = error.status;
        return { error: error.message, code: "FETCH_ERROR" };

      case "ValidationError":
        set.status = error.status;
        return { error: error.message, code: "VALIDATION_ERROR" };

      default:
        throw error;
    }
  })
  .get(
    "/",
    async ({ query }) => {
      const parsed = v.safeParse(NewsApiModel.listQuerySchema, query);

      if (!parsed.success) {
        throw new ValidationError("Invalid query parameters");
      }

      const articles = await NewsService.fetchAll(parsed.output.category);

      return articles;
    },
    {
      detail: {
        summary: "Get news articles",
        description: "Fetch all news articles with optional category filter",
        tags: ["News"],
      },
    },
  );
