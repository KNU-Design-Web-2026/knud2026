# SPACE 테스트 영상·측정 증거 보존

## 요청과 범위

기존 [저속 연결 검증](./2026-10-30-space-preview-resilience.md)을 다시 확인할 수 있도록 Playwright 영상·스크린샷·trace와 원시 수치를 함께 남겼다. 이번 작업은 **증거 수집 도구와 설정만 추가**했으며 전시 사이트 제품 코드, DB, 최종 이미지, 배포를 변경하지 않았다.

## 현재 촬영 묶음

경로: `artifacts/space-preview/recordings/2026-10-30T08-20-30-179Z/`

이 폴더는 로컬 보관용이며 원격 저장소에는 업로드하지 않았다. 원격에서도 볼 수 있는 원시 지표·전후 화면은 [측정 결과 보존 문서](../../performance/2026-10-30-space-preview-resilience.md)에 연결한다.

| 기록 | 조건 | 사용 목적 |
| --- | --- | --- |
| baseline-slow-cold / candidate-slow-cold | 다운로드0.4Mbps, 업로드0.2Mbps, latency400ms. 선택 구간만 CDP 제한, 요청 routing 없음 | 기존 측정과 같은 제한값에서 보이는 화면의 예시 |
| baseline-held-8s / candidate-held-8s | 대상 이미지 요청을 인위적으로 8초 보류 | 정보·작가명·작은 미리보기 표시 차이를 명확히 확인 |
| candidate-error-retry | 첫 요청 abort → 재시도 요청 3초 보류 → ready → 작품 상세 이동 | 실패해도 정보 유지, 키보드 초점·재시도·상세 진입 확인 |

각 시나리오는 **원본 WebM + 등속 MP4**, PNG(화면 전체·팝업 크롭), trace.zip, observations.json을 보존한다. 1920×1080, DPR1, Chromium149, 새 context, service worker 차단, 로컬 production build다. 녹화 화면을 위해 지도 위치를 스크롤하고 키보드 focus로 작품을 선택했다. `video-verification.json`에 MP4 5개의 해상도·재생시간 검사 결과가 있다. 영상 일부를 프레임으로 추출해 대기 상태와 실제 화면도 확인했다.

## 수치와 영상을 구분하는 원칙

- 영상/trace/screenshot은 실행 부하가 있으므로 **성능 측정에 포함하지 않는다**. 촬영한 실행의 시간과 기존 중앙값은 같지 않다.
- 실제 지표는 기존 비녹화 80회 측정의 baseline.json/candidate.json을 원본 그대로 복사했다. 조건별 10회와 누락·중복·timeout을 검사한 summary.json, 80행 samples.csv를 함께 저장했다.
- 기존 저속 첫 선택의 약822→8ms는 **작품 정보 표시**다. 최종 고화질 준비는 약822→824ms로 유사하다. 지연 8초 영상으로 이 수치를 계산하지 않는다.
- 합성 지연·합성 오류는 별도 조건이다. 현장의 Wi-Fi 속도나 실제 실패율을 측정했다는 증거로 쓰지 않는다.
- 정상/저속 × cold/warm의 4개 조건을 섞어 전체 개선율을 계산하지 않는다. timeout/null을 0ms 성공으로 바꾸지 않는다.
- manifest.json에 source/build 식별자·촬영 동작을 기록하고 checksums.json으로 파일 변경 여부를 확인할 수 있다. 소스 해시는 이번 촬영 시점만 식별한다. 해시를 남기지 않았던 과거 성능 측정의 소스 동일성을 소급 증명하지 않는다.
- source/와 reproduce/의 복사본은 .txt 확장자로 보관해 앱 빌드·타입 검사에 섞이지 않게 했다. 전체 저장소 백업은 아니다.

## 다시 수집하는 방법

두 production 서버를 기존 검증과 동일하게 먼저 실행한다(기준3101, 수정3102).

```sh
pnpm evidence:space --baseline-root=/절대/경로/독립기준본 --baseline-ref=5328fc2
```

독립기준본의 핵심 소스는 명시한 기준 커밋과 동일한지 검사한다. 개선 브랜치가 커밋된 이후에도 대조군을 현재 HEAD로 잘못 비교하지 않는다. 브라우저 녹화에는 새 날짜 폴더를 사용한다. ffmpeg/ffprobe가 있으면 MP4도 자동 생성하고, 없으면 WebM을 보존한다. 기록 도구 자체는 로컬 파일만 생성하며 GitHub 업로드·커밋·배포를 수행하지 않는다.

기존 E2E도 성공 여부와 무관하게 녹화하려면:

```sh
SPACE_CAPTURE=1 pnpm exec playwright test
```

이때만 video/trace/screenshot을 모두 켜고 `artifacts/playwright-recordings/`의 실행별 폴더에 저장한다. 기본 실행의 실패 trace/스크린샷 정책과 비녹화 벤치마크는 유지한다. 여러 worker가 같은 실행 ID를 상속해 결과가 흩어지지 않게 했다. 모바일 캡처는 WebKit touch 에뮬레이션이지 실제 iPhone 녹화가 아니다.

Trace와 HTML 보고서를 열려면:

```sh
pnpm exec playwright show-trace /절대/경로/trace.zip
pnpm exec playwright show-report
```

## 검증

- 녹화 시나리오 5개가 모두 기대 상태를 확인하며 완료됐다. MP45개, trace5개, 실행 기록5개를 확인했다.
- 기존 전체 E2E22개가 녹화 모드에서 통과했다. 해당하지 않는26개 조합은 skip이며 성공 수에 포함하지 않는다.
- 최종 E2E 기록 경로는 `artifacts/playwright-recordings/2026-10-30T08-24-02-729Z/`다. page fixture 생성 뒤 skip되는 조합까지 영상48개가 생겼지만, 26개는 유효한 검증 영상이 아니다. 성공22개와 파일48개를 구분한다. HTML 보고서는 현재 촬영 묶음의 `e2e-report/`에 복사해 보존했고, console log도 함께 저장했다.
- 표본 집계 테스트4개를 추가해 총220개 단위/회귀 검사가 통과했다. lint/type-check도 통과했다.
- 제품/배포 코드를 바꾸지 않아 이번 증거 수집만을 위해 production build를 다시 만들지 않았다. 앞선 동일 제품 빌드를 사용했다.
- 생성된 HTML 보고서의 외부 viewer JS까지 ESLint가 분석하며 formatter 오류가 났다. 이미 Git에서 제외한 artifacts/playwright-report/test-results만 lint에서도 제외했다. 앱·테스트 소스의 검사 범위는 유지했다. 보관용 TypeScript 소스는 .txt로 바꿔 타입 검사와도 분리했다.
- 원시 측정 파일 SHA와 촬영 전후 핵심 소스 SHA가 같음을 확인했다. checksum 검사는 자료 동일성 확인이며 실제 사용자 효과에 대한 검증은 아니다.
- 과거 현장의 네트워크 원인·관람객 인지율·만족도·현장 개선 결과는 여전히 미확인이다.

## 커밋·PR 제출 시 보존

사용자의 후속 요청에 따라 코드와 검증 문서를 커밋하고 main 대상 PR로 제출한다. 원시 수치와 작은 스크린샷은 docs/performance/evidence/에 선별 보존하며, 이 문서의 로컬 영상·trace 경로는 원격에서 열리지 않는다. 운영 병합·배포는 이번 요청 범위가 아니다.
