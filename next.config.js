/**
 * @type {import('next').NextConfig}
 */
const repo = "srch"
const isGithubActions = process.env.GITHUB_ACTIONS === "true"

const nextConfig = {
  output: "export",
  basePath: isGithubActions ? `/${repo}` : "",
  assetPrefix: isGithubActions ? `/${repo}/` : "",
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
