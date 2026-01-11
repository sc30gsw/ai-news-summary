import { Result } from "better-result";
import pLimit from "p-limit";
import Parser from "rss-parser";
import type { NewsArticle } from "~/features/news/types/news-schemas";
import { summarizeArticle } from "~/lib/ai";

//? 並列処理の同時実行数（API rate limit考慮）
const CONCURRENCY_LIMIT = 3;

//? Limits for performance optimization
//? カテゴリごと約4件を目標（5カテゴリ × 4 = 20件）
//? API呼び出し削減のため要約数も制限
const MAX_ITEMS_PER_FEED = 8;
const MAX_RSS_ARTICLES_TO_SUMMARIZE = 25;

const parser = new Parser();

type RSSFeed = {
  name: string;
  url: string;
  language: "ja" | "en";
};

const RSS_FEEDS = [
  //? General
  { name: "Dev.to", url: "https://dev.to/feed", language: "en" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage", language: "en" },
  { name: "Lobsters", url: "https://lobste.rs/rss", language: "en" },
  //? Frontend
  { name: "CSS-Tricks", url: "https://css-tricks.com/feed/", language: "en" },
  { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", language: "en" },
  //? Mobile
  { name: "React Native", url: "https://reactnative.dev/blog/rss.xml", language: "en" },
  { name: "Flutter", url: "https://medium.com/feed/flutter", language: "en" },
  //? Infra / BaaS / DBaaS
  { name: "Vercel Blog", url: "https://vercel.com/atom", language: "en" },
  { name: "Supabase Blog", url: "https://supabase.com/blog/rss.xml", language: "en" },
  { name: "Convex Blog", url: "https://blog.convex.dev/rss/", language: "en" },
  { name: "Turso Blog", url: "https://turso.tech/blog/rss.xml", language: "en" },
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

  const limit = pLimit(CONCURRENCY_LIMIT);

  const articlePromises = filteredItems.slice(0, MAX_RSS_ARTICLES_TO_SUMMARIZE).map((item) =>
    limit(async () => {
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
        return null;
      }

      return articleResult.value;
    }),
  );

  const results = await Promise.all(articlePromises);
  const articles: NewsArticle[] = results.filter((article) => article !== null);

  return articles;
}
