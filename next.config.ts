import type { NextConfig } from "next";

/**
 * `assetPrefix` was hard-coded to `http://31.187.74.65:8087`, which meant every
 * local run fetched its CSS and JS from that server instead of itself — so the
 * app rendered unstyled, login included. It is now read from the environment
 * and applied only to a production build, so `next dev` always serves its own
 * assets.
 *
 * Set ASSET_PREFIX in the deployed environment when static files are served
 * from a different origin than the app. Leave it unset everywhere else.
 */
const assetPrefix =
  process.env.NODE_ENV === "production" ? (process.env.ASSET_PREFIX ?? undefined) : undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "",
  ...(assetPrefix ? { assetPrefix } : {}),
};

export default nextConfig;
