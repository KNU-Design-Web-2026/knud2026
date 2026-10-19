import type { Metadata } from "next";
import localFont from "next/font/local";
import { connection } from "next/server";
import type { PropsWithChildren } from "react";
import { GoogleAnalytics } from "@/components/layout/google-analytics";
import { MicrosoftClarity } from "@/components/layout/microsoft-clarity";
import { SiteCursor } from "@/components/layout/site-cursor";
import { QaRouteBridge } from "@/components/layout/qa-route-bridge";
import { SiteHeader } from "@/components/layout/site-header";
import { isMaintenanceMode } from "@/lib/maintenance-mode";
import "@/styles/globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  fallback: ["Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
  variable: "--font-pretendard",
  weight: "45 920",
});

const siteMetadata: Metadata = {
  metadataBase: new URL("https://www.2026-knud-graduation.com"),
  title: {
    default: "2026 경북대학교 디자인학과 졸업 전시회 : IGNITE",
    template: "%s | 2026 경북대학교 디자인학과 졸업 전시회",
  },
  description:
    "2026 제42회 경북대학교 디자인학과 졸업 전시회 IGNITE의 작품과 참여 작가를 소개합니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "2026 경북대학교 디자인학과 졸업 전시회",
    title: "2026 경북대학교 디자인학과 졸업 전시회 : IGNITE",
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
    title: "2026 경북대학교 디자인학과 졸업 전시회 : IGNITE",
    description: "잠자는 사자가 깨어난 순간 — 제42회 경북대학교 디자인학과 졸업전시회",
    images: ["/assets/og/knud-ignite-blue.png"],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return {
    ...siteMetadata,
    robots: isMaintenanceMode() ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  // The header and holding page must not be frozen into a pre-opening build.
  await connection();
  const maintenanceMode = isMaintenanceMode();

  return (
    <html className={pretendard.variable} lang="ko" style={maintenanceMode ? { backgroundColor: "#fff" } : undefined}>
      <body data-clarity-mask="true" style={maintenanceMode ? { backgroundColor: "#fff" } : undefined}>
        {!maintenanceMode && <QaRouteBridge />}
        {!maintenanceMode && <SiteHeader />}
        <main>{children}</main>
        {!maintenanceMode && <SiteCursor />}
        {process.env.VERCEL_ENV === "production" && <GoogleAnalytics environment="production" />}
        {process.env.VERCEL_ENV === "production" && <MicrosoftClarity environment="production" />}
      </body>
    </html>
  );
}
