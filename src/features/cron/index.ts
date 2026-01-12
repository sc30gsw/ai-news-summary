import { format } from "@formkit/tempo";
import { Elysia } from "elysia";
import { DATE_FORMAT } from "~/constants";
import type { CronApiModel } from "./model";
import { CronService } from "./service";

export const cronPlugin = new Elysia({ prefix: "/cron", name: "cron" }).get(
  "/fetch-news",
  async ({ request, set }): Promise<CronApiModel.FetchNewsResponse> => {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const curatedNews = await CronService.fetchAndCurateNews();

    await CronService.saveNews(curatedNews);

    return {
      success: true,
      count: curatedNews.length,
      timestamp: format(new Date(), DATE_FORMAT),
    };
  },
  {
    detail: {
      summary: "Fetch and curate news",
      description:
        "Cron job endpoint to fetch news from RSS feeds and curate ~50 articles (about 10 per category)",
      tags: ["Cron"],
    },
  },
);
