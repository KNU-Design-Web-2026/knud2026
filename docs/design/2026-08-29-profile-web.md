# 2026-08-29 Profile Web 구현 기준

## 기준 프레임

| 구간 | Frame | 화면 폭×높이 | 헤더·푸터 | 좌표·여백 | 타이포그래피 | 아트워크·상태 |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop | `1464:13270` Web-Profile | 1920×3415.26px | 상단 140px, 하단 280.26px | 그리드 시작 y=220px, 좌우 131px | 기존 공통 헤더·푸터의 Pretendard 20px | 4열×5행, 카드 기본 상태 |
| 카드 기본 | `1464:13303` Profile _ Web | 413×543px | 해당 없음 | 내부 좌우 19px, 상하 22px | 텍스트 없음 | 이미지 375×499px, 3:4 |
| 카드 hover 참고 | `1464:12590` ProfileWeb | 413×543px | 해당 없음 | 이름 패널 y=451px | 한글 32px Bold, 영문 24px Regular | 인물별 이름 데이터 미정이라 이번 범위에서 미적용 |

## 적용 범위

- `/profile`에 Figma 원본 JPEG 20개를 4열×5행 기본 상태로 배치한다.
- 상단 바와 하단 바는 이미 구현된 `SiteHeader`, `SiteFooter`를 재사용한다.
- 이번 작업은 Web 1920px 기준이다. Tab·Mobile 기준 Frame이 제공되면 별도 명세와 검수를 추가한다.

## Hover 인터랙션 기준

| 항목 | 확인 근거 | 구현 기준 |
| --- | --- | --- |
| Trigger | 2026-08-29 프로토타입 녹화 영상 | fine pointer hover 및 키보드 focus |
| 고정 영역 | Web-Profile 카드 Frame | 카드 셀 413×543px와 그리드 위치는 변경하지 않음 |
| 이미지 확대 | Figma hover 컴포넌트·비교 캡처 | 기본 이미지가 프레임 안쪽 경계까지 차도록 중심 기준 1.064배 확대 |
| 표시 요소 | Figma hover 컴포넌트 | 파란 프레임 SVG와 하단 노란 이름 패널을 동시에 노출 |
| 타이밍 | 영상 기반 추정 | 이미지 460ms, 프레임·정보 패널 opacity 180ms, `cubic-bezier(0.22, 1, 0.36, 1)` |

- Figma motion context에는 키프레임 데이터가 없어 duration·easing은 영상 관찰값이다.
- Auto Layout preview에서 주변 카드가 함께 이동하는 현상은 구현하지 않는다. 확장은 카드 내부 `transform`으로 처리해 다른 카드의 위치를 고정한다.
- 제공된 Frame에는 참여자별 이름 override가 없으므로, 현재는 컴포넌트 기본 이름 값을 연결했다. 실제 명단이 전달되면 `src/data/profile-members.ts`에서 각 카드의 `nameKo`, `nameEn`만 교체한다.

## 검수 계획

- Figma Frame `1464:13270`을 1920px CSS viewport, 100% zoom, device scale factor 1에서 비교한다.
- 헤더, 첫 번째·마지막 카드, 카드 간격, 푸터를 오버레이 및 픽셀 diff로 확인한다.
- Figma 원본이 없는 중간·모바일 폭은 픽셀 일치 판정에서 제외한다.
