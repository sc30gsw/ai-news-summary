import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { createFileRoute } from "@tanstack/react-router";
import { cronPlugin } from "~/features/cron";

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
        tags: [{ name: "Cron", description: "Cron job operations" }],
      },
    }),
  )
  .use(cronPlugin);

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
