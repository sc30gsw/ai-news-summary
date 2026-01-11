import { SimpleGrid, Text, Center, Loader, Stack } from "@mantine/core";
import type { NewsArticle } from "~/features/news/types/news-schemas";
import { NewsCard } from "./news-card";

type NewsGridProps = {
  articles: NewsArticle[];
  isLoading?: boolean;
};

export function NewsGrid({ articles, isLoading }: NewsGridProps) {
  if (isLoading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">ニュースを取得中...</Text>
        </Stack>
      </Center>
    );
  }

  if (articles.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">ニュースが見つかりませんでした</Text>
      </Center>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </SimpleGrid>
  );
}
