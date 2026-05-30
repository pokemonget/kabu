/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境変数の設定
  env: {
    NEXT_PUBLIC_DATA_PATH: '/data',
  },
  // Vercelでの最適化
  swcMinify: true,
}

module.exports = nextConfig
