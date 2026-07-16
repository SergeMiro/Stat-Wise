import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The visual pack ships first-party, script-free SVG illustrations served
    // from /public. Allow next/image to serve them, but sandbox them and force
    // download disposition so an SVG can never execute in the page context.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
