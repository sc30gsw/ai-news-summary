import { Result } from "better-result";
import Parser from "rss-parser";
import { MAX_ITEMS_PER_FEED, MAX_RSS_ARTICLES_TO_SUMMARIZE } from "~/features/news/constants/news";
import type { NewsArticle } from "~/features/news/types/news-schemas";
import { summarizeArticle } from "~/lib/ai";

const parser = new Parser();

type RSSFeed = {
  name: string;
  url: string;
  language: "ja" | "en";
};

const RSS_FEEDS = [
  { name: "Zenn", url: "https://zenn.dev/feed", language: "ja" },
  { name: "Dev.to", url: "https://dev.to/feed", language: "en" },
  { name: "Qiita", url: "https://qiita.com/popular-items/feed", language: "ja" },
  { name: "CSS-Tricks", url: "https://css-tricks.com/feed/", language: "en" },
] as const satisfies readonly RSSFeed[];

async function fetchFeed(feed: RSSFeed) {
  const result = await Result.tryPromise(async () => {
    const parsed = await parser.parseURL(feed.url);

    return parsed.items.slice(0, MAX_ITEMS_PER_FEED).map((item) => ({
      title: item.title || "No title",
      link: item.link || "",
      content: item.contentSnippet || item.content || "",
      pubDate: item.pubDate || new Date().toISOString(),
      feedName: feed.name,
    }));
  });

  if (Result.isError(result)) {
    console.error(`Failed to fetch RSS feed: ${feed.name}`, result.error);
    return [];
  }

  return result.value;
}

export async function fetchRSSFeeds() {
  const feedPromises = RSS_FEEDS.map((feed) => fetchFeed(feed));
  const feedResults = await Promise.all(feedPromises);

  const allItems = feedResults.flat();

  const techKeywords = [
    // AI
    "ai",
    "llm",
    "gpt",
    "claude",
    "openai",
    "machine learning",
    // Frontend
    "react",
    "vue",
    "svelte",
    "angular",
    "next",
    "typescript",
    "javascript",
    "frontend",
    // Backend
    "node",
    "bun",
    "deno",
    "rust",
    "go",
    "python",
    "hono",
    "elysia",
    "backend",
    "api",
    // Infra
    "docker",
    "kubernetes",
    "supabase",
    "convex",
    "turso",
    "neon",
    "vercel",
    "cloud",
    // Mobile
    "react native",
    "flutter",
    "swift",
    "kotlin",
    "ios",
    "android",
    "mobile",
    "expo",
  ] as const satisfies readonly string[];

  const filteredItems = allItems.filter((item) => {
    const text = `${item.title} ${item.content}`.toLowerCase();
    return techKeywords.some((keyword) => text.includes(keyword));
  });

  const articles: NewsArticle[] = [];

  for (const item of filteredItems.slice(0, MAX_RSS_ARTICLES_TO_SUMMARIZE)) {
    const articleResult = await Result.tryPromise(async () => {
      const article = await summarizeArticle(
        item.title,
        item.content,
        item.link,
        "rss",
        item.feedName,
      );
      return {
        ...article,
        publishedAt: new Date(item.pubDate).toISOString(),
      };
    });

    if (Result.isError(articleResult)) {
      console.error(`Failed to summarize RSS item: ${item.title}`, articleResult.error);
      continue;
    }

    articles.push(articleResult.value);
  }

  return articles;
}
