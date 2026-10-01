import { NextResponse, type NextRequest } from "next/server";
import { isMaintenanceMode } from "@/lib/maintenance-mode";

export function proxy(request: NextRequest) {
  if (!isMaintenanceMode()) {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;

  if (
    path === "/" ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path.startsWith("/_next/") ||
    path.startsWith("/assets/")
  ) {
    return NextResponse.next();
  }

  if (path === "/api" || path.startsWith("/api/")) {
    return new NextResponse("사이트 준비 중입니다.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "3600" },
    });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: "/((?!_next/|assets/|favicon.ico).*)",
};
