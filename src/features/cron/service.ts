import { curateNews } from "~/lib/ai";
import { saveNews } from "~/lib/kv";
import { fetchRSSFeeds } from "~/lib/rss";
import type { CronApiModel } from "./model";

export abstract class CronService {
  static async fetchAndCurateNews(): Promise<CronApiModel.CuratedNews> {
    const rssNews = await fetchRSSFeeds().catch(() => []);

    const uniqueNews = rssNews.filter(
      (article, index, self) =>
        index === self.findIndex((a) => a.originalUrl === article.originalUrl),
    );

    const sortedNews = uniqueNews.sort(
      (a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime(),
    );

    const curatedNews = await curateNews(sortedNews);

    return curatedNews;
  }

  static async saveNews(news: CronApiModel.CuratedNews): Promise<void> {
    await saveNews(news);
  }
}
