"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isAllowedQaHubOrigin,
  isQaRouteScrollCommand,
  isQaRouteSubscribeMessage,
  QA_ROUTE_READY_EVENT,
  QA_ROUTE_STATE_EVENT,
  type QaRouteStateMessage,
} from "@/lib/qa-route-bridge";

const QA_HUB_ORIGIN = process.env.NEXT_PUBLIC_QA_HUB_ORIGIN;

export function QaRouteBridge() {
  const pathname = usePathname();
  const [hubOrigin, setHubOrigin] = useState<string | null>(null);

  useEffect(() => {
    if (!QA_HUB_ORIGIN || window.parent === window) return;

    window.parent.postMessage(
      { type: QA_ROUTE_READY_EVENT, version: 1 },
      QA_HUB_ORIGIN,
    );

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (
        event.source !== window.parent ||
        !isAllowedQaHubOrigin(event.origin, QA_HUB_ORIGIN)
      ) {
        return;
      }
      if (isQaRouteSubscribeMessage(event.data)) {
        setHubOrigin(event.origin);
        return;
      }
      if (isQaRouteScrollCommand(event.data)) {
        setHubOrigin(event.origin);
        window.scrollTo({
          left: event.data.scrollX,
          top: event.data.scrollY,
          behavior: "auto",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!hubOrigin || !pathname) return;

    const sendState = () => {
      const message: QaRouteStateMessage = {
        type: QA_ROUTE_STATE_EVENT,
        version: 1,
        pathname,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      };
      window.parent.postMessage(message, hubOrigin);
    };
    sendState();
    window.addEventListener("scroll", sendState, { passive: true });
    return () => window.removeEventListener("scroll", sendState);
  }, [hubOrigin, pathname]);

  return null;
}
