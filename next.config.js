/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  compress: true,
  transpilePackages: [
    '@labring/sealos-ui',
    '@labring/sealos-shared-sdk',
    '@labring/sealos-desktop-sdk',
  ],
  experimental: {
    outputFileTracingRoot: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/v2alpha/docs',
        destination: '/api/v2alpha/doc',
      },
      {
        source: '/api/v2alpha/openapi.json',
        destination: '/api/v2alpha/openapi',
      },
    ]
  },
}

module.exports = nextConfig
