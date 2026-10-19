"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createAnalyticsTracker, GA_MEASUREMENT_ID } from "@/lib/google-analytics";
import type { AnalyticsSend } from "@/lib/google-analytics";

type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: AnalyticsSend };

export function GoogleAnalytics({ environment }: { environment: string }) {
  const pathname = usePathname();
  const track = useRef<ReturnType<typeof createAnalyticsTracker> | null>(null);

  useEffect(() => {
    if (!track.current) {
      const analyticsWindow = window as AnalyticsWindow;
      const send: AnalyticsSend = function () {
        analyticsWindow.dataLayer ??= [];
        // gtag consumes Arguments objects; retain its official queue ABI.
        // eslint-disable-next-line prefer-rest-params
        analyticsWindow.dataLayer.push(arguments);
      };
      track.current = createAnalyticsTracker({
        environment,
        referrer: document.referrer,
        doNotTrack: navigator.doNotTrack === "1",
        globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true,
        send,
        loadScript: () => {
          if (document.getElementById("knud-google-analytics")) return;
          const script = document.createElement("script");
          script.id = "knud-google-analytics";
          script.async = true;
          script.referrerPolicy = "origin";
          script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
          analyticsWindow.gtag = send;
          document.head.appendChild(script);
        },
      });
    }
    track.current(window.location.href);
  }, [environment, pathname]);

  return null;
}
