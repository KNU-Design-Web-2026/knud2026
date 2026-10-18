import React from "react";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import nextConfig from "../../../../next.config.ts";
import { WorkDetailPage } from "../../../components/work/work-detail-page.tsx";

const require = createRequire(import.meta.url);
const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime.js");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config.js");
const projectConfig = nextConfig.default ?? nextConfig;

// Standalone SSR does not receive Next's injected image configuration. Use the
// real project config so quality 95 is tested instead of silently clamped to 75.
export function renderWorkDetail(detail) {
  return renderToStaticMarkup(React.createElement(ImageConfigContext.Provider, {
    value: { ...imageConfigDefault, ...projectConfig.images },
  }, React.createElement(WorkDetailPage, { detail })));
}
