# 依頼内容
日本取引所グループ（JPX）が月次で公開するExcelデータを自動収集・蓄積し、Vercel側で「日時絞り込み・全期間表示」が可能な動的グラフアプリを作成するための、データ収集パイプライン（Python + GitHub Actions）とフロントエンド（Next.js）のコードを生成してください。

# 1. ターゲットURLと仕様
1. 業種別時価総額表
   - URL: https://www.jpx.co.jp/markets/statistics-equities/misc/07.html
2. 時価総額順位表
   - URL: https://www.jpx.co.jp/markets/statistics-equities/misc/08.html
3. 規模別・業種別PER・PBR（連結・単体）一覧
   - URL: https://www.jpx.co.jp/markets/statistics-equities/misc/04.html

# 2. 実装必須要件

## ① データ収集スクリプト (`scraper.py`)
- `requests` と `beautifulsoup4` を使い、上記URL内の「1月」「2月」...「12月」のリンク（Excelファイル: `.xlsx` または `.xls`）を解析・特定する。
- 該当ファイルから、日付（更新月）、項目（業種や順位）、数値データを `pandas` で抽出する。
- **データ蓄積形式**: 過去のデータと重複しないようにマージ（Upsert）し、`public/data/` ディレクトリ内に以下の3つのJSONファイルとして出力・更新する。
  - `market_cap_by_industry.json` (業種別)
  - `market_cap_ranking.json` (順位表)
  - `per_pbr_stats.json` (PER・PBR)

## ② 自動化設定 (`.github/workflows/update_data.yml`)
- 毎月第5営業日以降（安全のため「毎月7日の午前3時」など）に自動実行されるCronスケジュールを設定する。
- ワークフロー内で `scraper.py` を実行し、データに差分があれば、自動的に `public/data/*.json` をGitHubリポジトリへコミットしてメインブランチへPushする。
- ※これによりVercelへの自動再デプロイがトリガーされ、画面が最新状態に更新される。

## ③ フロントエンド画面の要件（Next.js + Recharts）
- `public/data/` のJSONを非同期でフェッチしてグラフを描画する。
- 全期間表示に対応しつつ、軽量な「Date Range Picker（期間選択）」を設置し、ユーザーが日時を自由に絞り込めるようにする。
- 業種が多いため、凡例クリックで特定の線グラフをトグル（表示・非表示）できるインタラクティブなUIを組み込む。

# 3. 出力指示
上記の構成に基づき、まずは `scraper.py` のコードと、それを動かす `.github/workflows/update_data.yml` のコードを完全に記述してください。
