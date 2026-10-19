# 운영 Microsoft Clarity 연결

## 대상과 실행 경계

- 프로젝트: KNUD 2026, 공개 프로젝트 ID `z00yn7m096` (비밀키 아님)
- 관리: https://clarity.microsoft.com/projects/view/z00yn7m096/settings
- `VERCEL_ENV=production`과 정확한 HTTPS 운영 도메인(`www.2026-knud-graduation.com`, apex)을 모두 만족할 때만 비동기 태그를 요청한다.
- localhost, preview, 운영 빌드의 Vercel 별칭에서는 태그 요청이 없다. DNT/GPC도 존중한다.
- 초기 진입 경로는 `/`, `/about`, `/work`, `/work/:숫자`, `/profile`, `/profile/:숫자`, `/space`, `/message`만 허용한다. 초기 URL의 쿼리·해시, 민감할 수 있는 유입 URL(쿼리·해시·외부 상세 경로)이 있으면 아예 시작하지 않는다.
- 한 문서에 한 번 설치하고 SPA 이동은 Clarity 자체 처리에 맡긴다. `page_view`를 별도로 중복 전송하지 않는다. 태그 로딩 실패가 화면 렌더링을 막지 않는다.

## 개인정보 보호와 한계

- 관리 화면 마스킹은 **엄격한**, 쿠키는 **끄기**로 설정했다. 봇 감지는 유지한다.
- 초기 HTML의 `body`와 MESSAGE 영역에 각각 `data-clarity-mask="true"`를 적용했다. 관리 설정 반영 지연(최대 1시간)과 무관하게 텍스트를 가린다. 공개 프로필 연락처·메시지 본문·보낸 사람·받는 사람도 수집용으로 해제하지 않는다.
- 태그 다운로드 전에 `consentv2`의 `ad_Storage`, `analytics_Storage`를 모두 `denied`로 큐에 넣는다. 방문자를 대신해 동의를 허용하지 않는다. 광고 연동·식별자 API·사용자 입력 기반 이벤트는 추가하지 않는다.
- 쿠키 없는 제한 모드에서는 방문 간 동일 사용자 식별, 여러 페이지의 세션 연결 등 기능이 제한된다. GA 방문자/세션 수와 일치한다고 해석하지 않는다.
- **마스킹이 모든 데이터 수집을 차단한다는 뜻은 아니다.** 화면 구조·이미지·클릭·스크롤·페이지 URL 등은 분석 서비스로 전송될 수 있다. DOM 마스킹은 URL이나 CSS를 가리지 않는다. 기존 공개 이미지도 기록에 보일 수 있다.
- URL 보호는 **초기 실행 조건**이다. 로딩 뒤 SPA에서 쿼리나 민감한 경로를 추가하면 이 조건으로 차단되지 않는다. 현재 공개 UI는 그러한 탐색을 만들지 않는다. 향후 검색·관리자·개인정보 URL 기능을 추가할 때 별도 수집 차단을 먼저 설계해야 한다.
- 쿠키 제한이나 마스킹만으로 법적 준수를 보장하지 않는다. 운영자는 실제 개인정보 안내·방문자 동의 필요성을 확인해야 한다. 미성년자를 대상으로 한 서비스로 확장할 때도 Clarity 적용 가능성을 다시 확인한다.

## 검증과 운영

1. `pnpm exec tsx --test src/lib/microsoft-clarity.test.ts`: 운영 호스트·환경·공개 경로, DNT/GPC, 중복 설치, 저장 거부 선행, SSR 마스킹 검사.
2. lint·type-check·전체 기존 테스트·production build로 GA 및 오픈 예약 회귀 확인.
3. 배포 후 운영 페이지에서 `knud-microsoft-clarity`의 정확한 프로젝트 ID와 `/collect` 요청을 확인한다. `_clck`, `_clsk` 쿠키가 없는지도 확인한다.
4. 동일 배포의 Vercel 별칭에는 Clarity 태그가 없어야 한다. Clarity 데이터 도착은 브라우저 태그 로드와 별도로 확인하며 지연을 구분한다.
5. 기존 GA 측정 ID·예약 오픈(2026-10-20 09:00 KST)·유지보수 모드는 변경하지 않는다.
6. 중단 시 RootLayout의 `MicrosoftClarity` 렌더를 제거하고 배포한다. 마스킹은 유지해도 UI에 영향이 없다. 기존 녹화 삭제는 별도 운영 절차다.

로컬 검증: 전체 테스트 **196개 통과**, lint·type-check·production build·`git diff --check` 통과. 운영 배포의 태그·수집 수신 확인은 배포 뒤 별도로 수행한다.

## 공식 근거

- [Consent Mode](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode)
- [ConsentV2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)
- [HTML 마스킹](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking)
