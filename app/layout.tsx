import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "JPX 統計情報ダッシュボード",
  description: "日本取引所グループの統計情報を可視化",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' font-weight='bold' fill='%23003366'>JPX</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          {/* ヘッダー */}
          <header className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-jpx-primary">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-3xl font-bold text-jpx-primary">📊 JPX 統計情報ダッシュボード</h1>
              <p className="text-sm text-gray-600 mt-1">
                日本取引所グループの月次統計データをリアルタイム表示
              </p>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>

          {/* フッター */}
          <footer className="bg-jpx-primary text-white text-center py-4 mt-12">
            <p className="text-sm">
              データソース: <a href="https://www.jpx.co.jp" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-200">日本取引所グループ (JPX)</a>
            </p>
            <p className="text-xs text-gray-300 mt-1">
              自動更新: 毎月7日午前3時（JST）
            </p>
          </footer>
        </div>
      </body>
    </html>
  )
}
