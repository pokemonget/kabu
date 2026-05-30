# JPX 統計情報ダッシュボード

日本取引所グループ（JPX）の月次統計データを自動収集し、リアルタイムで可視化するダッシュボードです。

## 機能

- 📊 **自動データ収集**: 毎月7日の午前3時（JST）に自動的にJPXの統計情報を収集
- 📈 **インタラクティブなグラフ**: Recharts を使用した高品質なグラフ表示
- 🔍 **期間選択**: 任意の期間を選択して数値を絞り込み
- 🔄 **リアルタイム更新**: GitHub Actions により自動デプロイ

## 対応する統計情報

1. **業種別時価総額**: 業種ごとの時価総額推移
2. **時価総額順位表**: Top 10企業の時価総額推移
3. **規模別・業種別PER・PBR統計**: 株価指標の推移

## 技術スタック

### フロントエンド
- **Framework**: Next.js 14（App Router）
- **UI Chart**: Recharts
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### バックエンド
- **Language**: Python 3.10+
- **Data Processing**: Pandas
- **Web Scraping**: requests + BeautifulSoup4
- **CI/CD**: GitHub Actions

## セットアップ

### 前提条件
- Node.js 18+
- Python 3.10+
- Git

### インストール手順

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd kabu

# 2. Node.js の依存パッケージをインストール
npm install

# 3. Python の依存パッケージをインストール
pip install -r requirements.txt
```

## 実行方法

### ローカル開発

```bash
# Next.js 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
```

### データ収集（手動実行）

```bash
# Pythonスクリプトを実行してデータを収集
python scripts/scraper.py

# データは public/data/ に JSON形式で保存されます
```

### 本番ビルド

```bash
# ビルド
npm run build

# 本番環境で起動
npm start
```

## ファイル構造

```
kabu/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # ルートレイアウト
│   ├── page.tsx                 # メインページ
│   └── globals.css              # グローバルスタイル
├── components/                   # React コンポーネント
│   ├── DateRangePicker.tsx      # 日時選択コンポーネント
│   ├── MarketCapByIndustryChart.tsx   # 業種別グラフ
│   ├── MarketCapRankingChart.tsx      # ランキンググラフ
│   └── PerPbrStatsChart.tsx     # PER/PBR グラフ
├── public/                       # 静的ファイル
│   └── data/                    # 収集データ（JSON）
│       ├── market_cap_by_industry.json
│       ├── market_cap_ranking.json
│       └── per_pbr_stats.json
├── scripts/                      # Python スクリプト
│   └── scraper.py               # JPX データ収集スクリプト
├── .github/
│   └── workflows/
│       └── update_data.yml      # GitHub Actions ワークフロー
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── requirements.txt
```

## GitHub Actions 自動実行

リポジトリをGitHubにプッシュすると、以下が自動的に設定されます：

- **スケジュール**: 毎月6日 18時 UTC（7日午前3時 JST）
- **動作**: JPXサイトから統計データをダウンロード・処理
- **自動コミット**: データに変更があれば自動的にGitにコミット
- **自動デプロイ**: Vercelに接続している場合、自動的に本番環境に反映

## Vercelでのデプロイ

1. GitHub リポジトリを Vercel に接続
2. 環境変数は不要（`public/data/` は静的ファイル）
3. デプロイが完了するとデータが自動的に配信されます

## トラブルシューティング

### データが表示されない場合

```bash
# 1. データ収集スクリプトを実行
python scripts/scraper.py

# 2. public/data/ ディレクトリに JSON ファイルが作成されたか確認
ls -la public/data/

# 3. Next.js 開発サーバーを再起動
npm run dev
```

### GitHub Actions が失敗する場合

- ワークフロー設定を確認: `.github/workflows/update_data.yml`
- リポジトリのシークレット設定（必要に応じて）
- GitHub の Actions タブでログを確認

## データソース

- [日本取引所グループ（JPX）](https://www.jpx.co.jp/)
  - [業種別時価総額](https://www.jpx.co.jp/markets/statistics-equities/misc/07.html)
  - [時価総額順位表](https://www.jpx.co.jp/markets/statistics-equities/misc/08.html)
  - [規模別・業種別PER・PBR統計](https://www.jpx.co.jp/markets/statistics-equities/misc/04.html)

## ライセンス

MIT License

## 注記

このダッシュボードは公開データの可視化を目的としています。
詳細な免責事項はJPX公式サイトをご確認ください。
