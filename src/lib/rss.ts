import { Result } from "better-result";
import Parser from "rss-parser";
import type { NewsArticle } from "~/features/news/types/schemas";
import { summarizeArticle } from "~/lib/ai";

const parser = new Parser();

type RSSFeed = {
  name: string;
  url: string;
  language: "ja" | "en";
};

const RSS_FEEDS = [
  { name: "Zenn", url: "https://zenn.dev/feed", language: "ja" },
  {
    name: "Qiita",
    url: "https://qiita.com/popular-items/feed",
    language: "ja",
  },
  { name: "Dev.to", url: "https://dev.to/feed", language: "en" },
  {
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
    language: "en",
  },
] as const satisfies readonly RSSFeed[];

async function fetchFeed(feed: RSSFeed) {
  const result = await Result.tryPromise(async () => {
    const parsed = await parser.parseURL(feed.url);

    return parsed.items.slice(0, 5).map((item) => ({
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
    "react",
    "next",
    "typescript",
    "javascript",
    "ai",
    "llm",
    "gpt",
    "node",
    "bun",
    "deno",
    "rust",
    "go",
    "python",
    "frontend",
    "backend",
    "api",
    "web",
    "tanstack",
    "hono",
    "elysia",
  ] as const satisfies readonly string[];

  const filteredItems = allItems.filter((item) => {
    const text = `${item.title} ${item.content}`.toLowerCase();
    return techKeywords.some((keyword) => text.includes(keyword));
  });

  const articles: NewsArticle[] = [];

  for (const item of filteredItems.slice(0, 10)) {
    const articleResult = await Result.tryPromise(async () => {
      const article = await summarizeArticle(item.title, item.content, item.link, "rss");
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
