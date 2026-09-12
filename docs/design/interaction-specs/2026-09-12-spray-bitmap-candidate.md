# 스프레이 최적화 후보 A — ImageBitmap 텍스처

- 상태: 구현·기능 검증, 성능 개선 여부는 미측정 / 검토 요청
- 비교 원본: `c59e2bbc824bd8d87b92e4d5488aaa165d9b75bb`
- 변경 범위: `spray-texture.ts` 캐시 소스와 `spray-canvas.tsx` Effect 정리

## 가설과 보존 조건

기존에도 미세 입자는 작은 Canvas에 한 번 구워 캐시한다. 이번 후보는 입자 캐시를 새로 도입하는 것이 아니라, 반복 `drawImage`의 소스를 Canvas에서 불변 ImageBitmap으로 전환한다. Canvas 소스 스냅샷·리소스 동기화 비용이 줄어드는지 검증한다. GPU 병목의 단일 원인을 확정했거나 개선율을 확보했다는 의미는 아니다.

스탬프 생성·간격·상한·색상·입자·농도·드립·합성 순서·회전·크기·프레임 루프를 유지한다. 현재 총 수명은 6,600ms(유지 5,400ms)이며 과거 디자인 문서의 3.6초 값으로 되돌리지 않는다.

## 자원 수명

템플릿/색상당 최초 생성한 Canvas를 즉시 사용하고 비동기 변환을 한 번 시도한다. 완료 후 ImageBitmap으로 교체하고 Canvas 픽셀 버퍼를 비운다. 변환 중에는 두 자원이 일시적으로 공존할 수 있다. 미지원·동기 예외·Promise 거절은 Canvas를 유지하며 매 프레임 재시도하지 않는다.

Effect 종료 시 bitmap을 `close()`하고 Canvas 버퍼와 캐시를 정리한다. 종료 뒤 변환이 완료되어도 결과 bitmap을 바로 닫는다. blur/visibility reset은 현재 획만 지우고 재사용 가능한 캐시는 유지한다. 테스트용 `preferImageBitmap: false`는 원본 소스 경로 비교에 사용하며 사용자 UI나 URL 설정을 추가하지 않는다.

## 검증

- `node --test src/components/main/spray-paint.test.mjs src/components/main/spray-texture.test.mjs`: 기존 모델과 승격·재사용·실패·미지원·종료 후 지연 완료 검증.
- `scripts/qa-spray-texture.mjs`: 실제 Chromium에서 동일한 시드의 500개 스탬프를 두 소스로 그린다. 2배 픽셀 해상도, 5색, 회전·확대·중첩 및 0/5400/6000/6599/6600ms 비교. 모든 RGBA 채널의 정확한 동일성과 빈 화면이 아닌지 확인한다. 이 실험에서는 차이 0. 다른 브라우저/GPU까지 동일하다는 보장은 아니다.
- `scripts/qa-spray-paint.mjs`: production build에서 실제 입력·드립·수명·터치·모션 감소 기능 확인. 별도 스크린샷/영상 저장. 성능 수치로 사용하지 않는다.
- `pnpm type-check`, `pnpm lint`, `pnpm build`.

## 다음 비교 측정

원본과 후보를 같은 production 실행 조건에서 교차 비교한다. 로컬 dev와 기존 배포본을 비교하지 않는다. Chrome 버전, 기기·전원·저전력 설정, 1512×982 뷰포트·DPR 2, 포인터 경로·10초 입력·저속/고속, CPU 제한 조건을 고정한다. 최초 캐시 생성과 재사용 구간은 구분한다. 시나리오당 소수의 유효 반복(예: 3회)으로 중앙값과 범위를 보고한다.

입력 이벤트·버튼 상태·실행 지연·페이지 포커스·자산 해시로 실행 유효성을 검증한다. 이전 원본의 Snapshot 이벤트 수를 후보의 유효성 조건으로 사용하면 안 된다. 이 후보가 바로 그 이벤트를 줄이려는 변경이기 때문이다.

입력 후반 7–10초의 DrawFrame 이벤트율·DroppedFrame, GPU backpressure 대기, main task/스크립트/페인트, 초기 변환 지연·메모리를 함께 비교한다. GPU 트랙 시간은 하드웨어 사용률이 아니고 DrawFrame 이벤트율은 실제 디스플레이 FPS와 구분한다. 성능용 trace와 영상 녹화는 별도 실행한다. 개선이 없거나 초기 지연/메모리 회귀가 크면 후보를 채택하지 않고 다음 가설을 검증한다.
