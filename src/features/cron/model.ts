import type { NewsArticle } from "~/features/news/types/news-schemas";

export namespace CronApiModel {
  export type FetchNewsResponse =
    | {
        success: true;
        count: number;
        timestamp: string;
      }
    | {
        error: string;
      };

  export type CuratedNews = NewsArticle[];
}
