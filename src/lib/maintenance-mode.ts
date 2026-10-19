// Explicit timezone keeps the opening independent of the server's timezone.
export const SITE_OPENS_AT = "2026-10-20T09:00:00+09:00";

export function isMaintenanceMode(now = Date.now()): boolean {
  const mode = process.env.SITE_MAINTENANCE_MODE;
  if (mode === "off") return false;
  if (mode === "on") return true;
  // Default/auto opens at the scheduled instant. Unknown settings fail closed.
  if (mode !== undefined && mode !== "auto") return true;
  return now < Date.parse(SITE_OPENS_AT);
}
