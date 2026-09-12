# 2차 최적화 후보 — 정적인 자국 묶음 캐시

- 상태: 구현·기능 검증 후 검토 요청. 배포 성능 비교 전이며 개선율 미확정.
- 기준: PR #17이 병합된 main `b322f9b`.
- 브랜치: `perf/optimization-02-stamp-cache`.
- 사용자 결정: PR까지만 생성. main 병합·운영 배포는 사용자가 수행한다.

## 왜 다음 후보인가

1차 ImageBitmap 후보는 느린 입력의 메인 작업 시간과 Snapshot 이벤트를 줄였지만 빠른 입력의 프레임 저하가 해결됐다는 증거는 없었다. 2차는 텍스처 생성이 아니라 이미 그린 자국을 매 프레임 다시 합성하는 비용을 줄이는 실험이다. 표시 backpressure 관측만으로 하드웨어 GPU 포화나 fill-rate를 원인으로 확정하지 않는다.

## 구현과 보존 조건

생성 순서가 고정된 32개 자국을 한 묶음으로 관리한다. 묶음이 완성되고 모든 자국이 5.4초 유지 구간이며 드립이 없을 때만 결과 이미지를 굽는다. 원래 화면 좌표와 DPR로 그리며 실제 영역을 화면 안으로 잘라 사용한다. 자국이 사라져도 뒤 묶음의 식별자는 바뀌지 않는다.

묶음 중 하나라도 드립이 생기거나 페이드를 시작하면 해당 이미지를 해제하고 묶음 전체를 기존 개별 그리기로 되돌린다. 완성된 드립도 이번 후보에서는 캐시하지 않는다. 자국→해당 드립→다음 자국 순서를 유지하며 묶음 alpha는 항상 1이다. 묶음 전체에 페이드를 적용하지 않는다.

입력 경로·스탬프 간격·입자·농도·크기·색상·드립 규칙·총 6.6초 수명·에셋 모션은 바꾸지 않는다. 변경 책임은 `spray-stamp-groups.ts`(고정 묶음), `spray-renderer.ts`(원본 그리기/캐시/자원), `spray-canvas.tsx`(기존 입력·스케줄과 연결)로 구분한다.

## 메모리와 fallback

- 묶음 캐시의 RGBA 픽셀 합계는 최대 16 MiB, 개별 surface 변 길이는 최대 4096 device pixels.
- 1차 텍스처 캐시와 브라우저의 내부 버퍼는 이 16 MiB에 포함되지 않는다. 총 GPU/프로세스 메모리 상한이라는 뜻이 아니다.
- 예산 초과/큰 영역/Canvas context 할당 실패 시 개별 그리기로 복귀한다. 자국을 삭제하거나 해상도를 낮추지 않는다.
- 할당 실패 묶음은 매 프레임 재시도하지 않는다. 무효화·소멸·resize·blur·hidden·모션 설정 변경·Effect cleanup에서 버퍼를 해제한다.

## 기능 및 시각 검증

- 새 그룹 테스트는 캐시 미구현 상태에서 실패를 확인한 후 구현했다. 기존 모델/텍스처+그룹 테스트 15개 통과.
- 브라우저 테스트는 `git show b322f9b:src/components/main/spray-canvas.tsx`에서 원본 draw loop를 읽어 비교한다. 실행하려면 해당 git 이력이 필요하다.
- 동일 seed의 192개 자국, 5색 겹침·방향·농도, DPR 1/1.5/2, Canvas fallback 및 ImageBitmap 소스, 드립 추가, 개별 fade/만료, 예산 0/부분 제한/할당 실패, resize/DPR 변경·clear를 검사한다.
- 유지 중 두 번째 프레임은 192개 개별 자국 대신 6개 묶음을 재사용하고 다시 굽는 자국은 0개다. 드립이 한 묶음에 생기면 5개 캐시+32개 개별 자국이 된다. **이것은 정적 fixture의 그리기 횟수 검증이며 실제 성능 개선율이 아니다.**
- 중간 8-bit 합성의 반올림으로 픽셀 완전 동일하지 않다. 흰색/검정 배경에 합성한 채널 차이를 비교하며 사전 테스트 기준은 평균 0.25/255 이하, 최대 6/255 이하. 실측 결과는 동봉 JSON에 기록한다. 투명도 0 근처의 raw RGB만 비교해 왜곡하지 않는다.
- 실제 production build 페이지에서 1350/1920px 드립·수명, 터치·reduced-motion 통과. 별도 1512px DPR2 다중 획 검사에서 활성 묶음 3개, 픽셀 버퍼 4,729,024bytes를 관측했고 blur 후 모두 해제됐다. 계측을 추가한 기능 검사이며 benchmark가 아니다.
- 원본/후보 육안 비교: 아래 왼쪽이 원본, 오른쪽이 캐시. 큰 형태 변화는 확인되지 않았지만 디자이너 최종 검토는 별도다.

![원본과 캐시 비교](../qa/stamp-cache-reference-vs-cache.png)

[픽셀 비교 원시 결과 JSON](../qa/stamp-cache-pixel-results.json)

## 실행

```sh
node --test src/components/main/spray-paint.test.mjs src/components/main/spray-texture.test.mjs src/components/main/spray-stamp-groups.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs SPRAY_QA_OUTPUT=/absolute/path/to/evidence node scripts/qa-spray-stamp-cache.mjs
pnpm lint
pnpm type-check
pnpm build
```

전체 Node 테스트는 115개 중 114개 통과, `main-interaction.test.mjs:42`의 기존 모바일 배경 CSS 정규식 검사 1개 실패. 원본 main b322f9b를 별도 디렉터리로 꺼내도 동일하게 실패한다. 이번 PR에서는 관련 없는 CSS/검사를 바꾸지 않았다. 전체 테스트 통과로 보고하지 않는다. lint/type-check/build와 해당 기능 검증은 통과했다.

## 배포 후 확인

이 PR에서는 새 정량 측정이나 main 병합을 수행하지 않았다. 사용자가 배포한 뒤 1차 기준 배포본과 2차 배포본의 고정 URL/해시를 기록하고 같은 입력·viewport·DPR·CPU 조건에서 비교한다. 빠른 입력의 실제 처리 이벤트 수 차이를 먼저 검증한다. 후반 DrawFrame·DroppedFrame·backpressure, 캐시 최초 생성 지연·메모리를 함께 확인한다. 192→6만으로 실제 프레임 개선을 주장하지 않는다.
