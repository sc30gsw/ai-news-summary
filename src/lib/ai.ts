import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { all } from "better-all";
import { Result } from "better-result";
import type { Category, NewsArticle } from "~/features/news/types/schemas";

const SEARCH_TOPICS = [
  "AI artificial intelligence",
  "React Next.js TanStack",
  "TypeScript programming",
  "Hono Elysia backend",
  "web development trends",
] as const satisfies readonly string[];

type SearchResult = Pick<NewsArticle, "title" | "source"> & Record<"content" | "url", string>;

export async function fetchFromX() {
  const results: SearchResult[] = [];

  for (const topic of SEARCH_TOPICS) {
    const result = await Result.tryPromise(async () => {
      const { text, sources } = await generateText({
        model: xai("grok-4.1"),
        prompt: `Search X (Twitter) for the latest news and discussions about: ${topic}.
                 Return the most relevant and recent posts from the last 24 hours.
                 Focus on technical announcements, library releases, and developer insights.`,
        providerOptions: {
          xai: {
            searchParameters: {
              mode: "on",
              returnCitations: true,
              maxSearchResults: 5,
              sources: [
                {
                  type: "x",
                },
              ],
            },
          },
        },
      });

      return { text, sources };
    });

    if (Result.isError(result)) {
      console.error(`Failed to fetch X results for ${topic}:`, result.error);

      continue;
    }

    const { text, sources } = result.value;

    if (sources && Array.isArray(sources)) {
      for (const source of sources) {
        if ("url" in source && "title" in source) {
          results.push({
            title: source.title || topic,
            url: source.url,
            content: text,
            source: "x",
          });
        }
      }
    }
  }

  return results;
}

export async function fetchFromWeb() {
  const results: SearchResult[] = [];

  for (const topic of SEARCH_TOPICS) {
    const result = await Result.tryPromise(async () => {
      const { text, sources } = await generateText({
        model: xai("grok-4.1"),
        prompt: `Search the web for the latest news about: ${topic}.
                 Return the most recent and relevant articles from tech blogs and news sites.
                 Focus on announcements, tutorials, and industry trends from the last week.`,
        providerOptions: {
          xai: {
            searchParameters: {
              mode: "on",
              returnCitations: true,
              maxSearchResults: 5,
              sources: [
                {
                  type: "web",
                  allowedWebsites: ["dev.to", "medium.com", "vercel.com"],
                },
                {
                  type: "news",
                },
              ],
            },
          },
        },
      });

      return { text, sources };
    });

    if (Result.isError(result)) {
      console.error(`Failed to fetch web results for ${topic}:`, result.error);

      continue;
    }

    const { text, sources } = result.value;
    if (sources && Array.isArray(sources)) {
      for (const source of sources) {
        if ("url" in source && "title" in source) {
          results.push({
            title: source.title || topic,
            url: source.url,
            content: text,
            source: "web",
          });
        }
      }
    }
  }

  return results;
}

export async function summarizeArticle(
  title: SearchResult["title"],
  content: SearchResult["content"],
  url: SearchResult["url"],
  source: SearchResult["source"],
) {
  const { text } = await generateText({
    model: xai("grok-4-1"),
    prompt: `以下の記事を日本語で要約してください。

タイトル: ${title}
URL: ${url}
内容: ${content}

以下のJSON形式で回答してください:
{
  "title": "日本語のタイトル",
  "summary": "200-300文字の日本語要約",
  "category": "ai-ml" | "react-frontend" | "typescript" | "backend" | "tools" のいずれか
}

カテゴリの選択基準:
- ai-ml: AI、機械学習、LLM、ChatGPT関連
- react-frontend: React、Next.js、Vue、フロントエンド関連
- typescript: TypeScript、型システム関連
- backend: Node.js、Hono、Elysia、API、サーバーサイド関連
- tools: 開発ツール、ライブラリ、その他`,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parseResult: Result<
    { title: SearchResult["title"]; summary: NewsArticle["summary"]; category: Category },
    Error
  > = Result.try(() => {
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    return JSON.parse(jsonMatch[0]);
  });

  const parsed = parseResult.unwrapOr({
    title: title,
    summary: content.slice(0, 300),
    category: "tools" as Category,
  });

  return {
    id: crypto.randomUUID(),
    title: parsed.title,
    summary: parsed.summary,
    originalUrl: url,
    source,
    category: parsed.category,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  } as const satisfies NewsArticle;
}

export async function fetchAndSummarizeNews() {
  const { xResults, webResults } = await all({
    async xResults() {
      return fetchFromX().catch(() => [] as SearchResult[]);
    },
    async webResults() {
      return fetchFromWeb().catch(() => [] as SearchResult[]);
    },
  });

  const allResults = [...xResults, ...webResults];

  const uniqueResults = allResults.filter(
    (result, index, self) => index === self.findIndex((r) => r.url === result.url),
  );

  const articles: NewsArticle[] = [];

  for (const result of uniqueResults.slice(0, 20)) {
    const articleResult = await Result.tryPromise(async () => {
      return await summarizeArticle(result.title, result.content, result.url, result.source);
    });

    if (Result.isError(articleResult)) {
      console.error(`Failed to summarize article: ${result.title}`, articleResult.error);
      continue;
    }

    articles.push(articleResult.value);
  }

  return articles;
}
