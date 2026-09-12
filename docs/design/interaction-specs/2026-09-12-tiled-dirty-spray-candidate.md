# 4차 최적화 후보 — 타일 기반 변경 영역 합성

- 상태: 구현·기능 검증 후 검토 요청. 운영 배포 성능 비교 전이며 개선율 미확정.
- 기준: PR #19까지 병합된 main `dda672e`.
- 브랜치: `perf/tiled-dirty-spray`.
- 사용자 결정: PR까지만 생성. main 병합·운영 배포는 사용자가 수행한다.

## 문제 정의

3차 변화 기반 렌더 스케줄러는 화면이 정지한 구간의 불필요한 프레임을 제거했다. 하지만 빠르게 드래그하는 동안에는 한 프레임에 새 자국이 많이 추가되고, 드립과 페이드가 진행되는 자국도 함께 존재한다. 이때 기존 renderer는 Canvas 전체를 지운 뒤 살아 있는 모든 자국을 다시 합성한다.

운영 trace의 4× CPU slowdown 빠른 입력에서는 정적 묶음 캐시와 휴면 스케줄러를 적용한 뒤에도 한 렌더 주기의 `drawImage` 호출 p95가 1,647회로 남았다. 따라서 이번 후보는 입자 수·스탬프 간격을 줄여 디자인을 바꾸는 대신, **이미 올바르게 그려진 픽셀의 재합성을 피하는 것**을 검증한다.

## 렌더 규칙

- Canvas 크기나 DPR이 바뀐 첫 프레임만 전체 영역을 비우고 다시 그린다.
- 기존 픽셀이 변하지 않은 상태에서 추가된 최상위 자국은 기존 화면을 지우지 않고 한 번만 그린다.
- 드립 진행·페이드·만료처럼 기존 자국이 변할 때는 이전/현재 경계가 닿는 타일만 무효화한다.
- 타일은 256 device pixels이며, 회전 텍스처의 안티앨리어싱 경계가 잘리지 않도록 2 device pixels를 겹쳐 clip한다.
- 무효화한 타일과 겹치는 캐시 묶음 또는 개별 자국만 원래 생성 순서대로 다시 합성한다.
- 기존 32개 정적 묶음 캐시, 16 MiB 예산, 할당 실패 fallback과 자원 해제 규칙은 유지한다.

입력 경로·12px 스탬프 간격·입자·농도·크기·색상·드립 위치와 수·5.4초 유지·1.2초 페이드·총 6.6초 수명은 바꾸지 않는다. 빠른 입력과 느린 입력의 시각적 밀도를 성능을 위해 다르게 만들지 않는다.

## 기능 및 시각 검증

- DPR 1/1.5/2, Canvas/ImageBitmap 소스, 드립·페이드·만료, 캐시 예산·할당 실패·resize를 원본 draw 순서와 비교했다.
- 첫 렌더는 알 수 없는 목적지 픽셀을 지우고, 변화가 없는 다음 렌더는 clear와 합성을 수행하지 않는다.
- 새 최상위 자국은 clear 없이 한 번만 추가되며 원본 순서로 처음부터 그린 픽셀과 완전히 일치한다.
- 진행 중인 드립은 전체 Canvas보다 작은 타일 집합만 무효화하고, 해당 타일과 겹치지 않는 개별 자국은 다시 그리지 않는다.
- production build 실제 페이지에서 1350/1920px 드립·수명·페이드·만료, 모바일 touch 비활성화, reduced-motion 검사를 통과했다.
- 1350px 결과 캡처에서 타일 경계선이나 자국 절단은 확인되지 않았다. 픽셀 비교는 기존 캐시 허용 기준인 평균 0.25/255 이하, 최대 6/255 이하를 통과했다.

## 로컬 구조 계측

동일한 진단 스크립트의 빠른 입력 1회에서 운영 기준 배포는 `drawImage` 총 616,562회·렌더 주기 중앙값 700회였고, 로컬 후보 두 번은 총 502,683/504,195회·중앙값 398/391회였다. 단일 운영 실행과 로컬 production build는 URL·프로세스·실행 시점이 다르므로 이 차이를 개선율로 확정하지 않는다. 변경 방향이 실제 합성 호출을 줄이는지 확인한 구조적 근거로만 사용한다.

후보에서도 빠른 입력의 렌더 주기 p95는 1,647회로 남았다. 이는 dirty 타일에 많은 자국이 겹치는 최악 구간이 존재한다는 뜻이며, 배포 후 반복 trace에서 Main thread·프레임 지표와 함께 판정해야 한다.

## 실행

```sh
node --test src/components/main/*.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs SPRAY_QA_OUTPUT=/absolute/path/to/evidence node scripts/qa-spray-stamp-cache.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs SPRAY_QA_URL=http://localhost:3012 node scripts/qa-spray-render-schedule.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs SPRAY_QA_URL=http://localhost:3012 node scripts/qa-spray-paint.mjs
pnpm lint
pnpm type-check
pnpm build
```

전체 Node 테스트는 25개 중 24개가 통과했다. `main-interaction.test.mjs:42` 모바일 배경 CSS 정규식 검사 1개는 main에서도 동일하게 실패하는 기존 항목이다. 이번 변경과 관계없는 CSS나 테스트는 수정하지 않는다.

## 배포 후 판정

사용자가 PR을 main에 병합하고 운영 배포를 확인한 뒤 `https://www.2026-knud-graduation.com/`만 사용한다. 기존과 같은 viewport·DPR·4× CPU slowdown·19초 slow/fast 입력을 각각 반복 측정한다.

다음 항목을 이전 배포와 함께 비교한다.

- renderer 주기별 `drawImage` 총량과 p50/p95
- Main thread occupancy와 rAF callback p50/p95
- Frame/Dropped Frame과 long task
- 결과 변동 폭 및 캡처 영상의 동일한 자국 밀도

합성 호출 감소가 반복되더라도 프레임 지표가 개선되지 않으면 CPU 호출 수가 사용자 체감의 지배 원인은 아니었다고 기록한다. 한 번의 최저값이나 로컬 수치만으로 운영 성능 개선을 주장하지 않는다.
