/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポートを有効化（Vercelでの最適化）
  output: 'standalone',
  
  // 環境変数の設定
  env: {
    NEXT_PUBLIC_DATA_PATH: '/data',
  },
}

module.exports = nextConfig
