# 같은 스프레이 질감을 유지하면서 렌더 비용을 39% 줄인 과정

앞선 측정에서는 KNUD 메인 페이지의 Fast drag에서 활성 스탬프가 Native 기준 733개까지 쌓였고, Render p95와 Frame interval p95가 각각 7.55ms와 20.30ms까지 증가하는 것을 확인했다. 입력 이벤트 수보다 만료 전 스탬프를 매 프레임 다시 그리는 양이 비용과 더 가깝게 움직였다.

이제 목표는 단순히 숫자를 낮추는 것이 아니었다.

> 스프레이의 밀도와 거친 질감을 유지하면서, 한 프레임에 다시 그리는 작업량만 줄일 수 있을까?

파티클 수나 알파를 크게 낮추면 성능은 쉽게 좋아진다. 하지만 전시 사이트에서 시각 결과가 달라진다면 같은 기능을 더 빠르게 만든 최적화라기보다 품질을 낮춘 교환에 가깝다. 그래서 성능과 시각 동등성을 동시에 통과하는 변경만 채택하기로 했다.

## 먼저 바꾸지 않을 것을 정했다

이번 실험에서 다음 값은 유지했다.

- 스탬프당 파티클 수
- 파티클 반지름과 알파 분포
- 가장자리의 불규칙한 번짐
- 아래로 흐르는 드립의 확률과 모양
- 스탬프 수명

대신 포인터의 두 좌표 사이에 스탬프를 놓는 공간 샘플링과, 렌더 루프 내부의 불필요한 계산을 조정했다.

## 여덟 개의 후보 중 하나만 채택했다

`Path2D` 재사용, 알파 버킷, 객체 풀, 프레임 페이싱 등을 하나씩 적용하고 같은 Fast drag로 비교했다. 결과가 나빠진 실험도 삭제하지 않고 별도 디렉터리에 남겼다.

| 실험 | 결과 |
|---|---|
| Path2D per alpha | 시각 차이는 작았지만 Render p95 악화 |
| Path2D 16 buckets | 호출 수는 줄었지만 Frame interval 악화 |
| Adaptive frame pacing | 입력과 출력 타이밍이 달라져 비교 조건 훼손 |
| Object pooling | 반복 측정에서 개선이 안정적으로 재현되지 않음 |
| Alpha batching | 정렬·그룹 비용이 절감 이득보다 큼 |
| Stable global batching | Native interval은 개선됐지만 4× 렌더 비용 악화 |
| 24px 공간 샘플링 | 성능은 좋았지만 시각 변화가 더 큼 |
| **20px 공간 샘플링** | **성능 개선과 시각 유사도의 균형으로 채택** |

실패 후보를 보존한 이유는 “어떤 최적화 기법을 사용했다”보다 “이 렌더러에서는 무엇이 실제로 빨라졌는가”가 더 중요했기 때문이다.

## 핵심 변경: 12px마다 찍던 스탬프를 20px마다 찍었다

기존 구현은 포인터가 이동한 두 점 사이를 12px 간격으로 보간했다. 빠르게 왕복하면 포인터 이벤트 수가 비슷해도 한 이벤트 사이 이동 거리가 길어지고, 그 사이에 더 많은 스탬프가 생겼다.

```ts
// before
const steps = getStampStepCount(distance, 12);

// after
const steps = getStampStepCount(distance, 20);
```

Fast drag의 Peak active stamps는 Native에서 733개에서 440개로 약 40% 감소했다. 파티클 모양을 단순화한 것이 아니라 같은 스탬프를 경로 위에 놓는 빈도를 조정한 것이다.

## 렌더 루프 안의 작은 낭비도 함께 걷어냈다

공간 샘플링 외에는 시각 결과를 바꾸지 않는 계산만 정리했다.

- 프레임마다 `filter()`로 새 배열을 만들지 않고 살아 있는 스탬프만 제자리 압축
- 보간마다 `{ x, y }` 객체를 만들지 않고 숫자 좌표를 바로 전달
- 포인터 이벤트마다 `getBoundingClientRect()`를 읽지 않고 Canvas 경계를 캐시
- 한 스탬프 안에서 반복하던 `sin`·`cos` 계산을 한 번만 수행
- 사용하지 않는 `strokeStyle` 설정 제거

이 변경들은 각각의 효과가 작거나 노이즈 안에 들어갔다. 하지만 공간 샘플링과 함께 적용했을 때 hot path에서 할당과 중복 계산을 늘리지 않는 구조를 만들었다.

## 최적화 전후를 같은 50회로 다시 측정했다

측정 조건을 새로 만들지 않고 기준선과 같은 환경을 사용했다.

```text
2 CPU 조건 × 5 시나리오 × 5회 = 50회
```

- 화면이 보이는 동일 Chrome 바이너리
- Viewport 1512×982, DPR 2
- 같은 seed `20260908`
- 같은 CDP 포인터 좌표와 입력 시간
- Run 01 워밍업 제외
- Run 02~05 중앙값 비교

첫 최적화 측정을 headless Chrome으로 잘못 실행한 사실도 확인했다. headless 결과는 별도로 격리했고, 기준선과 실행 모드가 다른 값은 전후 결론에서 제외한 뒤 headed Chrome 50회를 다시 수행했다.

## 성능 결과

| CPU | 시나리오 | Render p95 | Frame interval p95 |
|---|---|---:|---:|
| Native | Slow drag | 2.00 → 1.30ms | 9.30 → 10.25ms |
| Native | **Fast drag** | **7.55 → 4.60ms** | **20.30 → 12.10ms** |
| Native | Decay | 7.70 → 4.75ms | 19.90 → 11.90ms |
| 4× | Slow drag | 8.35 → 4.95ms | 12.20 → 10.35ms |
| 4× | **Fast drag** | **27.05 → 19.40ms** | **38.00 → 27.05ms** |
| 4× | Decay | 27.45 → 19.15ms | 37.95 → 26.65ms |

Native Fast drag의 Render p95는 39.1%, Frame interval p95는 40.4% 감소했다. 4× CPU에서는 각각 28.3%, 28.8% 감소했다. Native Fast drag의 p95 프레임 간격이 16.7ms 아래로 내려온 것이 가장 직접적인 변화였다.

<!-- IMAGE: performance/spray/optimized/comparison/render-p95-before-after.png -->

<!-- IMAGE: performance/spray/optimized/comparison/frame-interval-before-after.png -->

## 실제 Chrome Performance에서도 다시 확인했다

내부 계측 래핑을 끈 Clean trace를 Native와 4× CPU에서 별도로 수집했다. 그 trace를 Chrome Performance 패널에 직접 import해 CPU 개요, Frames, Main thread, Scripting과 Painting 구성을 확인했다.

<!-- IMAGE: performance/spray/optimized/evidence/devtools/screenshots/native-fast-drag-cpu-gpu-timeline.jpg -->

_최적화 후 Native Clean trace. Chrome Performance 패널의 전체 Fast drag 구간이다._

<!-- IMAGE: performance/spray/optimized/evidence/devtools/screenshots/4x-fast-drag-cpu-gpu-timeline.jpg -->

_최적화 후 4× CPU Clean trace. 같은 입력이 느린 CPU 조건에서 어떻게 분포하는지 확인했다._

Performance의 CPU 개요는 시스템 전체 CPU 사용률이 아니고, GPU track도 하드웨어 GPU 사용률을 뜻하지 않는다. 여기서는 Chrome trace 안에서 메인 스레드와 합성 경로가 언제 활동했는지 확인하는 감사 자료로 사용했다.

## 시각 결과는 픽셀과 영상으로 함께 검증했다

같은 seed와 같은 입력으로 최적화 전후 Canvas를 캡처했다.

| 지표 | 결과 |
|---|---:|
| SSIM | 0.976297 |
| PSNR | 27.78139dB |
| 스프레이 영역 평균 밝기 | -0.7% |
| 스프레이 영역 평균 채도 | -3.5% |

SSIM이 1이 아니므로 픽셀은 완전히 같지 않다. 공간 샘플 수를 줄인 최적화이기 때문에 차이는 예상된 결과다. 그래서 전체 유사도 하나로 끝내지 않고 스프레이 영역의 밝기·채도와 실제 전후 영상을 함께 확인했다.

여기서 한 번 더 검증 장치를 두었다. 같은 checkout에서 `legacy=12px`, `optimized=20px`만 전환하고, 캡처 직후 활성 스탬프가 `131개`와 `79개`로 실제로 달랐는지 기록했다. 두 이미지 SHA-256이 같으면 SSIM을 계산하기 전에 실패시켰다. 실제로 최종 점검 중 오래된 서버가 두 query에 같은 번들을 응답해 SSIM 1.0이 나온 오류를 이 검사로 발견했고, 최신 번들에서 다시 촬영했다. 완벽해 보이는 숫자가 오히려 비교 실패의 신호일 수 있었던 셈이다.

<!-- VIDEO: performance/spray/optimized/comparison/spray-before-after.mp4 -->

_왼쪽은 12px 기준 구현, 오른쪽은 20px 최적화 구현이다. 같은 경로를 동시에 비교한다._

## 이번 최적화가 보여 준 것

Canvas 성능 문제를 “파티클이 많아서 느리다”로만 보면 가장 먼저 파티클 수를 줄이게 된다. 하지만 이번 병목은 파티클의 모양보다 빠른 이동 경로에서 만들어지는 동시 활성 스탬프 수에 있었다.

그래서 시각 공식을 건드리지 않고 공간 샘플링을 조절하는 편이 더 적합했다. 그 결과 Native Fast drag를 60Hz 프레임 예산 안으로 내리면서도 스프레이의 거친 가장자리와 드립 인상을 유지할 수 있었다.

무엇보다 전후 수치만 남기지 않았다. 실패 실험, 잘못된 headless 실행, 원시 JSON·CSV, Clean trace, DevTools 캡처, 고정 seed 이미지와 실제 영상까지 연결했다. 최적화의 결론을 Agent의 문장이 아니라 다시 열어 볼 수 있는 증거로 남기는 것이 이번 작업의 마지막 단계였다.
