export const QA_ROUTE_SUBSCRIBE_EVENT = "knud.qa/subscribe-route";
export const QA_ROUTE_READY_EVENT = "knud.qa/route-ready";
export const QA_ROUTE_STATE_EVENT = "knud.qa/route-state";
export const QA_ROUTE_SCROLL_EVENT = "knud.qa/scroll-to";

export type QaRouteSubscribeMessage = {
  type: typeof QA_ROUTE_SUBSCRIBE_EVENT;
  version: 1;
};

export type QaRouteStateMessage = {
  type: typeof QA_ROUTE_STATE_EVENT;
  version: 1;
  pathname: string;
  scrollX: number;
  scrollY: number;
};

export type QaRouteScrollCommand = {
  type: typeof QA_ROUTE_SCROLL_EVENT;
  version: 1;
  scrollX: number;
  scrollY: number;
};

export type QaRouteReadyMessage = {
  type: typeof QA_ROUTE_READY_EVENT;
  version: 1;
};

export function isQaRouteSubscribeMessage(
  value: unknown,
): value is QaRouteSubscribeMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QaRouteSubscribeMessage>;
  return (
    candidate.type === QA_ROUTE_SUBSCRIBE_EVENT && candidate.version === 1
  );
}

export function isQaRouteReadyMessage(
  value: unknown,
): value is QaRouteReadyMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QaRouteReadyMessage>;
  return candidate.type === QA_ROUTE_READY_EVENT && candidate.version === 1;
}

export function isQaRouteScrollCommand(
  value: unknown,
): value is QaRouteScrollCommand {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QaRouteScrollCommand>;
  return (
    candidate.type === QA_ROUTE_SCROLL_EVENT &&
    candidate.version === 1 &&
    typeof candidate.scrollX === "number" &&
    Number.isFinite(candidate.scrollX) &&
    candidate.scrollX >= 0 &&
    typeof candidate.scrollY === "number" &&
    Number.isFinite(candidate.scrollY) &&
    candidate.scrollY >= 0
  );
}

export function isAllowedQaHubOrigin(
  origin: string,
  configuredHubOrigin: string | undefined,
) {
  if (!configuredHubOrigin) return false;

  try {
    return new URL(origin).origin === new URL(configuredHubOrigin).origin;
  } catch {
    return false;
  }
}
