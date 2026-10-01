import type { MetadataRoute } from "next";
import { isMaintenanceMode } from "@/lib/maintenance-mode";

const SITE_URL = "https://www.2026-knud-graduation.com";

export default function robots(): MetadataRoute.Robots {
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
