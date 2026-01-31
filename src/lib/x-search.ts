import { xai } from "@ai-sdk/xai";
import { format } from "@formkit/tempo";
import { generateText } from "ai";
import { Result } from "better-result";
import pLimit from "p-limit";
import { DATE_FORMAT } from "~/constants";
import type { Category, NewsArticle } from "~/features/news/types/news-schemas";

//? 並列処理の同時実行数（API rate limit考慮）
const CONCURRENCY_LIMIT = 2;

//? カテゴリごとの取得上限
const MAX_ARTICLES_PER_CATEGORY = 5;

const ARRAY_START_INDEX = 0;
const FIRST_ARRAY_ELEMENT = 0;

//? xAI Live Search model
const XAI_MODEL = "grok-3-latest";

//? カテゴリごとの監視対象 X アカウント
const X_ACCOUNTS_BY_CATEGORY = {
  ai: ["OpenAI", "AnthropicAI", "GoogleAI", "xaboratory", "_akhaliq"],
  frontend: ["reactjs", "vuejs", "svelte", "vercel", "nextjs"],
  backend: ["golang", "rustlang", "hoaboratory", "bunaboratory", "deaboratory"],
  infra: ["supabase", "convex", "turso_tech", "Docker", "kubernetesio"],
  mobile: ["reactnative", "FlutterDev", "Apple", "Android", "expo"],
} as const satisfies Record<Exclude<Category, "all">, readonly string[]>;

//? カテゴリごとの検索クエリ
const SEARCH_QUERIES_BY_CATEGORY = {
  ai: "Latest AI, LLM, machine learning, ChatGPT, Claude news and announcements",
  frontend: "Latest React, Vue, Svelte, Next.js, frontend framework news and releases",
  backend: "Latest Go, Rust, Node.js, Bun, Deno, Hono backend framework news and releases",
  infra: "Latest Supabase, Convex, Turso, Docker, Kubernetes infrastructure news and releases",
  mobile: "Latest React Native, Flutter, iOS, Android, Expo mobile development news",
} as const satisfies Record<Exclude<Category, "all">, string>;

type XSearchResult = {
  title: string;
  summary: string;
  url: string;
  category: Category;
};

async function searchCategoryNews(category: Exclude<Category, "all">): Promise<XSearchResult[]> {
  const accounts = X_ACCOUNTS_BY_CATEGORY[category];
  const query = SEARCH_QUERIES_BY_CATEGORY[category];

  const result = await Result.tryPromise(async () => {
    const { text, sources } = await generateText({
      model: xai(XAI_MODEL),
      prompt: `Search for the latest tech news about: ${query}

Please provide a JSON array of the most important news items. Each item should have:
- title: A concise Japanese title
- summary: A 100-200 character summary in Japanese
- url: The source URL

Respond ONLY with a valid JSON array:
[
  {"title": "...", "summary": "...", "url": "..."},
  ...
]

Return up to ${MAX_ARTICLES_PER_CATEGORY} items. All text must be in Japanese.`,
      providerOptions: {
        xai: {
          searchParameters: {
            mode: "on" as const,
            returnCitations: true,
            maxSearchResults: 10,
            sources: [
              {
                type: "x" as const,
                includedXHandles: [...accounts],
              },
            ],
          },
        },
      },
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      //? sources から URL を抽出してフォールバック
      if (sources && sources.length > ARRAY_START_INDEX) {
        const urlSources = sources
          .filter((source) => source.sourceType === "url")
          .slice(ARRAY_START_INDEX, MAX_ARTICLES_PER_CATEGORY);

        if (urlSources.length > ARRAY_START_INDEX) {
          return urlSources.map((source) => ({
            title: `${category.toUpperCase()} 関連ニュース`,
            summary: `${category} カテゴリの最新情報です。`,
            url: "url" in source ? source.url : "",
            category,
          }));
        }
      }

      throw new Error("No JSON array found in response and no sources");
    }

    const parsed: { title: string; summary: string; url: string }[] = JSON.parse(
      jsonMatch[FIRST_ARRAY_ELEMENT],
    );

    return parsed.slice(ARRAY_START_INDEX, MAX_ARTICLES_PER_CATEGORY).map(
      (item) =>
        ({
          title: item.title,
          summary: item.summary,
          url: item.url,
          category,
        }) satisfies XSearchResult,
    );
  });

  if (Result.isError(result)) {
    console.error(`Failed to search X for category ${category}:`, result.error);
    return [];
  }

  return result.value;
}

export async function fetchXNews(): Promise<NewsArticle[]> {
  const categories = Object.keys(X_ACCOUNTS_BY_CATEGORY) as Array<Exclude<Category, "all">>;

  const limit = pLimit(CONCURRENCY_LIMIT);

  const categoryPromises = categories.map((category) =>
    limit(async () => {
      const results = await searchCategoryNews(category);
      return results;
    }),
  );

  const categoryResults = await Promise.all(categoryPromises);
  const allResults = categoryResults.flat();

  const now = new Date();
  const formattedDate = format(now, DATE_FORMAT);

  const articles: NewsArticle[] = allResults.map((result) => ({
    id: crypto.randomUUID(),
    title: result.title,
    summary: result.summary,
    originalUrl: result.url,
    source: "x" as const,
    category: result.category,
    publishedAt: formattedDate,
    fetchedAt: formattedDate,
  }));

  return articles;
}
