/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 確保 API routes 在 Vercel 上正確工作
  // Vercel 會自動處理 serverless functions，無需額外配置
}

module.exports = nextConfig




