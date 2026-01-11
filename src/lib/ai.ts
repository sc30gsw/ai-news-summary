import { gateway, generateText } from "ai";
import { all } from "better-all";
import { Result } from "better-result";
import { MAX_ARTICLES_TO_SUMMARIZE, MAX_SEARCH_RESULTS } from "~/features/news/constants/news";
import type { Category, NewsArticle } from "~/features/news/types/news-schemas";

type SearchResult = Pick<NewsArticle, "title" | "source"> & Record<"content" | "url", string>;

//? Vercel AI Gateway model IDs
//? See: https://vercel.com/ai-gateway/models
const GROK_SEARCH_MODEL = "xai/grok-4-fast-non-reasoning";
const GROK_SUMMARIZE_MODEL = "xai/grok-4.1-fast-non-reasoning";

const SEARCH_TOPICS = [
  // AI (10件目標)
  "AI LLM GPT Claude OpenAI Anthropic machine learning",
  // Frontend (8件目標)
  "React Vue Svelte Angular frontend UI component library",
  // Backend (6件目標)
  "Go Rust Python Node.js backend API microservices",
  // Infra (6件目標)
  "Convex Turso Supabase Neon PlanetScale Docker Kubernetes cloud",
  // Mobile (5件目標)
  "React Native Flutter Swift Kotlin iOS Android mobile",
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
  "category": "ai" | "frontend" | "backend" | "infra" | "mobile" (choose one)
}

Category selection criteria:
- ai: AI, LLM, machine learning, deep learning, ChatGPT, Claude, AI agents (any language)
- frontend: React, Vue, Svelte, Angular, UI libraries, web frontend, TypeScript frontend
- backend: Go, Rust, Python, Node.js, Java, Hono, Elysia, API, microservices, server-side
- infra: DBaaS, BaaS, cloud services, Docker, Kubernetes, Convex, Turso, Supabase, Neon
- mobile: React Native, Flutter, Swift, Kotlin, iOS, Android, mobile apps

Important: All text output must be in Japanese.`,

  curate: (articlesJson: string) =>
    `You are a senior tech editor curating a daily newsletter for software engineers.

From the following articles, select exactly 20 that engineers MUST know about.
Rank them from 1 (most important) to 20 (least important among selected).

Selection and ranking criteria (in priority order):
1. AI/LLM announcements and developments (highest priority - typically rank 1-5)
2. Frontend framework releases (React, Vue, Svelte, Angular, UI libraries - typically rank 6-10)
3. Backend framework/runtime updates (Go, Rust, Python, Node.js, Hono - typically rank 11-14)
4. Infrastructure services (DBaaS, BaaS, Convex, Turso, Supabase, Docker, K8s - typically rank 15-17)
5. Mobile development (React Native, Flutter, Swift, Kotlin - typically rank 18-20)
6. Breaking changes or security vulnerabilities (can boost any article to top 5)

Articles:
${articlesJson}

Respond with a JSON array of the selected article IDs in order of importance (rank 1 first):
["id1", "id2", "id3", ...]

Return exactly 20 IDs in ranked order. If fewer than 20 articles are provided, return all of them in ranked order.`,
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
  feedName?: string,
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
    category: "frontend" as Category,
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
    feedName,
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
  // 20件以下の場合もランキングを付与
  if (articles.length <= MAX_CURATED_ARTICLES) {
    return articles.map((article, index) => ({
      ...article,
      rank: index + 1,
    }));
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
    return articles.slice(0, MAX_CURATED_ARTICLES).map((article, index) => ({
      ...article,
      rank: index + 1,
    }));
  }

  const selectedIds = result.value;

  const curatedArticles: NewsArticle[] = [];

  for (const [index, id] of selectedIds.entries()) {
    const article = articles.find((a) => a.id === id);

    if (article) {
      curatedArticles.push({ ...article, rank: index + 1 });
    }
  }

  return curatedArticles.slice(0, MAX_CURATED_ARTICLES);
}
