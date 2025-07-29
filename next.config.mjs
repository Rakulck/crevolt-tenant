/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enable ESLint during builds for better code quality
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Temporarily disable TypeScript checking during builds for linting setup
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Increase limit to 5MB to handle profile image uploads
      bodySizeLimit: "5mb",
    },
  },
}

export default nextConfig
