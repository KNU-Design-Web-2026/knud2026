# 스프레이 시각 동일성 캡처

동일한 빌드, 입력 좌표와 난수 seed에서 기존 12px 공간 샘플링과 최적화된 20px 공간 샘플링을 비교한다. 파티클 수·반지름·알파·가장자리·드립 공식은 두 경로에서 동일하다.

## 실행

먼저 비교 분기가 포함된 최신 서버를 실행한다. 다른 포트의 오래된 빌드와 혼동하지 않도록 캡처 URL을 명시한다.

```bash
corepack pnpm dev --port 3001
```

다른 터미널에서 캡처한다.

```bash
SPRAY_TARGET_URL="http://localhost:3001/" corepack pnpm evidence:spray-visual
```

다른 주소나 seed를 사용할 때는 환경 변수를 지정한다.

```bash
SPRAY_TARGET_URL="http://127.0.0.1:3000/" \
SPRAY_SEED=20260908 \
corepack pnpm evidence:spray-visual
```

## 결과

기본 출력 위치는 `performance/spray/optimized/evidence/visual-diff/`이다.

- `legacy-canvas.png`: 기존 12px 공간 샘플링 Canvas
- `optimized-canvas.png`: 최적화된 20px 공간 샘플링 Canvas
- `canvas-diff.png`: 두 Canvas의 픽셀 차이
- `legacy-hero.png`, `optimized-hero.png`: 실제 뷰포트 화면
- `legacy-capture.mp4`, `optimized-capture.mp4`: 같은 입력의 실행 영상
- `comparison.json`: URL, seed, viewport, DPR, SSIM·PSNR, 활성 스탬프 수, 이미지 SHA-256

캡처는 모든 스탬프가 완전한 불투명도를 유지하는 1.8초 안에 수행하므로 실행 시점 차이로 인한 페이드 오차를 피한다. 영상은 페이드아웃과 animation frame 종료 상태까지 포함한다. 두 Canvas의 SHA-256이 같거나 브라우저 계측값이 없으면 성공으로 기록하지 않고 즉시 실패한다.
