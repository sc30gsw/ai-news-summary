import { format } from "@formkit/tempo";
import { kv } from "@vercel/kv";
import { DATE_FORMAT } from "~/constants";
import type { NewsArticle } from "~/features/news/types/news-schemas";

const NEWS_KEY = "curated-news";
const LAST_UPDATED_KEY = "news-last-updated";

export async function saveNews(articles: NewsArticle[]) {
  await kv.set(NEWS_KEY, articles);
  await kv.set(LAST_UPDATED_KEY, format(new Date(), DATE_FORMAT));
}

export async function getNews() {
  return (await kv.get<NewsArticle[]>(NEWS_KEY)) ?? [];
}

export async function getLastUpdated() {
  return kv.get<string>(LAST_UPDATED_KEY);
}
