import { Container, Title, Text, Stack, Group, Paper, Badge } from "@mantine/core";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { all } from "better-all";
import { CategoryFilter } from "~/features/news/components/category-filter";
import { NewsGrid } from "~/features/news/components/news-grid";
import { getLastUpdated, getNews as getNewsFromKV } from "~/lib/kv";
import { valibotValidator } from "@tanstack/valibot-adapter";
import {
  defaultNewsSearchParams,
  NewsSearchParamsSchema,
} from "~/features/news/types/news-search-params";

const getNews = createServerFn({ method: "GET" }).handler(async () => {
  const { articles, lastUpdated } = await all({
    async articles() {
      return getNewsFromKV();
    },
    async lastUpdated() {
      return getLastUpdated();
    },
  });

  return { articles, lastUpdated };
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

function formatLastUpdated(isoString: string | null) {
  if (!isoString) {
    return "未取得";
  }

  const date = new Date(isoString);

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function HomePage() {
  const { articles, lastUpdated } = Route.useLoaderData();
  const { category } = Route.useSearch();

  const filteredArticles =
    category === "all" ? articles : articles.filter((article) => article.category === category);

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
              <Badge variant="light" size="lg">
                最終更新: {formatLastUpdated(lastUpdated)}
              </Badge>
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

          <NewsGrid articles={filteredArticles} isLoading={false} />
        </Stack>
      </Stack>
    </Container>
  );
}
