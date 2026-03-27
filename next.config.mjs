/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    GOLD_API_KEY: process.env.GOLD_API_KEY,
  },
}

export default nextConfig
