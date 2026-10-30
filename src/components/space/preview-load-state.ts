export type PreviewLoad = { attempt: number; status: "loading" | "ready" | "error"; delayed: boolean };
export type PreviewLoadEvent = { type: "loaded" | "failed" | "delayed"; attempt: number } | { type: "retry" };
export const initialPreviewLoad: PreviewLoad = { attempt: 0, status: "loading", delayed: false };
export function previewLoadReducer(state: PreviewLoad, event: PreviewLoadEvent): PreviewLoad {
  if (event.type === "retry") {
    return state.status === "error" ? { attempt: state.attempt + 1, status: "loading", delayed: false } : state;
  }
  if (event.attempt !== state.attempt || state.status !== "loading") return state;
  if (event.type === "delayed") return { ...state, delayed: true };
  return { ...state, status: event.type === "loaded" ? "ready" : "error", delayed: false };
}
