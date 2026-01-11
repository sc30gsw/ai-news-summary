import * as v from "valibot";
import { CategorySchema } from "~/features/news/types/schemas";

export const NewsSearchParamsSchema = v.object({
  category: v.optional(CategorySchema, "all"),
});

export type NewsSearchParams = v.InferOutput<typeof NewsSearchParamsSchema>;

export const defaultNewsSearchParams = {
  category: "all",
} as const satisfies NewsSearchParams;
