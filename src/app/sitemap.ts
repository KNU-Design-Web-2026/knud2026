import type { MetadataRoute } from "next";
import { PROFILE_DETAILS } from "@/data/profile-details";
import { WORK_DETAILS } from "@/data/work-details";

const SITE_URL = "https://www.2026-knud-graduation.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/about", "/work", "/profile", "/space", "/message"];
  const profileRoutes = Object.keys(PROFILE_DETAILS).map((id) => `/profile/${id}`);
  const workRoutes = Object.keys(WORK_DETAILS).map((id) => `/work/${id}`);

  return [...staticRoutes, ...profileRoutes, ...workRoutes].map((route) => ({
    url: `${SITE_URL}${route}`,
  }));
}
