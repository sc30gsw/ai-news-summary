import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { createFileRoute } from "@tanstack/react-router";
import { newsPlugin } from "~/features/news/api";

const app = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      path: import.meta.env.DEV ? "/openapi" : undefined,
      documentation: {
        info: {
          title: "AI News Summary API",
          version: "1.0.0",
          description: "API for managing news",
        },
        tags: [{ name: "News", description: "News operations" }],
      },
    }),
  )
  .use(newsPlugin);

const handle = ({ request }: { request: Request }) => {
  return app.fetch(request);
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
