import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { isMaintenanceMode } from "@/lib/maintenance-mode";

const SITE_URL = "https://www.2026-knud-graduation.com";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  if (isMaintenanceMode()) {
    return { rules: { userAgent: "*", allow: "/" }, host: SITE_URL };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/experiments/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
