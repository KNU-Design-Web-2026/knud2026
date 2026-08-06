import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "KNUD 2026 Graduation Exhibition",
  description: "경북대학교 디자인학과 2026 졸업전시회",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
