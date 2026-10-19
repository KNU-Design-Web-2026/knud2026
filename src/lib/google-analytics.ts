export const GA_MEASUREMENT_ID = "G-J9DDCHCRMF";

export type AnalyticsSend = (...args: unknown[]) => void;
type AnalyticsOptions = {
  environment: string | undefined;
  referrer?: string;
  doNotTrack?: boolean;
  globalPrivacyControl?: boolean;
  send: AnalyticsSend;
  loadScript: () => void;
};

export function createAnalyticsTracker(options: AnalyticsOptions) {
  let previousPage = "";
  let initialized = false;
  let referrer = "";
  try {
    const url = new URL(options.referrer ?? "");
    if (url.protocol === "https:" || url.protocol === "http:") referrer = `${url.origin}/`;
  } catch {
    // Missing or invalid referrers are normal for direct visits.
  }

  return (href: string): boolean => {
    if (options.environment !== "production" || options.doNotTrack || options.globalPrivacyControl) return false;
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      return false;
    }
    if (url.protocol !== "https:" || url.port || url.username || url.password ||
      !["www.2026-knud-graduation.com", "2026-knud-graduation.com"].includes(url.hostname)) return false;

    const route = url.pathname.match(/^\/(about|work|profile|space|message)?(?:\/([1-9]\d*))?$/);
    if (!route || (route[2] && route[1] !== "work" && route[1] !== "profile")) return false;
    const titles: Record<string, string> = {
      about: "ABOUT", work: "WORKS", profile: "PROFILE", space: "SPACE", message: "MESSAGE",
    };
    const page = `${url.origin}${url.pathname}`;
    if (page === previousPage) return false;
    const context = {
      page_location: page,
      page_referrer: previousPage || referrer,
      page_title: `${titles[route[1]] ?? "IGNITE"} | KNUD 2026`,
    };
    if (!initialized) {
      options.send("consent", "default", {
        ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
      });
      options.send("js", new Date());
    }
    // Set before config: target-scoped page fields would override later SPA updates.
    options.send("set", context);
    if (!initialized) {
      options.send("config", GA_MEASUREMENT_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }
    options.send("event", "page_view", { send_to: GA_MEASUREMENT_ID, ...context });
    previousPage = page;
    if (!initialized) {
      initialized = true;
      options.loadScript();
    }
    return true;
  };
}
