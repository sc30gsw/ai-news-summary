import { format } from "@formkit/tempo";
import { Card, Text, Badge, Group, Anchor, Stack, type MantineColor } from "@mantine/core";
import { CATEGORY_LABELS, SOURCE_LABELS } from "~/features/news/constants/news";
import type { NewsArticle, Category, Source } from "~/features/news/types/news-schemas";

function getRankColor(rank: number) {
  if (rank <= 3) {
    return "yellow";
  }

  if (rank <= 10) {
    return "cyan";
  }

  return "gray";
}

const CATEGORY_COLORS = {
  all: "gray",
  ai: "violet",
  frontend: "blue",
  backend: "green",
  infra: "orange",
  mobile: "pink",
} as const satisfies Record<Category, MantineColor>;

const SOURCE_COLORS = {
  web: "indigo",
  x: "teal",
} as const satisfies Record<Source, MantineColor>;

export function NewsCard({ article }: Record<"article", NewsArticle>) {
  const formattedDate = format(article.fetchedAt, { date: "medium", time: "short" }, "ja");

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            {article.rank && (
              <Badge
                color={getRankColor(article.rank)}
                variant="filled"
                size="lg"
                fw={700}
                style={{ minWidth: 40 }}
              >
                #{article.rank}
              </Badge>
            )}
            <Badge color={CATEGORY_COLORS[article.category]} variant="light">
              {article.categoryRank
                ? `${CATEGORY_LABELS[article.category]} #${article.categoryRank}`
                : CATEGORY_LABELS[article.category]}
            </Badge>
            <Badge color={SOURCE_COLORS[article.source]} variant="outline" size="sm">
              {article.feedName ?? SOURCE_LABELS[article.source]}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {formattedDate}
          </Text>
        </Group>

        <Text fw={600} size="lg" lineClamp={2}>
          {article.title}
        </Text>

        <Text size="sm" c="dimmed" lineClamp={4}>
          {article.summary}
        </Text>

        <Anchor href={article.originalUrl} target="_blank" size="sm">
          元記事を読む →
        </Anchor>
      </Stack>
    </Card>
  );
}
