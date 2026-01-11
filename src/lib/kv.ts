import { kv } from "@vercel/kv";
import type { NewsArticle } from "~/features/news/types/news-schemas";

const NEWS_KEY = "curated-news";
const LAST_UPDATED_KEY = "news-last-updated";

export async function saveNews(articles: NewsArticle[]) {
  await kv.set(NEWS_KEY, articles);
  await kv.set(LAST_UPDATED_KEY, new Date().toISOString());
}

export async function getNews() {
  return (await kv.get<NewsArticle[]>(NEWS_KEY)) ?? [];
}

export async function getLastUpdated() {
  return kv.get<string>(LAST_UPDATED_KEY);
}
