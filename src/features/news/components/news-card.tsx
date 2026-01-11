import { Card, Text, Badge, Group, Anchor, Stack, type MantineColor } from "@mantine/core";
import { CATEGORY_LABELS, SOURCE_LABELS } from "~/features/news/constants";
import type { NewsArticle, Category, Source } from "~/features/news/types/schemas";

const CATEGORY_COLORS = {
  all: "gray",
  "ai-ml": "violet",
  "react-frontend": "blue",
  typescript: "cyan",
  backend: "green",
  tools: "orange",
} as const satisfies Record<Category, MantineColor>;

const SOURCE_COLORS = {
  x: "dark",
  web: "indigo",
  rss: "teal",
} as const satisfies Record<Source, MantineColor>;

export function NewsCard({ article }: Record<"article", NewsArticle>) {
  const formattedDate = new Date(article.fetchedAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge color={CATEGORY_COLORS[article.category]} variant="light">
              {CATEGORY_LABELS[article.category]}
            </Badge>
            <Badge color={SOURCE_COLORS[article.source]} variant="outline" size="sm">
              {SOURCE_LABELS[article.source]}
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
