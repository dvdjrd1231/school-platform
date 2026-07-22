/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone — a self-contained server carrying only the modules
  // it actually uses, so the Docker image needs no node_modules at runtime.
  //
  // Opt-in rather than always-on: tracing recreates pnpm's symlinked
  // node_modules, and creating symlinks on Windows requires elevated
  // privileges, so an unconditional "standalone" breaks `pnpm build` on a
  // Windows dev machine. The Dockerfile (Linux) sets BUILD_STANDALONE=true.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
