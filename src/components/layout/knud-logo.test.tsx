import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { KnudLogo } from "./knud-logo";

test("첫 화면의 IGNITE 로고는 즉시 로드할 수 있다", () => {
  const markup = renderToStaticMarkup(<KnudLogo eager />);
  assert.equal((markup.match(/loading="eager"/g) ?? []).length, 6);
});
