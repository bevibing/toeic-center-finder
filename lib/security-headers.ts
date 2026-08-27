const OSM_TILE_ORIGIN = "https://*.tile.openstreetmap.org";

/**
 * Leaflet marker icons ship from `/_next/static`, the SVG pin markers are
 * `data:` URIs, and the only cross-origin subresources are OpenStreetMap
 * raster tiles. Inline script/style stay allowed because Next.js emits an
 * inline bootstrap script (plus `application/ld+json` blocks) and
 * styled-components injects inline `<style>` tags at hydration.
 */
/**
 * Flip to `true` to enforce the policy once report-only traffic is clean. This
 * switches the header name and enables the enforce-only directives together, so
 * neither can be forgotten.
 */
const ENFORCE_CONTENT_SECURITY_POLICY = false;

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${OSM_TILE_ORIGIN}`,
  "font-src 'self' data:",
  `connect-src 'self' ${OSM_TILE_ORIGIN}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Browsers ignore upgrade-insecure-requests in a report-only policy and log a
  // console warning for it, which would bury the violation reports this mode
  // exists to surface. HSTS already forces HTTPS in the meantime.
  ...(ENFORCE_CONTENT_SECURITY_POLICY ? ["upgrade-insecure-requests"] : []),
].join("; ");

export const CONTENT_SECURITY_POLICY_HEADER_NAME = ENFORCE_CONTENT_SECURITY_POLICY
  ? "Content-Security-Policy"
  : "Content-Security-Policy-Report-Only";

export const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: CONTENT_SECURITY_POLICY_HEADER_NAME, value: CONTENT_SECURITY_POLICY },
];
