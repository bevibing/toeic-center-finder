import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "leaflet/dist/leaflet.css";
import "@/app/globals.css";
import StyledComponentsRegistry from "@/components/styled-components-registry";
import JsonLd from "@/components/json-ld";
import SiteFooter from "@/components/site-footer";
import {
  buildMetadata,
  buildOrganizationStructuredData,
  buildWebsiteStructuredData,
} from "@/lib/site";

const OSM_TILE_HOSTS = [
  "https://a.tile.openstreetmap.org",
  "https://b.tile.openstreetmap.org",
  "https://c.tile.openstreetmap.org",
];

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {OSM_TILE_HOSTS.map((host) => (
          <link key={host} rel="preconnect" href={host} crossOrigin="anonymous" />
        ))}
      </head>
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
        <SiteFooter />
        <Analytics />
        <JsonLd data={buildWebsiteStructuredData()} />
        <JsonLd data={buildOrganizationStructuredData()} />
      </body>
    </html>
  );
}
