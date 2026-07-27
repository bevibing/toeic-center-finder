import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "leaflet/dist/leaflet.css";
import "@/app/globals.css";
import StyledComponentsRegistry from "@/components/styled-components-registry";
import JsonLd from "@/components/json-ld";
import SiteFooter from "@/components/site-footer";
import { buildMetadata, buildWebsiteStructuredData } from "@/lib/site";

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
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
        <SiteFooter />
        <Analytics />
        <JsonLd data={buildWebsiteStructuredData()} />
      </body>
    </html>
  );
}
