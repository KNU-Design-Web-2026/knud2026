import type { Metadata } from "next";
import localFont from "next/font/local";
import type { PropsWithChildren } from "react";
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
  title: "KNUD 2026 Graduation Exhibition",
  description: "경북대학교 디자인학과 2026 졸업전시회",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html className={pretendard.variable} lang="ko">
      <body>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
