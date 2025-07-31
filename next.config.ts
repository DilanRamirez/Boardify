import type { NextConfig } from "next";
import { execSync } from "child_process";

const generateBuildId = async () => {
  // Allow overriding the build ID via environment variable (useful in CI/deploys)
  if (process.env.NEXT_BUILD_ID) {
    return process.env.NEXT_BUILD_ID;
  }

  // Try to use the current git commit hash for a stable and unique ID per commit
  try {
    const hash = execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (hash) {
      return hash;
    }
  } catch (e) {
    // ignore if git is not available or fails
  }

  // Fallback to a timestamp so each build is unique
  return `${Date.now()}`;
};

const nextConfig: NextConfig = {
  generateBuildId,
  // other config options can go here
};

export default nextConfig;
