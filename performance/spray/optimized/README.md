# Canvas 스프레이 최적화 검증 자료

이 디렉터리는 기준 구현과 20px 공간 샘플링 최적화를 같은 입력으로 비교한 자료를 보관한다.

## 디렉터리

- `artifacts/`: 화면이 보이는 Chrome에서 수집한 50회 원시 측정과 trace
- `artifacts/clean/`: Canvas 계측 래핑을 끈 Native·4× Fast drag trace
- `report/`: Run별 CSV, 조건별 중앙값 JSON, 단일 버전 차트
- `comparison/`: 기준 구현과 최적화 구현의 전후 표·차트·나란히 보기 영상
- `evidence/devtools/screenshots/`: Clean trace를 실제 Chrome Performance 패널에 import한 화면
- `artifacts-headless/`, `report-headless/`: 실행 모드가 기준과 달라 결론에서 제외한 감사용 기록

압축 trace는 Native·4× 합계가 크기 때문에 Git에는 넣지 않고 로컬 원본으로 보존한다. 파일 크기와 SHA-256은 `comparison/manifest.json`에 기록해 이후 업로드한 원본의 무결성을 확인할 수 있다. Run별 정량 원본인 `all-results.json`과 CSV·JSON 요약, DevTools 캡처는 저장소에 함께 보존한다.

## 재현 명령

```bash
SPRAY_TARGET_URL='http://127.0.0.1:3000/?spraySeed=20260908' \
SPRAY_OUTPUT_DIR='performance/spray/optimized/artifacts' \
SPRAY_RUNS=5 \
SPRAY_TRACE_RUN=3 \
node performance/spray/run-deployed-baseline.cjs
```

Clean trace의 실제 명령은 아래와 같다.

```bash
SPRAY_TARGET_URL='http://127.0.0.1:3000/?spraySeed=20260908' \
SPRAY_OUTPUT_DIR='performance/spray/optimized/artifacts/clean' \
SPRAY_RUNS=1 SPRAY_TRACE_RUN=1 SPRAY_SCENARIO='fast-drag' SPRAY_PROBE=0 \
node performance/spray/run-deployed-baseline.cjs
```

## 판정 규칙

1. 기준과 최적화 모두 headed Chrome에서 실행한다.
2. 각 조건 5회 중 첫 회를 워밍업으로 제외한다.
3. Run 02~05 중앙값을 비교한다.
4. 성능 수치만으로 채택하지 않고 고정 seed 이미지, 스프레이 영역 밝기·채도, 실제 전후 영상도 함께 확인한다.
5. 실행 모드가 달랐던 headless 결과는 삭제하지 않고 격리해 실험 오류와 수정 과정을 남긴다.
