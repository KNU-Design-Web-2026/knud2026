# Space Archive 이미지 최적화 기록

- 측정일: 2026-09-26
- 대상: 실제 `/space` 하단 Archive
- 브랜치: `perf/ui-loading-optimization`
- 도구: Lighthouse 13.0.3, Next.js production build
- 조건: Lighthouse 기본 모바일 시뮬레이션, localhost, 각 단계 3회 측정 후 중앙값 비교

## 문제 재현

운영 Archive에 2MB 안팎의 고화질 이미지가 30장 이상 추가될 상황을 가정함. 작은 샘플로는 동시 요청과 디코딩 비용이 드러나지 않으므로 다음과 같이 40장의 결정적 fixture를 생성함.

- 세로형 24장: 3000 × 4000
- 가로형 16장: 4000 × 3000
- 단일 파일: 1.52–2.42MiB
- 전체 원본: 77.72MiB
- 모든 이미지의 픽셀과 파일 해시가 서로 다름
- 생성 명령: `pnpm perf:archive:before`

fixture는 Git에 포함하지 않으며 `.gitignore`의 `/public/performance-fixtures/` 규칙으로 제외함. 같은 명령으로 동일한 테스트 조건을 다시 만들 수 있음.

## 1단계: 전송 포맷과 해상도 분리

원본 한 장을 모든 화면에 그대로 전달하지 않고 빌드 전 파생본 생성기로 다음 후보를 준비함.

- 너비: 480 / 768 / 1080 / 1600px
- AVIF: quality 60, effort 3
- WebP: quality 75, effort 4
- 저해상도 placeholder: 24px JPEG data URL
- 생성 명령: `pnpm perf:archive:after`

브라우저에는 `<picture>`와 `srcset`을 사용하고 실제 카드 너비를 반영한 `sizes`를 전달함.

```text
(max-width: 821px) 46vw,
(max-width: 1700px) 31vw,
515px
```

생성된 후보 전체 용량은 AVIF 11.68MiB, WebP 11.65MiB임. 브라우저는 이 전체를 받지 않고 화면 폭에 맞는 후보 하나만 선택함.

## 2단계: 6장 단위 점진 로딩

포맷만 바꿔도 40개 요청이 동시에 시작되면 네트워크 경쟁과 디코딩 피크가 남음. 이를 줄이기 위해 카드 레이아웃과 실제 이미지 요청을 분리함.

1. 40개 `figure`의 종횡비를 먼저 예약해 전체 스크롤 높이를 고정
2. Archive가 뷰포트 600px 이내로 접근하면 첫 6장 활성화
3. 현재 묶음의 마지막 카드가 뷰포트 800px 이내로 접근하면 다음 6장 활성화
4. 활성화된 묶음은 AVIF/WebP 후보와 24px placeholder를 함께 표시
5. 아직 보이지 않는 카드는 data URL도 적용하지 않아 불필요한 디코딩을 피함
6. `IntersectionObserver` 미지원 환경에서는 전체 이미지를 표시하는 fallback 사용
7. 이미지 등장 효과는 280ms opacity로 제한하고 `prefers-reduced-motion`에서는 제거

배치 크기 6장은 모바일 2열에서는 약 3행, 데스크톱 3열에서는 약 2행에 해당함. 다음 묶음을 800px 앞에서 준비하므로 일반적인 스크롤에서 빈 카드가 먼저 보이지 않으면서 초기 요청 수를 제한함.

## 3단계: 상단 지도 LCP 후보 확인

Archive 요청을 줄인 뒤 Lighthouse의 LCP 대상은 상단 `map-island.svg`로 확인됨. 데스크톱 지도와 compact 지도가 같은 SVG URL을 공유하는데, 먼저 발견된 요청이 낮은 우선순위로 시작하는 상태였음.

- 두 지도 레이아웃 모두 초기 선로드 대상으로 통일
- 실제 LCP 후보인 `map-island.svg`에 `fetchPriority="high"` 지정
- Lighthouse LCP discovery: `priorityHinted false → true`
- 네트워크 우선순위: `Low → High`

숫자만 낮추기 위한 변경이 아니라, 첫 화면에 보이는 핵심 지도 자산의 실제 우선순위를 명시하는 수정임.

## 측정 결과

### 중앙값 비교

| 단계 | Performance | FCP | LCP | TBT | CLS | 전체 전송량 | 전체 요청 | Archive 실파일 요청 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 원본 40장 동시 요청 | 75 | 910ms | 41,783ms | 10ms | 0 | 81,955KiB | 76 | 40 |
| 반응형 AVIF/WebP, 40장 동시 요청 | 75 | 1,058ms | 15,835ms | 28ms | 0 | 3,212KiB | 116 | 40 |
| 반응형 포맷 + 6장 점진 로딩 | 75 | 1,060ms | 12,539ms | 14ms | 0 | 2,515KiB | 48 | 6 |

최종 단계는 원본 기준 전체 전송량을 96.9% 줄였고, 초기 Archive 실파일 요청을 40개에서 6개로 줄임. CLS는 모든 단계에서 0을 유지함. 이미지 포맷만 적용한 단계와 비교해도 초기 전송량은 21.7% 더 감소함.

Performance 점수가 75로 같다는 사실도 함께 기록해야 함. Lighthouse 기본 모바일 시뮬레이션에서 LCP는 개선됐지만 여전히 상단 지도 후보의 시뮬레이션 값이 점수를 지배함. 따라서 전송량 감소를 점수 상승으로 바꾸어 설명하지 않음.

### 최종 3회 원시값

| 회차 | FCP | LCP | TBT | CLS | 전송량 | 전체 요청 | Archive 요청 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1,064ms | 12,539ms | 16ms | 0 | 2,515KiB | 48 | 6 |
| 2 | 1,058ms | 12,608ms | 13ms | 0 | 2,514KiB | 48 | 6 |
| 3 | 1,060ms | 12,535ms | 14ms | 0 | 2,515KiB | 48 | 6 |

## 기능 검증

- 첫 Archive 진입: 실제 `<picture>` 6개
- 첫 배치 경계 접근: 12개
- 이후 경계 접근: 18 → 24 → 30 → 36 → 40개
- 모든 카드의 종횡비를 이미지 요청 전에 예약해 CLS 0 유지
- `node --test src/components/space/space-page.test.mjs` 통과
- `pnpm lint` 통과
- `pnpm type-check` 통과
- `pnpm build` 통과

## 재현 명령

```bash
pnpm perf:archive:before
pnpm perf:archive:after
pnpm build
pnpm exec next start -p 3000
pnpm dlx lighthouse@13.0.3 http://localhost:3000/space \
  --quiet \
  --chrome-flags='--headless --no-sandbox' \
  --output=json \
  --output-path=/tmp/knud-space-run.json \
  --only-categories=performance
```

## 해석 시 주의사항과 다음 측정

- localhost의 Lighthouse 결과는 운영 CDN, 실제 단말, 현장 네트워크를 그대로 대변하지 않음
- Lighthouse의 data URL placeholder도 이미지 항목으로 집계될 수 있으므로 `imageRequests` 전체와 Archive 실파일 요청을 구분함
- 실제 운영 이미지가 확정되면 동일 파이프라인으로 다시 변환하고 시각 품질을 확인해야 함
- 운영 배포 후 모바일 실기기에서 빠른/느린 4G, 연속 스크롤, 메모리 사용량을 추가 측정해야 함
- 최종 검증에서는 Lighthouse 점수 외에도 Chrome Performance의 decode 작업과 Network waterfall을 함께 남길 예정
