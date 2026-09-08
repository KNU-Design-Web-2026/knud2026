# 스프레이 시각 동일성 캡처

동일한 빌드, 입력 좌표와 난수 seed에서 기존 Canvas `arc()` 렌더러와 최적화된 `Path2D` 렌더러를 비교한다.

## 실행

먼저 프로덕션 빌드를 실행한다.

```bash
corepack pnpm build
corepack pnpm start
```

다른 터미널에서 캡처한다.

```bash
corepack pnpm evidence:spray-visual
```

다른 주소나 seed를 사용할 때는 환경 변수를 지정한다.

```bash
SPRAY_TARGET_URL="http://127.0.0.1:3000/" \
SPRAY_SEED=20260908 \
corepack pnpm evidence:spray-visual
```

## 결과

기본 출력 위치는 `performance/spray/optimized/evidence/visual-diff/`이다.

- `legacy-canvas.png`: 기존 입자 렌더링 Canvas
- `optimized-canvas.png`: Path2D 캐시 Canvas
- `canvas-diff.png`: 두 Canvas의 픽셀 차이
- `legacy-hero.png`, `optimized-hero.png`: 실제 뷰포트 화면
- `legacy-capture.mp4`, `optimized-capture.mp4`: 같은 입력의 실행 영상
- `comparison.json`: URL, seed, viewport, DPR, SSIM과 PSNR

캡처는 모든 스탬프가 완전한 불투명도를 유지하는 1.8초 안에 수행하므로 실행 시점 차이로 인한 페이드 오차를 피한다. 영상은 페이드아웃과 animation frame 종료 상태까지 포함한다.
