import type { NewsApiModel } from "~/features/news/api/model";
import { getNews } from "~/lib/kv";

export abstract class NewsService {
  static async fetchAll(category?: NewsApiModel.categoryFilter) {
    let news = await getNews();

    if (category && category !== "all") {
      news = news.filter((article) => article.category === category);
    }

    return news;
  }
}
