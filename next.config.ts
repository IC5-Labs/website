import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  // Admins upload document files (PDFs and similar) through a server action.
  experimental: { serverActions: { bodySizeLimit: "100mb" } },
  // Keep links to the previous ic5labs.com blog working.
  async redirects() {
    return [
      { source: "/blog", destination: "/resources", permanent: true },
      { source: "/blog/:slug", destination: "/resources/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
