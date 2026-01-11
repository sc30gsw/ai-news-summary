import { Elysia } from "elysia";
import { all } from "better-all";
import { curateNews, fetchAndSummarizeNews } from "~/lib/ai";
import { fetchRSSFeeds } from "~/lib/rss";
import { saveNews } from "~/lib/kv";

export const cronPlugin = new Elysia({ prefix: "/cron", name: "cron" }).get(
  "/fetch-news",
  async ({ request, set }) => {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { aiNews, rssNews } = await all({
      async aiNews() {
        return fetchAndSummarizeNews().catch(() => []);
      },
      async rssNews() {
        return fetchRSSFeeds().catch(() => []);
      },
    });

    const allNews = [...aiNews, ...rssNews];

    const uniqueNews = allNews.filter(
      (article, index, self) =>
        index === self.findIndex((a) => a.originalUrl === article.originalUrl),
    );

    const sortedNews = uniqueNews.sort(
      (a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime(),
    );

    const curatedNews = await curateNews(sortedNews);

    await saveNews(curatedNews);

    return {
      success: true,
      count: curatedNews.length,
      timestamp: new Date().toISOString(),
    };
  },
  {
    detail: {
      summary: "Fetch and curate news",
      description: "Cron job endpoint to fetch news from all sources and curate top 20 articles",
      tags: ["Cron"],
    },
  },
);
