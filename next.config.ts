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

/**
 * Which build this is.
 *
 * Next splits the app into hashed chunks and names them in the HTML it serves,
 * so a browser that had the dashboard open before a deploy asks for files that
 * no longer exist and crashes on the next navigation. Telling Next the build's
 * identity turns that into version-skew protection: assets are requested with
 * `?dpl=`, navigations carry an `x-deployment-id` header, and a mismatch makes
 * the router do a full page load instead of a client-side one.
 *
 * It must be the SAME value at build time and at runtime, because the running
 * server is what an old tab asks. Set it in the deploy to a git SHA or a
 * timestamp:
 *
 *   BUILD_ID=$(git rev-parse --short HEAD)
 *   NEXT_PUBLIC_BUILD_ID=$BUILD_ID BUILD_ID=$BUILD_ID npm run build
 *   BUILD_ID=$BUILD_ID npm start
 *
 * Left unset, everything degrades to what happens today: no skew protection and
 * no update prompt, rather than a broken build.
 */
const deploymentId = process.env.BUILD_ID || undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "",
  ...(assetPrefix ? { assetPrefix } : {}),
  ...(deploymentId ? { deploymentId } : {}),
};

export default nextConfig;
