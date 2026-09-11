# Canvas 스프레이 배포 환경 성능 측정 결과

## 결론 요약

- Idle에서는 Native와 4× CPU 모두 스프레이 Canvas 프레임이 0이었다. 입력이 없을 때 rAF 루프를 지속 실행하지 않는다.
- Native Slow drag의 렌더 p95 중앙값은 1.3ms, Fast drag는 4.6ms였다.
- Native에서 Slow와 Fast의 포인터 이동 수는 각각 300회와 320회로 비슷하지만, 활성 스탬프 추정 최댓값 중앙값은 110개에서 440개로 증가했다.
- 4× CPU Fast drag의 렌더 p95 중앙값은 19.4ms, 프레임 간격 p95 중앙값은 27.05ms였다.
- 4× CPU Slow drag의 렌더 p95 중앙값은 4.95ms였다. 입력 이벤트 수보다 활성 스탬프를 반복해서 그리는 비용이 주요 병목 후보라는 가설과 일치한다.
- Decay 시나리오에서 입력 종료 후 스탬프가 만료되면 Canvas 프레임 증가도 멈췄다. 무한 rAF 실행 징후는 확인되지 않았다.

## 측정 환경

- 측정 URL: http://127.0.0.1:3000/?spraySeed=20260908
- Git SHA: c5c0f6a
- Chrome: 151.0.7922.175 arm64
- Device: MacBook Pro 14-inch, Apple M3, 24GB
- OS: macOS 14.6 (23G80)
- Viewport: 1512×982
- DPR: 2
- Cache: Warm
- Power: AC 연결, 충전 중
- CPU 조건: Native / Chrome DevTools 4× slowdown

## 측정 방식

- 실제 Google Chrome 바이너리를 화면이 보이는 Chrome 자동화 모드로 실행했다.
- Playwright CDP mouse 입력으로 동일한 좌우 경로를 반복했다.
- 각 조건을 5회 실행하고 Run 01을 워밍업으로 제외했다.
- Run 02~05의 중앙값과 범위를 대표값으로 사용했다.
- 내부 원인 비교용 50회에는 rAF와 Canvas API의 최소 계측 래핑이 포함됐다.
- 별도로 계측 래핑을 끈 Native/4× Fast-drag Clean trace를 수집했다.

## 반복 측정 결과

| CPU | 시나리오 | Pointer moves | Peak active stamps | Render p95 | Frame interval p95 | Long Tasks 범위 |
|---|---|---:|---:|---:|---:|---:|
| native | Idle | 0 | 0 | - | - | 0~0 |
| native | Click | 0 | 5 | 0.3 | 10.2 | 0~0 |
| native | Slow drag | 300 | 110 | 1.3 | 10.25 | 0~0 |
| native | Fast drag | 320 | 440 | 4.6 | 12.1 | 0~0 |
| native | Decay | 160 | 440 | 4.75 | 11.9 | 0~0 |
| 4x | Idle | 0 | 0 | - | - | 0~0 |
| 4x | Click | 0 | 5 | 0.4 | 10.05 | 0~0 |
| 4x | Slow drag | 300 | 110 | 4.95 | 10.35 | 0~0 |
| 4x | Fast drag | 320 | 440 | 19.4 | 27.05 | 0~0 |
| 4x | Decay | 160 | 440 | 19.15 | 26.65 | 0~0 |

## Clean Fast-drag trace

### Native

- 전체 경과 시간: 14066.287ms
- Main thread RunTask 최댓값: 48.39ms
- 50ms 초과 RunTask: 0회
- 분석 제외: trace 시작 시 CpuProfiler::StartProfiling과 겹친 RunTask 1회
- Performance TaskDuration 증가량: 5.885825s
- Performance ScriptDuration 증가량: 4.115668s
- GPU 프로세스 관련 thread RunTask 합계/p95/최댓값: 10981.92ms / 5.98ms / 24.01ms
- Renderer Compositor RunTask 합계/p95/최댓값: 384.28ms / 0.14ms / 0.46ms

### 4× CPU

- 전체 경과 시간: 14192.855ms
- Main thread RunTask 최댓값: 36.18ms
- 50ms 초과 RunTask: 0회
- 분석 제외: trace 시작 시 CpuProfiler::StartProfiling과 겹친 RunTask 1회
- Performance TaskDuration 증가량: 11.916906s
- Performance ScriptDuration 증가량: 8.362902s
- GPU 프로세스 관련 thread RunTask 합계/p95/최댓값: 5249.35ms / 0.46ms / 25.7ms
- Renderer Compositor RunTask 합계/p95/최댓값: 236.81ms / 0.11ms / 0.67ms

위 GPU 관련 수치는 Chrome trace 안의 GPU Process·compositor thread에서 관찰한 작업 횟수와 실행 시간이다. 하드웨어 GPU 전체 사용률(%)은 아니며, 화면 합성과 GPU 프로세스 활동을 뒷받침하는 trace 근거로만 사용한다.

## 해석

### H1. 입력이 없을 때 rAF 루프가 멈추는가?

지지된다. Idle 5회씩에서 스프레이 Canvas의 clearRect와 렌더 프레임이 발생하지 않았다.

### H2. Fast drag 비용은 포인터 이벤트 수보다 활성 스탬프 수의 영향을 크게 받는가?

현재 결과는 이 가설과 일치한다. Slow와 Fast의 포인터 이벤트 수 차이는 작지만, Fast에서 활성 스탬프와 렌더 p95가 함께 크게 증가했다. 다만 상관관계만으로 인과를 확정하지 않고, 다음 최적화 단계에서 스탬프 수 제한 또는 캐싱을 단일 변수로 적용해 재검증한다.

### H3. 거리 기반 보간은 빠른 이동에서 작업량을 늘리는가?

현재 결과와 코드 구조는 이 가설을 지지한다. 동일한 포인터 이동 횟수에서도 이동 거리와 속도가 큰 Fast 경로가 더 많은 동시 활성 스탬프를 만들었다.

### H4. 입력이 끝난 뒤 rAF 루프가 종료되는가?

지지된다. Decay 시나리오에서 스탬프가 만료된 이후 추가 Canvas 프레임이 관찰되지 않았다. 다만 만료 전 약 2.4초 동안은 누적된 스탬프 전체를 다시 그리므로 4× CPU에서 높은 렌더 비용이 유지됐다.

## 측정 한계

- CDP의 자동화된 포인터 경로는 재현성이 높지만 실제 사용자의 물리 마우스 샘플링과 완전히 같지는 않다.
- 활성 스탬프 수는 현재 구현의 스탬프당 파티클 82개와 프레임별 arc 호출 수를 이용한 추정치다.
- 내부 계측 래핑은 작은 오버헤드를 추가할 수 있으므로 절대값은 Clean trace와 함께 해석해야 한다.
- 4× CPU slowdown은 현재 Mac CPU를 상대적으로 느리게 만든 스트레스 조건이며 실제 저사양 기기와 동일하지 않다.
- Performance 패널의 CPU 개요는 Chrome main thread 작업 범주를 시각화한 것이며 시스템 전체 CPU 사용률이 아니다.
- GPU track과 GPU 프로세스 thread 시간은 GPU 경로의 활동 증거이지 하드웨어 GPU 사용률(%)이 아니다. GPU 사용률이 필요하면 Instruments의 Metal System Trace처럼 별도 시스템 계측을 같은 실험으로 수행해야 한다.

## 다음 최적화 실험 후보

1. 최대 활성 스탬프 수 또는 프레임당 생성 스탬프 수 제한
2. 스탬프 파티클을 매 프레임 개별 arc로 그리지 않고 사전 렌더링한 비트맵으로 캐싱
3. 스탬프 객체와 파티클 배열의 재사용으로 할당 및 GC 비용 축소
4. 입력 샘플과 거리 보간 정책 조정
5. DPR과 파티클 밀도의 동적 품질 단계 적용

각 최적화는 한 번에 하나씩 적용하고 동일한 50회 측정을 반복한다.

## 시각 자료

- [렌더 p95 비교](./render-p95-comparison.svg)
- [프레임 간격 p95 비교](./frame-interval-p95-comparison.svg)
- [활성 스탬프와 렌더 p95 관계](./active-stamps-vs-render-p95.svg)
- [Native DevTools CPU/GPU 타임라인](../evidence/devtools/screenshots/native-fast-drag-cpu-gpu-timeline.jpg)
- [4× DevTools CPU/GPU 타임라인](../evidence/devtools/screenshots/4x-fast-drag-cpu-gpu-timeline.jpg)
- [블로그용 핵심 지표 비교](../evidence/blog/headline-fast-drag-comparison.png)
- [최장 앱 작업 주변 1초 비교](../evidence/blog/focused-peak-trace-comparison.png)
- [최장 작업 self-time 구성](../evidence/blog/longest-task-breakdown.png)
- [Idle·Slow·Fast·Decay 설명용 trace](../evidence/blog/phase-trace-comparison.png)

## 원본 자료

- Run별 CSV: [runs.csv](./runs.csv)
- 요약 CSV: [summary.csv](./summary.csv)
- 전체 요약 JSON: [summary.json](./summary.json)
- 계측 원본: ../artifacts/all-results.json
- Clean Native trace: ../artifacts/clean/spray-fast-drag-native-run-01.trace.json.gz
- Clean 4× trace: ../artifacts/clean/spray-fast-drag-4x-run-01.trace.json.gz
