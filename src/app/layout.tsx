import type { Metadata } from "next";
import localFont from "next/font/local";
import type { PropsWithChildren } from "react";
import { SiteCursor } from "@/components/layout/site-cursor";
import { QaRouteBridge } from "@/components/layout/qa-route-bridge";
import { SiteHeader } from "@/components/layout/site-header";
import "@/styles/globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  fallback: ["Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
  variable: "--font-pretendard",
  weight: "45 920",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.2026-knud-graduation.com"),
  title: "KNUD 2026 Graduation Exhibition",
  description: "경북대학교 디자인학과 2026 졸업전시회",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "KNUD 2026 Graduation Exhibition",
    title: "IGNITE | 경북대학교 디자인학과 2026 졸업전시회",
    description: "잠자는 사자가 깨어난 순간 — 제42회 경북대학교 디자인학과 졸업전시회",
    images: [{
      url: "/assets/og/knud-ignite-blue.png",
      width: 1200,
      height: 630,
      alt: "IGNITE — KNUD 2026 졸업전시회",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IGNITE | 경북대학교 디자인학과 2026 졸업전시회",
    description: "잠자는 사자가 깨어난 순간 — 제42회 경북대학교 디자인학과 졸업전시회",
    images: ["/assets/og/knud-ignite-blue.png"],
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html className={pretendard.variable} lang="ko">
      <body>
        <QaRouteBridge />
        <SiteHeader />
        <main>{children}</main>
        <SiteCursor />
      </body>
    </html>
  );
}
