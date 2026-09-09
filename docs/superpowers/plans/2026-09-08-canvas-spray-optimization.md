# Canvas Spray Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스프레이의 밀도와 질감을 유지하면서 빠른 드래그의 Canvas 렌더링 비용을 줄이고 동일한 E2E 환경의 전후 증거를 남긴다.

**Architecture:** 스탬프 생성·경로 보간·만료 정리를 순수 모듈로 분리해 결정론적으로 검증한다. 렌더러는 생성 시 만든 `Path2D` 캐시를 재사용하고, 시각 동일성 테스트를 통과한 변경만 기존 E2E 측정기로 Native와 CPU 4× 환경에서 재측정한다.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Canvas 2D, Node test runner, Playwright/CDP, Chrome Performance trace

**Spec:** `docs/design/canvas-spray-optimization.md`

## Global Constraints

- 입자 82개, 12px 스탬프 간격, 색상, 난수 분포, 드립과 2.4초 수명을 유지한다.
- 스탬프 또는 입자 수를 줄이는 적응형 품질 조절은 사용하지 않는다.
- 기준선 `cbc8a733e43ba43878bbae81aafa7f6b2f8bc0e9`의 자료를 덮어쓰지 않는다.
- 성능 변경마다 구조 테스트와 시각 동일성 검증을 먼저 통과한다.
- 새로운 런타임 의존성을 추가하지 않는다.

---

### Task 1: 결정론적 스탬프 모델과 구조 회귀 테스트

**Files:**
- Create: `src/components/main/spray-model.ts`
- Create: `src/components/main/spray-model.test.ts`
- Modify: `src/components/main/spray-canvas.tsx`

**Interfaces:**
- Produces: `createSprayStamp(point, createdAt, direction, color, random): SprayStamp`
- Produces: `compactActiveStamps(stamps, now, duration): number`
- Produces: `interpolateSprayPath(previous, next, spacing, maxSteps): SprayPathResult`

- [ ] **Step 1: 고정 난수열로 스탬프 속성을 검증하는 실패 테스트 작성**

  `node:test`와 `node:assert/strict`로 입자 수, 중심 크기, 첫·마지막 입자, 드립과 경계점이 고정 fixture와 일치하는지 작성한다.

- [ ] **Step 2: 테스트가 모듈 부재로 실패하는지 확인**

  Run: `node --test src/components/main/spray-model.test.ts`
  Expected: FAIL because `spray-model.ts` does not exist.

- [ ] **Step 3: 현재 생성 수식을 그대로 순수 모듈로 이동**

  `Math.random`을 기본 인자로 유지하되 테스트에서는 순환 난수 함수를 주입한다. 수식이나 상수는 변경하지 않는다.

- [ ] **Step 4: 컴포넌트가 새 모델을 사용하도록 연결하고 테스트 실행**

  Run: `node --test src/components/main/spray-model.test.ts && pnpm type-check`
  Expected: PASS and no TypeScript errors.

- [ ] **Step 5: 구조 분리 커밋**

  Commit: `refactor(spray): 스탬프 모델을 결정론적으로 분리`

### Task 2: 제자리 만료 정리와 크기 캐시

**Files:**
- Modify: `src/components/main/spray-model.ts`
- Modify: `src/components/main/spray-model.test.ts`
- Modify: `src/components/main/spray-canvas.tsx`

**Interfaces:**
- Consumes: `compactActiveStamps(stamps, now, duration): number`
- Produces: 원래 배열의 생존 요소 순서를 유지하고 활성 길이를 반환하는 만료 정리

- [ ] **Step 1: `filter()`와 동일한 생존 결과·순서를 요구하는 실패 테스트 작성**
- [ ] **Step 2: 테스트가 미구현 함수로 실패하는지 확인**
- [ ] **Step 3: read/write 인덱스로 배열을 제자리 압축하고 길이를 자르는 최소 구현 작성**
- [ ] **Step 4: Hero 크기를 ResizeObserver에서 저장하고 렌더 루프의 레이아웃 조회 제거**
- [ ] **Step 5: 테스트, type-check와 lint 실행**

  Run: `node --test src/components/main/spray-model.test.ts && pnpm type-check && pnpm lint`
  Expected: all commands succeed.

- [ ] **Step 6: 할당·조회 최적화 커밋**

  Commit: `perf(spray): 프레임별 배열 할당과 크기 조회를 제거`

### Task 3: Path2D 입자 경로 캐시

**Files:**
- Create: `src/components/main/spray-path-cache.ts`
- Create: `src/components/main/spray-path-cache.test.ts`
- Modify: `src/components/main/spray-canvas.tsx`

**Interfaces:**
- Produces: `groupParticlesByAlpha(particles): SprayParticleGroup[]`
- Produces: `createParticlePathCache(stamp): SprayParticlePath[]`
- Each cached item preserves the exact original alpha and contains every original circle once.

- [ ] **Step 1: 모든 입자가 정확히 한 그룹에 속하고 원래 알파가 유지되는 실패 테스트 작성**
- [ ] **Step 2: 테스트가 캐시 모듈 부재로 실패하는지 확인**
- [ ] **Step 3: 동일 알파별 입자를 묶는 순수 그룹 함수 구현**
- [ ] **Step 4: 브라우저에서 그룹별 `Path2D`를 한 번 생성하고 프레임에서는 `fill(path)`만 호출**
- [ ] **Step 5: 기존 중심 형태와 드립 렌더링을 변경하지 않았는지 검증**
- [ ] **Step 6: 테스트, type-check, lint와 build 실행**

  Run: `node --test src/components/main/spray-model.test.ts src/components/main/spray-path-cache.test.ts && pnpm type-check && pnpm lint && pnpm build`
  Expected: all commands succeed.

- [ ] **Step 7: 경로 캐시 최적화 커밋**

  Commit: `perf(spray): 입자 경로를 스탬프 생성 시 캐시`

### Task 4: 고정 입력 시각 동일성 하네스

**Files:**
- Create: `performance/spray/visual-regression/capture-spray-visuals.cjs`
- Create: `performance/spray/visual-regression/compare-images.cjs`
- Create: `performance/spray/visual-regression/README.md`
- Modify: `src/components/main/spray-canvas.tsx`

**Interfaces:**
- Query parameter: `spraySeed=<unsigned integer>` enables deterministic random only for evidence capture.
- Produces: before, after and diff PNG plus JSON containing changed pixel count and ratio.

- [ ] **Step 1: 같은 seed가 같은 스탬프 데이터를 만들고 다른 seed가 다른 결과를 만드는 실패 테스트 작성**
- [ ] **Step 2: seed 파서와 PRNG를 모델 모듈에 최소 구현**
- [ ] **Step 3: 고정 CDP 입력 경로와 캡처 스크립트 작성**
- [ ] **Step 4: 기준 커밋과 최적화 브랜치의 캡처를 같은 뷰포트·DPR에서 생성**
- [ ] **Step 5: PNG diff와 메타데이터를 `performance/spray/optimized/evidence/visual-diff/`에 저장**
- [ ] **Step 6: 시각 검증 하네스 커밋**

  Commit: `test(spray): 고정 입력 시각 동일성 검증을 추가`

### Task 5: 최적화용 측정기와 메타데이터 분리

**Files:**
- Modify: `performance/spray/run-deployed-baseline.cjs`
- Modify: `performance/spray/analyze-results.cjs`
- Create: `performance/spray/comparison/compare-results.cjs`
- Create: `performance/spray/optimized/README.md`

**Interfaces:**
- Environment: `SPRAY_TARGET_URL`, `SPRAY_OUTPUT_DIR`, `SPRAY_RUNS`, `SPRAY_MODE`, `SPRAY_SCENARIO`
- Produces: scenario metrics, trace, environment metadata, before/after delta JSON and CSV.

- [ ] **Step 1: 임의 출력 디렉터리를 분석할 수 없는 현재 동작을 재현하는 실패 테스트 작성**
- [ ] **Step 2: analyzer가 입력·출력 경로 환경 변수를 받도록 수정**
- [ ] **Step 3: 기준선과 최적화 결과의 절대값·백분율 변화를 계산하는 비교기 작성**
- [ ] **Step 4: Git SHA, URL, Chrome, viewport, DPR, throttling과 실행 시각 기록 추가**
- [ ] **Step 5: smoke 1회로 결과 파일 스키마 검증**
- [ ] **Step 6: 측정 자동화 커밋**

  Commit: `test(performance): 스프레이 전후 비교 측정기를 구성`

### Task 6: 로컬 프로덕션 검증과 배포 전 증거

**Files:**
- Create: `performance/spray/optimized/evidence/VALIDATION.md`
- Create: `performance/spray/optimized/evidence/screenshots/*.png`
- Create: `performance/spray/optimized/evidence/videos/*.mp4`

**Interfaces:**
- Consumes: optimized production build and deterministic visual harness.
- Produces: local smoke metrics, screenshots, videos and validation log.

- [ ] **Step 1: `pnpm build` 후 프로덕션 서버 실행**
- [ ] **Step 2: Idle, Click, Slow drag, Fast drag, Decay를 Native·CPU 4×에서 각 1회 smoke 실행**
- [ ] **Step 3: Chrome Performance의 Main, Frames, GPU Process가 보이는 캡처 저장**
- [ ] **Step 4: Native·CPU 4× 빠른 드래그와 소멸 영상을 저장**
- [ ] **Step 5: 캡처 조건과 파일별 의미를 VALIDATION.md에 기록**
- [ ] **Step 6: 로컬 검증 증거 커밋**

  Commit: `docs(performance): 스프레이 최적화 검증 증거를 기록`

### Task 7: 동일 배포 환경 50회 재측정과 전후 분석

**Files:**
- Create: `performance/spray/optimized/artifacts/**`
- Create: `performance/spray/optimized/report/**`
- Create: `performance/spray/comparison/results.md`
- Create: `performance/spray/comparison/*.png`

**Interfaces:**
- Consumes: immutable optimized deployment URL and SHA.
- Produces: 5 scenarios × 2 CPU modes × 5 runs, trace evidence and comparison report.

- [ ] **Step 1: 최적화 배포 URL과 Git SHA가 일치하는지 기록**
- [ ] **Step 2: 전원 연결·No throttling·1512×982·DPR 2 조건을 확인**
- [ ] **Step 3: 전체 50회 E2E 실행 및 원시 metrics 저장**
- [ ] **Step 4: 각 조합의 Run 02~05 중앙값·범위를 생성**
- [ ] **Step 5: Native·CPU 4× clean trace와 Chrome Performance 캡처 생성**
- [ ] **Step 6: 렌더 p95, 간격 p95, 20ms 초과, Canvas 호출, heap과 trace 변화 그래프 생성**
- [ ] **Step 7: 시각 동일성 결과와 성능 변화 해석을 results.md에 작성**
- [ ] **Step 8: 최종 증거 커밋**

  Commit: `docs(performance): 동일 환경의 최적화 전후 결과를 정리`

### Task 8: 최종 품질 확인

**Files:**
- Modify: `docs/architecture/adr/0003-use-pressure-assisted-layered-spray-rendering.md`

**Interfaces:**
- Consumes: implementation, visual diff and deployed performance comparison.
- Produces: implemented performance boundary and measured trade-off documentation.

- [ ] **Step 1: ADR의 상태와 실제 구현·측정 결과 갱신**
- [ ] **Step 2: 관련 Node tests, type-check, lint와 build 실행**
- [ ] **Step 3: `git diff --check`와 전체 변경 파일 검토**
- [ ] **Step 4: 비밀값, 임시 로그와 무관 파일이 없는지 확인**
- [ ] **Step 5: 문서 갱신 커밋**

  Commit: `docs(adr): 스프레이 최적화 검증 결과를 반영`
