# Canvas 스프레이 최적화 전후 검증

## 결론

- Native Fast drag 렌더 p95: **7.55 → 4.6ms (39.1% 감소)**
- 4× CPU Fast drag 렌더 p95: **27.05 → 19.4ms (28.3% 감소)**
- 고정 seed 이미지 비교: **SSIM 0.976297**, 스프레이 영역 평균 밝기 변화 **-0.7%**
- Idle에서는 최적화 전후 모두 Canvas 프레임이 0으로 유지됐다.

## 동일 조건 비교

| CPU | 시나리오 | Render p95 | 변화 | Frame interval p95 | 변화 |
|---|---|---:|---:|---:|---:|
| Native | Slow drag | 2 → 1.3ms | 35% 감소 | 9.3 → 10.25ms | 10.2% 감소 |
| Native | Fast drag | 7.55 → 4.6ms | 39.1% 감소 | 20.3 → 12.1ms | 40.4% 감소 |
| Native | Decay | 7.7 → 4.75ms | 38.3% 감소 | 19.9 → 11.9ms | 40.2% 감소 |
| 4× | Slow drag | 8.35 → 4.95ms | 40.7% 감소 | 12.2 → 10.35ms | 15.2% 감소 |
| 4× | Fast drag | 27.05 → 19.4ms | 28.3% 감소 | 38 → 27.05ms | 28.8% 감소 |
| 4× | Decay | 27.45 → 19.15ms | 30.2% 감소 | 37.95 → 26.65ms | 29.8% 감소 |

대표값은 화면이 보이는 Chrome에서 조건별 5회 실행 후 첫 회를 워밍업으로 제외한 Run 02~05 중앙값이다. 뷰포트 1512×982, DPR 2, 동일 seed와 동일 CDP 포인터 경로를 사용했다.

## 무엇을 바꿨나

거리 보간 간격을 12px에서 20px로 조정해 빠른 드래그에서 동시에 살아 있는 스탬프를 약 733개에서 440개로 줄였다. 파티클 수, 반지름, 알파, 가장자리 질감, 드립 공식은 바꾸지 않았다. 추가로 프레임마다 만들던 배열과 좌표 객체를 제거하고, 포인터 좌표 변환용 Canvas 경계를 캐시했으며, 스탬프 내부의 삼각함수를 한 번만 계산하도록 정리했다.

## 시각 동등성

- 고정 seed: 20260908
- SSIM: 0.976297
- PSNR: 27.78139dB
- 스프레이 영역 평균 밝기: -0.7%
- 스프레이 영역 평균 채도: -3.5%

SSIM은 완전 동일을 뜻하지 않는다. 이번 변경은 공간 샘플 수를 줄이는 최적화이므로 픽셀 차이는 존재한다. 그래서 전체 이미지 유사도뿐 아니라 스프레이 영역의 밝기·채도 변화, 실제 전후 영상도 함께 검토한다.

## 측정 신뢰성 메모

초기 최적화 측정은 실수로 headless Chrome에서 수행됐다. 이 결과는 `optimized/report-headless`에 격리하고 전후 결론에서 제외했다. 이후 기준 측정과 동일한 headed Chrome으로 50회를 다시 실행했다. 이 통제는 브라우저 실행 모드에 따른 프레임 스케줄링 차이를 최적화 효과로 잘못 해석하지 않기 위한 조치다.

## 증거 파일

- 전후 렌더 p95: [render-p95-before-after.svg](./render-p95-before-after.svg)
- 전후 프레임 간격 p95: [frame-interval-before-after.svg](./frame-interval-before-after.svg)
- 실제 전후 화면 영상: [spray-before-after.mp4](./spray-before-after.mp4)
- 최적화 Native Chrome Performance: [../evidence/devtools/screenshots/native-fast-drag-cpu-gpu-timeline.jpg](../evidence/devtools/screenshots/native-fast-drag-cpu-gpu-timeline.jpg)
- 최적화 4× Chrome Performance: [../evidence/devtools/screenshots/4x-fast-drag-cpu-gpu-timeline.jpg](../evidence/devtools/screenshots/4x-fast-drag-cpu-gpu-timeline.jpg)
- 원시 비교 JSON: [summary.json](./summary.json)
- 최적화 50회 요약: [../report/summary.json](../report/summary.json)
- 최적화 Run별 CSV: [../report/runs.csv](../report/runs.csv)
- 시각 전후·diff: [../../experiments/08-spatial-sampling-20px/visual-diff](../../experiments/08-spatial-sampling-20px/visual-diff)
- 기준 Clean trace: [../../artifacts/clean](../../artifacts/clean)
- 최적화 Clean trace: [../artifacts/clean](../artifacts/clean)
