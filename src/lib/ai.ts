import { gateway, generateText } from "ai";
import { Result } from "better-result";
import { format } from "@formkit/tempo";
import type { Category, NewsArticle, Source } from "~/features/news/types/news-schemas";
import { DATE_FORMAT } from "~/constants";

//? Vercel AI Gateway model IDs
//? See: https://vercel.com/ai-gateway/models
const AI_MODEL = "google/gemini-3-flash";
const MAX_CURATED_ARTICLES = 20;
const MAX_SUMMARY_LENGTH = 300;
const DEFAULT_CATEGORY = "frontend";

const RANK_START = 1;
const ARRAY_START_INDEX = 0;
const DEFAULT_COUNTER_VALUE = 0;
const EMPTY_ARRAY_LENGTH = 0;
const FIRST_ARRAY_ELEMENT = 0;

const PROMPTS = {
  summarize: (title: string, url: string, content: string) =>
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

  curate: (articlesJson: string, existingNewsJson?: string) => {
    const existingNewsSection = existingNewsJson
      ? `\n\nCRITICAL EXCLUSION RULE: The following articles have already been published in previous newsletters. You MUST NOT select any of these articles under any circumstances. Compare the URL or title carefully to avoid duplicates. If you select any of these existing articles, your selection will be invalid:\n${existingNewsJson}\n\nIMPORTANT: Only select NEW articles that are NOT in the exclusion list above.`
      : "";

    return `You are a senior tech editor curating a daily newsletter for software engineers.

From the following articles, select exactly 20 NEW articles that engineers MUST know about.
IMPORTANT: Ensure at least 1 article from EACH category (ai, frontend, backend, infra, mobile) if available.
Distribute remaining articles based on importance and quality.
Rank them from 1 (most important) to 20.${existingNewsSection}
Selection and ranking criteria (in priority order):
1. AI/LLM announcements and developments (highest priority - select 3-5 articles)
2. Frontend framework releases (React, Vue, Svelte, Angular, UI libraries - select 3-5 articles)
3. Backend framework/runtime updates (Go, Rust, Python, Node.js, Hono - select 3-5 articles)
4. Infrastructure services (DBaaS, BaaS, Convex, Turso, Supabase, Docker, K8s - select 3-5 articles)
5. Mobile development (React Native, Flutter, Swift, Kotlin - select 3-5 articles)
6. Breaking changes or security vulnerabilities (can boost any article to top 5)

Articles:
${articlesJson}

Respond with a JSON array of the selected article IDs in order of importance (rank 1 first):
["id1", "id2", "id3", ...]

IMPORTANT: Select exactly 20 articles if 20 or more are available. If fewer than 20 articles are provided, return all available articles in ranked order. Only select NEW articles that are NOT in the exclusion list.`;
  },
};

export async function summarizeArticle(
  title: string,
  content: string,
  url: string,
  source: Source,
  feedName?: string,
) {
  const { text } = await generateText({
    model: gateway(AI_MODEL),
    prompt: PROMPTS.summarize(title, url, content),
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parseResult: Result<{ title: string; summary: string; category: Category }, Error> =
    Result.try(() => {
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      return JSON.parse(jsonMatch[FIRST_ARRAY_ELEMENT]);
    });

  const parsed = parseResult.unwrapOr({
    title: title,
    summary: content.slice(ARRAY_START_INDEX, MAX_SUMMARY_LENGTH),
    category: DEFAULT_CATEGORY as Category,
  });

  const now = new Date();

  return {
    id: crypto.randomUUID(),
    title: parsed.title,
    summary: parsed.summary,
    originalUrl: url,
    source,
    category: parsed.category,
    publishedAt: format(now, DATE_FORMAT),
    fetchedAt: format(now, DATE_FORMAT),
    feedName,
  } as const satisfies NewsArticle;
}

//? 全体で約20件（カテゴリごと約4件 × 5カテゴリ、各カテゴリ最低1件確保）

function assignCategoryRanks(articles: NewsArticle[]) {
  const categoryCounters: Record<string, number> = {};

  return articles.map((article) => {
    const category = article.category;
    categoryCounters[category] = (categoryCounters[category] || DEFAULT_COUNTER_VALUE) + RANK_START;

    return { ...article, categoryRank: categoryCounters[category] };
  });
}

export async function curateNews(articles: NewsArticle[], existingNews?: NewsArticle[]) {
  const existingUrls = new Set(existingNews?.map((article) => article.originalUrl) ?? []);

  const newArticles = articles.filter((article) => !existingUrls.has(article.originalUrl));

  if (newArticles.length === EMPTY_ARRAY_LENGTH) {
    return [];
  }

  if (newArticles.length <= MAX_CURATED_ARTICLES) {
    const rankedArticles = newArticles.map((article, index) => ({
      ...article,
      rank: index + RANK_START,
    }));

    return assignCategoryRanks(rankedArticles);
  }

  const articlesForCuration = newArticles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    category: article.category,
    source: article.source,
    originalUrl: article.originalUrl,
  }));

  const existingNewsForPrompt = existingNews?.map((article) => ({
    title: article.title,
    url: article.originalUrl,
  }));

  const result = await Result.tryPromise(async () => {
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      prompt: PROMPTS.curate(
        JSON.stringify(articlesForCuration),
        existingNewsForPrompt ? JSON.stringify(existingNewsForPrompt) : undefined,
      ),
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
    const fallbackArticles = newArticles
      .slice(ARRAY_START_INDEX, MAX_CURATED_ARTICLES)
      .map((article, index) => ({
        ...article,
        rank: index + RANK_START,
      }));

    return assignCategoryRanks(fallbackArticles);
  }

  const selectedIds = result.value;
  const curatedArticles: NewsArticle[] = [];

  for (const [index, id] of selectedIds.entries()) {
    const article = newArticles.find((a) => a.id === id);

    if (article && !existingUrls.has(article.originalUrl)) {
      curatedArticles.push({ ...article, rank: index + RANK_START });
    }
  }

  return assignCategoryRanks(curatedArticles.slice(ARRAY_START_INDEX, MAX_CURATED_ARTICLES));
}
