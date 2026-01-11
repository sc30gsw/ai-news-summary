import { SegmentedControl, Group, Text } from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";
import { CATEGORY_LABELS } from "~/features/news/constants/news";
import type { Category } from "~/features/news/types/news-schemas";

export function CategoryFilter() {
  const routeAPi = getRouteApi("/");
  const { category } = routeAPi.useSearch();

  const navigate = routeAPi.useNavigate();

  const options = [
    ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
      label,
      value: key,
    })),
  ];

  return (
    <Group gap="md" align="center">
      <Text size="sm" fw={500}>
        カテゴリ:
      </Text>
      <SegmentedControl
        value={category}
        onChange={(val) => {
          navigate({
            search: {
              category: val as Category,
            },
          });
        }}
        data={options}
        size="sm"
      />
    </Group>
  );
}
