/// <reference types="vite/client" />
import { MantineProvider, ColorSchemeScript, createTheme } from "@mantine/core";
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";
import "@mantine/core/styles.css";

const theme = createTheme({
  primaryColor: "blue",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
});

export const Route = createRootRoute({
  head: () => ({
    links: [{ href: appCss, rel: "stylesheet" }],
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI News Summary - 技術ニュース要約" },
      {
        name: "description",
        content: "AI、React、TypeScript、バックエンドなどの最新技術ニュースをAIで要約",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <html lang="ja">
      <head>
        <ColorSchemeScript />
        <HeadContent />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <Outlet />
        </MantineProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundComponent() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">404</h1>
      <p>ページが見つかりませんでした。</p>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-red-600">エラー</h1>
      <p>{error.message}</p>
    </div>
  );
}

function PendingComponent() {
  return (
    <div className="p-4">
      <p>読み込み中...</p>
    </div>
  );
}
