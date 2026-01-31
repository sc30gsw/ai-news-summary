# AI News Summary

AI・React・TypeScript・バックエンドなどの最新技術ニュースを AI で要約する Web アプリケーション。

## 主な機能

- X (Twitter) のテック系アカウントから最新ニュースを自動取得
- AI による日本語要約生成（200〜300 字）
- 5 カテゴリへの自動分類（AI, Frontend, Backend, Infra, Mobile）
- カテゴリごと約 5 件、計約 25 記事を取得
- カテゴリ別フィルタリング
- Vercel Cron による毎日自動更新

## 技術スタック

| カテゴリ       | 技術                                               |
| -------------- | -------------------------------------------------- |
| フロントエンド | TanStack Start, React 19, Mantine UI, Tailwind CSS |
| バックエンド   | Elysia, Nitro                                      |
| AI             | Vercel AI SDK + xAI (grok-3-latest)                |
| データ         | Vercel KV                                          |
| バリデーション | Valibot                                            |
| ツール         | Bun, Vite, OxLint                                  |

## 監視対象 X アカウント一覧

| カテゴリ | アカウント                                          |
| -------- | --------------------------------------------------- |
| AI       | OpenAI, AnthropicAI, GoogleAI, xaboratory, _akhaliq |
| Frontend | reactjs, vuejs, svelte, vercel, nextjs              |
| Backend  | golang, rustlang, hoaboratory, bunaboratory, deaboratory |
| Infra    | supabase, convex, turso_tech, Docker, kubernetesio  |
| Mobile   | reactnative, FlutterDev, Apple, Android, expo       |

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. 環境変数の設定

`.env` ファイルを作成:

```bash
cp .env.example .env
```

必要な環境変数:

```env
# xAI API キー (https://console.x.ai/ から取得)
XAI_API_KEY=your_xai_api_key_here

# Vercel KV (Vercel ダッシュボードから取得)
VERCEL_KV_REST_API_URL=your_kv_url
VERCEL_KV_REST_API_TOKEN=your_kv_token

# Cron 認証用シークレット (オプション)
CRON_SECRET=your_cron_secret
```

### 3. 開発サーバーの起動

```bash
bun run dev
```

http://localhost:5173 でアクセスできます。

## 開発スクリプト

| コマンド          | 説明                   |
| ----------------- | ---------------------- |
| `bun run dev`     | 開発サーバー起動       |
| `bun run build`   | プロダクションビルド   |
| `bun run start`   | ビルド後のプレビュー   |
| `bun run check`   | 型チェック (OxLint)    |
| `bun run lint`    | リント                 |
| `bun run fmt:fix` | コード自動フォーマット |

## プロジェクト構成

```
src/
├── routes/
│   ├── __root.tsx          # ルートレイアウト
│   ├── index.tsx           # ホームページ
│   └── api/
│       └── $.ts            # API エンドポイント (Elysia)
├── features/
│   ├── cron/
│   │   ├── index.ts        # Cron エンドポイント定義
│   │   ├── service.ts      # ニュース取得・キュレーション
│   │   └── model.ts        # API レスポンスモデル
│   └── news/
│       ├── types/          # Valibot スキーマ
│       ├── components/     # UI コンポーネント
│       └── constants/      # 定数定義
├── lib/
│   ├── ai.ts               # AI SDK 設定
│   ├── x-search.ts         # X (Twitter) 検索処理
│   └── kv.ts               # Vercel KV キャッシュ
└── constants/
    └── index.ts            # 共通定数
```

## API エンドポイント

| メソッド | パス                   | 説明                                              |
| -------- | ---------------------- | ------------------------------------------------- |
| GET      | `/api/cron/fetch-news` | X (Twitter) から記事を取得し、AI でキュレーション |

レスポンス例:

```json
{
  "success": true,
  "count": 20,
  "timestamp": "2026-01-12T23:00:00.000Z"
}
```

## Vercel へのデプロイ

1. Vercel にプロジェクトをインポート
2. 環境変数を設定:
   - `XAI_API_KEY`
   - `VERCEL_KV_REST_API_URL`
   - `VERCEL_KV_REST_API_TOKEN`
   - `CRON_SECRET`（オプション）
3. デプロイ

Cron Jobs は `vercel.json` で設定済み（毎日 23:00 UTC に実行）。

## ライセンス

MIT
