import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
const enforceCsp = process.env.CSP_ENFORCE === "true" || !isDev;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const connectSrc = new Set(["'self'"]);
try {
  if (apiUrl) {
    connectSrc.add(new URL(apiUrl).origin);
  }
} catch {
  // Ignore invalid URL and fall back to self-only.
}
if (isDev) {
  connectSrc.add("http://localhost:3000");
  connectSrc.add("http://127.0.0.1:3000");
  connectSrc.add("ws://localhost:3000");
  connectSrc.add("ws://127.0.0.1:3000");
}

const csp = [
  "base-uri 'none'",
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "style-src-attr 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self'",
  `connect-src ${Array.from(connectSrc).join(" ")}`,
  ...(isDev ? [] : ["upgrade-insecure-requests", "block-all-mixed-content"]),
].join("; ");

const securityHeaders = [
  {
    key: enforceCsp ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    value: csp,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
