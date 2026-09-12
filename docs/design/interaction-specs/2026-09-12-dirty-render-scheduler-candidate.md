# 3차 최적화 후보 — 변화 기반 렌더 스케줄러

- 상태: 구현·기능 검증 후 검토 요청. 운영 배포 성능 비교 전이며 개선율 미확정.
- 기준: PR #18까지 병합된 main `88328ea`.
- 브랜치: `perf/optimization-03-dirty-render-scheduler`.
- 사용자 결정: PR까지만 생성. main 병합·운영 배포는 사용자가 수행한다.

## 문제 정의

2차 캐시는 유지 중인 자국 32개를 한 surface로 합쳐 한 프레임의 draw 호출을 줄였다. 그러나 자국이 화면에서 전혀 변하지 않는 5.4초 유지 구간에도 `requestAnimationFrame`이 계속 실행되고, 매 프레임 전체 Canvas를 지우고 다시 합성했다. 입력 중인 포인터가 있거나 수명이 남은 자국이 하나라도 있으면 계속 렌더링하는 조건 때문이었다.

이번 후보는 한 프레임의 비용을 다시 줄이는 대신 **시각적 변화가 없는 프레임 자체를 만들지 않는 것**을 검증한다. 하드웨어 GPU 사용률 개선이나 운영 성능 향상은 배포 후 같은 조건의 trace로 별도 판정한다.

## 스케줄 규칙

- 새 자국 입력, 드립 진행, 5.4~6.6초 페이드 구간에는 `requestAnimationFrame`으로 렌더링한다.
- 불투명한 자국만 남아 화면 픽셀이 고정되면 다음 예약 드립·정지 드립·페이드 시작 시각까지 타이머로 휴면한다.
- 포인터가 멈춘 드립, 자국별 예약 드립, 전역 드립 cooldown 중 가장 이른 실제 상태 전환 시각에 다시 깨어난다.
- 지난 예약 시각을 0ms 타이머로 반복 예약하지 않는다.
- 마지막 자국이 만료되어 Canvas를 비운 뒤에는 새 입력 전까지 프레임과 타이머를 모두 중단한다.
- resize, blur, hidden, reduced-motion 변경과 Effect cleanup에서는 예약 프레임·타이머와 기존 자국을 정리한다.

입력 경로·12px 간격·입자·농도·색상·드립 위치와 수·5.4초 유지·1.2초 페이드·총 6.6초 수명은 바꾸지 않는다. 렌더 결과는 기존 `spray-renderer`와 2차 묶음 캐시를 그대로 사용한다.

## 검증 결과

- 스케줄러 단위 테스트 5개와 기존 스프레이 모델·질감·묶음 테스트 15개, 합계 20개 통과.
- production build 실제 페이지에서 클릭 자국을 계측했다. 최초 도포 후 1초 동안 `clearRect` 호출은 `1회 → 1회`로 유지됐고 픽셀 수도 1,970으로 동일했다.
- 페이드 구간에서 호출 수가 다시 증가하고 픽셀이 감소했으며, 6.6초 만료 후 호출 수는 146회에서 멈추고 가시 픽셀은 0이 됐다.
- 1350/1920px 드립·수명, 이동 중 다중 드립, touch 비활성화, reduced-motion 초기/실시간 변경 검사를 통과했다.
- 기존 원본 draw loop와 후보 renderer의 DPR 1/1.5/2 픽셀 비교, ImageBitmap/fallback, 드립·페이드·만료, 메모리 예산·할당 실패·resize 검사를 통과했다.
- 첫 드립 통합 검사 1회에서 무작위 길이 때문에 1920px 하단 증가 임계값을 충족하지 못했으나, 독립 재실행에서 1350px `+59px`, 1920px `+37px`로 통과했다. 스케줄러 상태 검사는 무작위 드립에 의존하지 않도록 별도 고정 시나리오로 구성했다.

위 수치는 브라우저 수명주기 기능 검사다. 운영 환경의 CPU 점유율·rAF p95·Dropped Frame 개선율로 해석하지 않는다.

## 실행

```sh
node --test src/components/main/spray-paint.test.mjs src/components/main/spray-render-schedule.test.mjs src/components/main/spray-stamp-groups.test.mjs src/components/main/spray-texture.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs SPRAY_QA_URL=http://localhost:3002 node scripts/qa-spray-render-schedule.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs SPRAY_QA_URL=http://localhost:3002 node scripts/qa-spray-paint.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/qa-spray-stamp-cache.mjs
pnpm lint
pnpm type-check
pnpm build
```

전체 Node 테스트는 120개 중 119개 통과했다. `main-interaction.test.mjs:42`의 기존 모바일 배경 CSS 정규식 검사 1개는 main과 동일하게 실패하며 이번 변경 범위의 파일이 아니다.

## 배포 후 비교 계획

사용자가 PR을 main에 병합하고 운영 배포를 확인한 뒤 `https://www.2026-knud-graduation.com/`만 사용한다. 이전과 같은 viewport·DPR·4× CPU slowdown·19초 입력 궤적에서 slow/fast를 반복 측정한다. Main thread occupancy, rAF callback p50/p95, long task, frame/dropped frame과 trace 변동 폭을 함께 비교하며 한 번의 최저값으로 개선을 주장하지 않는다.
