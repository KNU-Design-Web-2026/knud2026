export const CLARITY_PROJECT_ID = "z00yn7m096";
export const CLARITY_SCRIPT_ID = "knud-microsoft-clarity";

export type ClaritySend = (...args: unknown[]) => void;
type ClarityOptions = {
  environment: string | undefined;
  href: string;
  referrer?: string;
  doNotTrack?: boolean;
  globalPrivacyControl?: boolean;
  scriptExists: boolean;
  send: ClaritySend;
  loadScript: () => void;
};

function isPublicPage(url: URL): boolean {
  if (url.protocol !== "https:" || url.port || url.username || url.password || url.search || url.hash ||
    !["www.2026-knud-graduation.com", "2026-knud-graduation.com"].includes(url.hostname)) return false;
  const route = url.pathname.match(/^\/(about|work|profile|space|message)?(?:\/([1-9]\d*))?$/);
  return Boolean(route && (!route[2] || route[1] === "work" || route[1] === "profile"));
}

export function initializeClarity(options: ClarityOptions): boolean {
  if (options.environment !== "production" || options.doNotTrack || options.globalPrivacyControl || options.scriptExists) return false;
  try {
    if (!isPublicPage(new URL(options.href))) return false;
    // DOM masking does not mask URLs. Avoid recording query-bearing entry/referrer URLs.
    if (options.referrer) {
      const referrer = new URL(options.referrer);
      if (!isPublicPage(referrer) &&
        (!/^https?:$/.test(referrer.protocol) || referrer.search || referrer.hash ||
          referrer.username || referrer.password || referrer.pathname !== "/")) return false;
    }
  } catch {
    return false;
  }

  // Queue before loading: no visitor has granted storage consent through this site.
  options.send("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
  options.loadScript();
  return true;
}
