# 2026-08-29 Profile Web 구현 기준

## 기준 프레임

| 구간 | Frame | 화면 폭×높이 | 헤더·푸터 | 좌표·여백 | 타이포그래피 | 아트워크·상태 |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop | `1464:13270` Web-Profile | 1920×3415.26px | 상단 140px, 하단 280.26px | 그리드 시작 y=220px, 좌우 131px | 기존 공통 헤더·푸터의 Pretendard 20px | 4열×5행, 카드 기본 상태 |
| 카드 기본 | `1464:13303` Profile _ Web | 413×543px | 해당 없음 | 내부 좌우 19px, 상하 22px | 텍스트 없음 | 이미지 375×499px, 3:4 |
| 카드 hover 참고 | `1464:12590` ProfileWeb | 413×543px | 해당 없음 | 이름 패널 y=451px | 한글 32px Bold, 영문 24px Regular | 인물별 이름 데이터 미정이라 이번 범위에서 미적용 |

## 반응형 기준

| 구간 | Frame | 화면 폭×높이 | 헤더 | 카드 열·크기 | 좌우 여백·간격 | 카드 내부 여백 | 그리드 시작 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Web→Tab | `1464:13365` | 1350×2776.26px | 120px | 4열, 319×424px | 34px, 열 2px·행 24px | 좌우 15px·상하 19px | y=200px |
| Tab | `1464:14479` | 1020×3562.49px | 120px | 3열, 약 315×418px | 36px, 열 2px·행 24px | 좌우 약 14.83px·상하 약 18.78px | y=180px |
| Tab→Mobile | `1464:14976` | 600×4380px | 80px | 2열, 265×353px | 20px, 열 30px·행 50px | 없음 | y=140px |
| Mobile | `1464:15795` | 400×3009px | 59px | 2열, 181×241px | 10px, 열 18px·행 32px | 없음 | y=99px |

- 카드 비율은 각 Figma Frame의 실제 카드 크기(319×424px, 315×418px, 265×353px, 181×241px)를 사용한다. 단순 3:4 비율로 통일하지 않는다.
- 카드 hover는 `hover: hover` 및 `pointer: fine`에서만 유지한다. Tab→Mobile·Mobile 구간은 좌우 여백을 보존하기 위해 이름 패널과 프레임만 표시하고 이미지는 확대하지 않는다.
- 1350~1020px, 1020~600px, 600~400px 사이의 폭은 각 Frame의 열 수·간격을 상한으로 삼는 CSS 보간 규칙이다. 중간 폭은 Figma 원본의 픽셀 일치 대상으로 주장하지 않는다.
- 1020~720px의 카드 내부 여백은 Tab의 좌우 15px·상하 약 18.78px에서 0px까지 선형 보간하며, 720px 이하에서는 0px을 유지한다. 680px처럼 Figma 기준 Frame 사이의 폭에서도 기본 이미지와 hover 프레임의 크기 차이가 생기지 않도록 하기 위한 구현 규칙이다.

### Hover 이름 패널

| 구간 | Figma hover 컴포넌트 | 카드 크기 | 이름 패널 | 한글·영문 크기 | 이름 간격 |
| --- | --- | --- | --- | --- | --- |
| Web | `1464:12588` | 413×543px | 높이 16.94%, 좌우 30px | 32px Bold · 24px Regular | 24px |
| Web→Tab | `1464:13646` | 319×424px | 높이 16.75%, 좌우 24px | 24px Bold · 18px Regular | 18px |
| Tab | `1464:14654` | 315×418px | 높이 16.51%, 좌우 22px | 24px Bold · 18px Regular | 18px |
| Tab→Mobile | `1464:16253` | 265×353px | 높이 19.26%, 좌우 22px | 22px Bold · 16px Regular | 14px |
| Mobile | `1464:16246` | 181×241px | 높이 약 18.6%, 좌우 14px | 16px Bold · 12px Regular | 9.52px |

- `--profile-detail-*` 토큰으로 이름 패널 규격을 관리한다. 1350px와 1020px은 같은 24px/18px 타입 스케일을 공유한다.

## 적용 범위

- `/profile`에 Figma 원본 JPEG 20개를 4열×5행 기본 상태로 배치한다.
- 상단 바와 하단 바는 이미 구현된 `SiteHeader`, `SiteFooter`를 재사용한다.
- Web 1920px와 Web→Tab·Tab·Tab→Mobile·Mobile 네 기준 폭을 하나의 `profile-grid`와 반응형 토큰으로 구현한다.

## Hover 인터랙션 기준

| 항목 | 확인 근거 | 구현 기준 |
| --- | --- | --- |
| Trigger | 2026-08-29 프로토타입 녹화 영상 | fine pointer hover 및 키보드 focus |
| 고정 영역 | Web-Profile 카드 Frame | 카드 셀 413×543px와 그리드 위치는 변경하지 않음 |
| 이미지 상태 | Figma hover 컴포넌트·비교 캡처 | Web은 중심 기준 1.064배 확대, Web→Tab·Tab은 각 상태의 내부 좌표로 재배치 |
| 표시 요소 | Figma hover 컴포넌트 | 파란 프레임 SVG와 하단 노란 이름 패널을 동시에 노출 |
| 타이밍 | 2026-08-29 프로토타입 녹화 영상 기반 추정 | 이미지·Tab 내부 좌표 1100ms, 프레임 opacity 420ms(100ms 뒤), 정보 패널 opacity 420ms·이동 900ms(160ms 뒤), `cubic-bezier(0.22, 1, 0.36, 1)` |

- Figma motion context에는 키프레임 데이터가 없어 duration·easing은 영상 관찰값이다.
- Auto Layout preview에서 주변 카드가 함께 이동하는 현상은 구현하지 않는다. 확장은 카드 내부 `transform`으로 처리해 다른 카드의 위치를 고정한다.
- Web→Tab·Tab hover는 Web과 달리 확대 배율을 적용하지 않는다. Figma의 `left: 3.6%`, `right: 3.38%`, `top: 10.87px/10.75px` 좌표로 내부 이미지를 재배치해 프레임과 이미지의 여백을 맞춘다.
- Web→Tab·Tab의 기본 이미지도 카드 내부의 명시적 `top/right/bottom/left` 좌표로 배치한다. hover 때 `position`이 바뀌지 않아 기본 이미지 잔상이나 카드 밖의 회색 띠가 남지 않는다.
- 600px 이하에는 Web용 `413×543px` 프레임을 비율로 늘리지 않는다. Figma 원본 `265×353px`(Tab→Mobile), `181×241px`(Mobile) 프레임 SVG를 각 구간에 사용해 테두리 밖 배경 노출과 여백 차이를 막는다.
- 제공된 Frame에는 참여자별 이름 override가 없으므로, 현재는 컴포넌트 기본 이름 값을 연결했다. 실제 명단이 전달되면 `src/data/profile-members.ts`에서 각 카드의 `nameKo`, `nameEn`만 교체한다.

## 검수 계획

- Figma Frame `1464:13270`을 1920px CSS viewport, 100% zoom, device scale factor 1에서 비교한다.
- 헤더, 첫 번째·마지막 카드, 카드 간격, 푸터를 오버레이 및 픽셀 diff로 확인한다.
- Figma 원본이 없는 중간 폭은 픽셀 일치 판정에서 제외하고, 토큰 보간이 자연스럽게 작동하는지만 확인한다.
