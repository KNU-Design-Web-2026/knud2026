# 운영 사이트 Google Analytics 연결

## 연결 대상

- 계정: KNUD (`412453770`)
- 속성: KNUD 2026 졸업전시 (`559548990`), 대한민국 시간·KRW
- 웹 스트림: KNUD 2026 운영 사이트 (`16156382765`)
- 공개 측정 ID: `G-J9DDCHCRMF` (비밀키가 아님)
- 운영 도메인: `https://www.2026-knud-graduation.com`, HTTPS apex 도메인도 허용
- 기존 `G-PRZK3CKKLJ`는 다른 프로젝트의 ID이므로 사용하지 않는다.

## 수집 범위와 제외 조건

- Vercel `production` 환경에서만 클라이언트 추적기를 렌더하고, 브라우저에서도 정확한 HTTPS 호스트를 확인한 뒤 태그를 요청한다.
- localhost, preview 환경, 운영 배포의 `vercel.app` 별칭에서는 외부 태그 요청도 하지 않는다.
- `/`, `/about`, `/work`, `/work/:숫자`, `/profile`, `/profile/:숫자`, `/space`, `/message`의 `page_view`만 명시적으로 전송한다. 관리자·API·실험·임의 경로는 제외한다.
- 첫 방문 및 Next.js 경로 이동을 집계한다. 같은 경로의 재렌더·쿼리·해시 변화는 중복 집계하지 않고, 다른 페이지에 다녀온 뒤 복귀하면 새 조회로 집계한다.
- 본문·보낸 사람·받는 사람·이메일·폼 필드는 읽거나 전송하지 않는다. URL 쿼리·해시와 최초 유입 URL의 경로도 제거한다. 페이지 제목도 DOM에서 읽지 않고 고정 페이지 분류를 쓴다.
- 광고 저장·광고 사용자 데이터·광고 개인화 동의는 거부하고 Google Signals도 사용하지 않는다. DNT 또는 GPC 신호가 있으면 태그를 요청하지 않는다.
- 일반 GA 방문·세션 측정에는 Google의 분석 쿠키/브라우저 정보 처리가 적용된다. 이 구현은 쿠키 동의 UI를 추가하지 않으므로, 운영자가 개인정보 안내와 방문자 동의 요구사항을 별도로 확인해야 한다.
- UTM을 포함한 쿼리 전체를 제외하므로 캠페인별 세부 기여도 대신 유입 도메인 수준으로 확인한다.

## GA 관리 화면의 대응 설정

관리 → 데이터 스트림 → 위 운영 스트림에서 **향상된 측정을 사용 중지**한다. `send_page_view: false`와 함께 수동 `page_view`를 사용하며, 브라우저 history 기반 자동 조회와 중복되지 않게 한다. 양식·검색·이탈 링크 등의 자동 이벤트도 수집하지 않는다.

태그는 루트 Client Component의 Effect에서 초기화 큐를 만든 후 비동기로 요청한다. 최초 렌더링을 막지 않으며 추가 의존성은 없다. 사용자 식별자나 MESSAGE 내용 기반의 커스텀 이벤트를 추가하려면 수집 범위를 다시 검토한다.

## 공개 예약과 배포

`SITE_MAINTENANCE_MODE`와 `2026-10-20T09:00:00+09:00` 공개 시각은 변경하지 않는다. 운영 준비 안내 페이지의 `/` 방문도 집계하며, 내부 페이지 접근은 기존 예약 정책을 따른다. 검수용 별칭을 공개해도 GA는 실행되지 않는다.

## 검증 방법

1. `pnpm exec tsx --test src/lib/google-analytics.test.ts`: 허용/차단 환경, 실제 전송 파라미터, 중복 제거, 개인정보 제외, 광고 거부·추적 거부를 검증한다.
2. 전체 테스트·lint·type-check·build 및 `git diff --check`를 실행한다.
3. 운영 배포의 준비 페이지와 내부 페이지 리다이렉트를 확인해 예약 공개를 보존한다.
4. 운영 도메인을 브라우저로 방문하여 태그 요청을 확인하고, KNUD 속성의 실시간 화면에서 `page_view` 수신을 확인한다.
5. Vercel 별칭에서는 태그가 생성되지 않는지 확인한다. 실시간에 나타나는 검증 방문은 실제 관람객 수와 구분한다.

## 공식 근거

- [GA 수동 페이지 조회](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [GA 구성 필드](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
