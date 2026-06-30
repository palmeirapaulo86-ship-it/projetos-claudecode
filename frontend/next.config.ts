import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Variáveis de ambiente públicas validadas em build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

export default nextConfig
