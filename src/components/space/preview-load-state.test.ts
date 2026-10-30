import assert from "node:assert/strict";
import test from "node:test";
import { initialPreviewLoad, previewLoadReducer } from "./preview-load-state";
import { WORK_ITEMS } from "../../data/work-items";
import { SUBMITTED_WORKS } from "../../data/submitted-works";

test("모든 작품은 썸네일이 아닌 SPACE 원본에 대응하는 미리보기를 제공한다", () => {
  for (const work of WORK_ITEMS) {
    assert.ok(work.spacePreviewDataURL?.startsWith("data:image/"), work.artistKo);
    assert.equal(work.spacePreviewDataURL, SUBMITTED_WORKS[work.artistKo]?.space.blurDataURL);
  }
});

test("실패한 요청만 명시적으로 재시도하며 이전 시도의 완료는 무시한다", () => {
  assert.equal(previewLoadReducer(initialPreviewLoad, { type: "retry" }), initialPreviewLoad);
  const failed = previewLoadReducer(initialPreviewLoad, { type: "failed", attempt: 0 });
  const retry = previewLoadReducer(failed, { type: "retry" });
  assert.deepEqual(retry, { attempt: 1, status: "loading", delayed: false });
  assert.equal(previewLoadReducer(retry, { type: "loaded", attempt: 0 }), retry);
  assert.equal(previewLoadReducer(retry, { type: "failed", attempt: 0 }), retry);
  assert.equal(previewLoadReducer(retry, { type: "loaded", attempt: 1 }).status, "ready");
});

test("지연 안내는 진행 중인 시도에만 적용하고 완료 상태를 덮어쓰지 않는다", () => {
  const delayed = previewLoadReducer(initialPreviewLoad, { type: "delayed", attempt: 0 });
  assert.equal(delayed.delayed, true);
  const ready = previewLoadReducer(delayed, { type: "loaded", attempt: 0 });
  assert.deepEqual(ready, { attempt: 0, status: "ready", delayed: false });
  assert.equal(previewLoadReducer(ready, { type: "delayed", attempt: 0 }), ready);
});
