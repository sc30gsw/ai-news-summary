# AI News Summary

AI、React、TypeScript、バックエンドなどの最新技術ニュースをAIで要約するWebアプリケーション。

## 技術スタック

- **フロントエンド**: TanStack Start, Mantine UI
- **バリデーション**: Valibot
- **AI**: Vercel AI SDK + xAI (Grok 4.1)
- **定期実行**: Vercel Cron Jobs

## 機能

- X (Twitter) からの技術ニュース取得 (Grok経由)
- Web検索からのニュース取得
- RSSフィードからの記事取得 (Zenn, Qiita, Dev.to, Hacker News)
- AIによる日本語要約生成
- カテゴリ自動分類
- カテゴリ別フィルタリング

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、xAI APIキーを設定:

```bash
cp .env.example .env
```

```env
XAI_API_KEY=your_xai_api_key_here
```

xAI APIキーは [https://console.x.ai/](https://console.x.ai/) から取得できます。

### 3. 開発サーバーの起動

```bash
bun run dev
```

http://localhost:5173 でアプリケーションにアクセスできます。

## ビルド

```bash
bun run build
```

## Vercelへのデプロイ

1. Vercelにプロジェクトをインポート
2. 環境変数 `XAI_API_KEY` を設定
3. デプロイ

Cron Jobsは `vercel.json` で設定済み（毎日8:00に実行）。

## プロジェクト構成

```
src/
├── routes/
│   ├── __root.tsx      # ルートレイアウト
│   ├── index.tsx       # ホームページ
│   └── api/
│       └── news.ts     # ニュースAPI
├── components/
│   ├── NewsCard.tsx    # ニュースカード
│   ├── CategoryFilter.tsx
│   └── NewsGrid.tsx
└── lib/
    ├── ai.ts           # AI SDK設定
    ├── rss.ts          # RSSパーサー
    └── schemas.ts      # Valibotスキーマ
```

## ライセンス

MIT
