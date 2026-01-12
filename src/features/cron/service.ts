import { isBefore } from "@formkit/tempo";
import { curateNews } from "~/lib/ai";
import { getNews, saveNews } from "~/lib/kv";
import { fetchRSSFeeds } from "~/lib/rss";
import type { CronApiModel } from "./model";

const SORT_ORDER_AFTER = 1;
const SORT_ORDER_BEFORE = -1;
const SORT_ORDER_EQUAL = 0;

export abstract class CronService {
  static async fetchAndCurateNews() {
    const rssNews = await fetchRSSFeeds().catch(() => []);

    const existingNews = await getNews().catch(() => []);

    const uniqueNews = rssNews.filter(
      (article, index, self) =>
        index === self.findIndex((a) => a.originalUrl === article.originalUrl),
    );

    const sortedNews = uniqueNews.sort((a, b) => {
      if (isBefore(a.fetchedAt, b.fetchedAt)) {
        return SORT_ORDER_AFTER;
      }

      if (isBefore(b.fetchedAt, a.fetchedAt)) {
        return SORT_ORDER_BEFORE;
      }

      return SORT_ORDER_EQUAL;
    });

    const curatedNews = await curateNews(sortedNews, existingNews);

    return curatedNews;
  }

  static async saveNews(news: CronApiModel.CuratedNews) {
    await saveNews(news);
  }
}
