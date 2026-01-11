import { gateway, generateText } from "ai";
import { all } from "better-all";
import { Result } from "better-result";
import type { Category, NewsArticle } from "~/features/news/types/schemas";

type SearchResult = Pick<NewsArticle, "title" | "source"> & Record<"content" | "url", string>;

//? Vercel AI Gateway model IDs
//? See: https://vercel.com/ai-gateway/models
const GROK_SEARCH_MODEL = "xai/grok-4-fast-non-reasoning" as const;
const GROK_SUMMARIZE_MODEL = "xai/grok-4.1-fast-non-reasoning" as const;

// Limits for performance optimization
const MAX_SEARCH_RESULTS = 3;
const MAX_ARTICLES_TO_SUMMARIZE = 8;

const SEARCH_TOPICS = [
  "AI artificial intelligence LLM",
  "React TypeScript frontend",
  "backend Node.js Hono",
] as const satisfies readonly string[];

const PROMPTS = {
  searchX: (topic: string) =>
    `Search X (Twitter) for the latest news and discussions about: ${topic}.
Return the most relevant and recent posts from the last 24 hours.
Focus on technical announcements, library releases, and developer insights.
Respond in Japanese.`,

  searchWeb: (topic: string) =>
    `Search the web for the latest news about: ${topic}.
Return the most recent and relevant articles from tech blogs and news sites.
Focus on announcements, tutorials, and industry trends from the last week.
Respond in Japanese.`,

  summarize: (
    title: SearchResult["title"],
    url: SearchResult["url"],
    content: SearchResult["content"],
  ) =>
    `Summarize the following article in Japanese.

Title: ${title}
URL: ${url}
Content: ${content}

Respond in the following JSON format:
{
  "title": "Japanese title",
  "summary": "200-300 character summary in Japanese",
  "category": "ai-ml" | "react-frontend" | "typescript" | "backend" | "tools" (choose one)
}

Category selection criteria:
- ai-ml: AI, machine learning, LLM, ChatGPT related
- react-frontend: React, Next.js, Vue, frontend related
- typescript: TypeScript, type system related
- backend: Node.js, Hono, Elysia, API, server-side related
- tools: Development tools, libraries, others

Important: All text output must be in Japanese.`,

  curate: (articlesJson: string) =>
    `You are a senior tech editor curating a daily newsletter for software engineers.

From the following articles, select exactly 20 that engineers MUST know about.

Selection criteria (in priority order):
1. Major framework/library releases (React, Next.js, TypeScript, Node.js, etc.)
2. Breaking changes or security vulnerabilities
3. New AI/LLM developments affecting developers
4. Significant industry announcements
5. Practical tutorials and best practices
6. Developer tool updates

Articles:
${articlesJson}

Respond with a JSON array of the selected article IDs in order of importance:
["id1", "id2", "id3", ...]

Return exactly 20 IDs. If fewer than 20 articles are provided, return all of them.`,
};

export async function fetchFromX() {
  const results: SearchResult[] = [];

  for (const topic of SEARCH_TOPICS) {
    const result = await Result.tryPromise(async () => {
      const { text, sources } = await generateText({
        model: gateway(GROK_SEARCH_MODEL),
        prompt: PROMPTS.searchX(topic),
        providerOptions: {
          xai: {
            searchParameters: {
              mode: "on",
              returnCitations: true,
              maxSearchResults: MAX_SEARCH_RESULTS,
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
        model: gateway(GROK_SEARCH_MODEL),
        prompt: PROMPTS.searchWeb(topic),
        providerOptions: {
          xai: {
            searchParameters: {
              mode: "on",
              returnCitations: true,
              maxSearchResults: MAX_SEARCH_RESULTS,
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
    model: gateway(GROK_SUMMARIZE_MODEL),
    prompt: PROMPTS.summarize(title, url, content),
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

  for (const result of uniqueResults.slice(0, MAX_ARTICLES_TO_SUMMARIZE)) {
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

const MAX_CURATED_ARTICLES = 20;

export async function curateNews(articles: NewsArticle[]): Promise<NewsArticle[]> {
  if (articles.length <= MAX_CURATED_ARTICLES) {
    return articles;
  }

  const articlesForCuration = articles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    category: article.category,
    source: article.source,
  }));

  const result = await Result.tryPromise(async () => {
    const { text } = await generateText({
      model: gateway(GROK_SUMMARIZE_MODEL),
      prompt: PROMPTS.curate(JSON.stringify(articlesForCuration)),
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("No JSON array found in curation response");
    }

    const selectedIds: string[] = JSON.parse(jsonMatch[0]);

    return selectedIds;
  });

  if (Result.isError(result)) {
    console.error("Failed to curate news:", result.error);
    return articles.slice(0, MAX_CURATED_ARTICLES);
  }

  const selectedIds = result.value;
  const curatedArticles = selectedIds
    .map((id) => articles.find((article) => article.id === id))
    .filter((article): article is NewsArticle => article !== undefined);

  return curatedArticles.slice(0, MAX_CURATED_ARTICLES);
}
