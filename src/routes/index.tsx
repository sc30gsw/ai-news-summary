import { useTransition } from "react";
import { Container, Title, Text, Stack, Group, Button, Paper } from "@mantine/core";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { all } from "better-all";
import { Result } from "better-result";
import { CategoryFilter } from "~/features/news/components/category-filter";
import { NewsGrid } from "~/features/news/components/news-grid";
import { fetchAndSummarizeNews } from "~/lib/ai";
import { fetchRSSFeeds } from "~/lib/rss";
import { valibotValidator } from "@tanstack/valibot-adapter";
import {
  defaultNewsSearchParams,
  NewsSearchParamsSchema,
} from "~/features/news/types/news-search-params";

const getNews = createServerFn({ method: "GET" }).handler(async () => {
  const result = await Result.tryPromise(async () => {
    const { aiNews, rssNews } = await all({
      async aiNews() {
        return fetchAndSummarizeNews().catch(() => []);
      },
      async rssNews() {
        return fetchRSSFeeds().catch(() => []);
      },
    });

    const allNews = [...aiNews, ...rssNews];

    const uniqueNews = allNews.filter(
      (article, index, self) =>
        index === self.findIndex((a) => a.originalUrl === article.originalUrl),
    );

    return uniqueNews.sort(
      (a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime(),
    );
  });

  if (Result.isError(result)) {
    console.error("Failed to fetch news:", result.error);

    return [];
  }

  return result.value;
});

export const Route = createFileRoute("/")({
  component: HomePage,
  validateSearch: valibotValidator(NewsSearchParamsSchema),
  search: {
    middlewares: [stripSearchParams(defaultNewsSearchParams)],
  },
  beforeLoad: ({ location }) => {
    return { href: location.href };
  },
  loader: () => getNews(),
});

function HomePage() {
  const articles = Route.useLoaderData();
  const { category } = Route.useSearch();

  const [isPending, startTransition] = useTransition();

  const filteredArticles =
    category === "all" ? articles : articles.filter((article) => article.category === category);

  const handleRefresh = () => {
    startTransition(() => {
      window.location.reload();
    });
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Title order={1}>AI News Summary</Title>
                <Text c="dimmed">
                  AI、React、TypeScript、バックエンドなどの最新技術ニュースをAIで要約
                </Text>
              </Stack>
              <Button
                onClick={handleRefresh}
                loading={isPending}
                disabled={isPending}
                variant="light"
              >
                更新
              </Button>
            </Group>

            <CategoryFilter />
          </Stack>
        </Paper>

        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {filteredArticles.length}件のニュース
            </Text>
          </Group>

          <NewsGrid articles={filteredArticles} isLoading={isPending} />
        </Stack>
      </Stack>
    </Container>
  );
}
