"use client";

import { useEffect } from "react";
import { CLARITY_PROJECT_ID, CLARITY_SCRIPT_ID, initializeClarity } from "@/lib/microsoft-clarity";
import type { ClaritySend } from "@/lib/microsoft-clarity";

type ClarityQueue = ClaritySend & { q?: unknown[] };
type ClarityWindow = Window & { clarity?: ClarityQueue };

export function MicrosoftClarity({ environment }: { environment: string }) {
  useEffect(() => {
    const clarityWindow = window as ClarityWindow;
    const send: ClarityQueue = clarityWindow.clarity ?? function () {
      send.q ??= [];
      // Preserve the official Clarity snippet's arguments queue ABI.
      // eslint-disable-next-line prefer-rest-params
      send.q.push(arguments);
    };

    initializeClarity({
      environment,
      href: window.location.href,
      referrer: document.referrer,
      doNotTrack: navigator.doNotTrack === "1",
      globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true,
      scriptExists: Boolean(document.getElementById(CLARITY_SCRIPT_ID)),
      send,
      loadScript: () => {
        clarityWindow.clarity = send;
        const script = document.createElement("script");
        script.id = CLARITY_SCRIPT_ID;
        script.async = true;
        script.referrerPolicy = "origin";
        script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
        document.head.appendChild(script);
      },
    });
  }, [environment]);

  return null;
}
