import { all } from "better-all";
import type { NewsApiModel } from "~/features/news/api/model";
import { fetchAndSummarizeNews } from "~/lib/ai";
import { fetchRSSFeeds } from "~/lib/rss";

export abstract class NewsService {
  static async fetchAll(category?: NewsApiModel.categoryFilter) {
    const { aiNews, rssNews } = await all({
      async aiNews() {
        return fetchAndSummarizeNews().catch(() => []);
      },
      async rssNews() {
        return fetchRSSFeeds().catch(() => []);
      },
    });

    let allNews = [...aiNews, ...rssNews];

    allNews = allNews.filter(
      (article, index, self) =>
        index === self.findIndex((a) => a.originalUrl === article.originalUrl),
    );

    if (category && category !== "all") {
      allNews = allNews.filter((article) => article.category === category);
    }

    allNews.sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());

    return allNews;
  }
}
