/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // /card-meanings is Google-indexed but has never been a route here —
      // it 404s in production (curl-verified 2026-07-12). Permanently point
      // it at the card-meanings index so the indexed URL recovers its equity.
      // @cloudflare/next-on-pages compiles redirects() into the Pages
      // routing layer, so this 301s at the edge.
      {
        source: "/card-meanings",
        destination: "/birth-card",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
