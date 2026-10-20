# SPACE 지도 원본 벡터 반영

## 요청과 범위

- 모바일 지도 PNG(384 × 542)가 고밀도 화면에서 흐리게 보이는 문제를 원본으로 해결한다.
- [가로 지도 3369:10959](https://www.figma.com/design/L2HN56CFcymI8Is4Ns0lKo/?node-id=3369-10959), [세로 지도 3369:11053](https://www.figma.com/design/L2HN56CFcymI8Is4Ns0lKo/?node-id=3369-11053)를 읽기 전용으로 내보냈다. Figma 파일은 수정하지 않았다.
- 최초 작업은 로컬 검수까지 수행했으며, 2026-10-20 사용자의 후속 요청으로 핫픽스 커밋·PR·main 병합·운영 배포까지 진행한다. 배포 결과는 PR에 기록하며 QA 상태를 자동 완료 처리하지 않는다.

## 구현 기준

| 구간 | 기준 노드 | 원본 경계 크기 | SVG 크기 | 페이지 배치 |
| --- | --- | --- | --- | --- |
| 가로 | 3369:10959 | 약 560 × 395.962 | 560 × 396 | 기존 가로형 지도 폭·여백 유지 |
| 세로 | 3369:11053 | 약 383.235 × 542 | 384 × 542 | 기존 480px 이하 세로형 전환 유지 |

- 제공된 두 노드는 전체 페이지가 아닌 지도 자산이다. 페이지 브레이크포인트·여백은 기존 구현을 유지하며 이번 원본의 신규 페이지 명세라고 해석하지 않는다.
- `public/assets/figma/space/map-assigned-2026.svg`, `map-assigned-mobile-2026.svg`는 Figma SVG export 원본이다. 글자는 outline으로 내보내 폰트 로딩과 기기 폰트 차이를 피한다. 비트맵을 SVG로 감싸거나 저해상도 PNG를 확대하지 않았다.
- `SpaceMap`의 표시 자산을 SVG로 교체하고 CSS의 가로 비율도 실제 export 비율로 맞췄다. `next/image`의 `unoptimized`로 벡터 파일 자체를 제공한다. SVG 최적화 API 허용 범위를 넓히지 않았다.
- 두 방향의 19개 링크 위치는 새 원본 텍스트의 absoluteBoundingBox를 export 좌표로 정규화했다. 작가별 작품 연결, 키보드 focus, Escape 닫기, 지연 이미지 교체 방지는 유지한다.
- hover 보조 마스크만 PNG이다. 같은 SVG에서 가로 8배·세로 4배로 재생성하고 무채색 글자만 남겨, 파란 벽선이나 직사각형 박스가 함께 흐려지지 않도록 했다. 재생성: `node scripts/generate-space-name-masks.mjs`.

## 확인 결과

| 대상 | 조건 | 결과 |
| --- | --- | --- |
| 반응형 적응성 | Chromium, 320·360·375·390·400·414·440·480·481·600·768·821·822·1020·1280·1350·1920px | 17개 폭 모두 지도 1개와 고유 작품 링크 19개 표시, 링크가 지도 경계 안에 위치, 가로 넘침 없음 |
| 고밀도 모바일 | 440px / DPR 3 | 표시 폭 416px에서 PNG 대신 원본 SVG 요청·로드 확인. CSS filter 없음 |
| PC hover | 1920px, 양혜연 | 글자 fade opacity 0.43, 작품 미리보기 ready, 기본 커서 숨김 유지 |
| 상세 이동 | PC 양혜연 / 모바일 김가연 | 각각 `/work/11`, `/work/2` 도착 확인 |
| 자동 검증 | 전체 테스트·lint·type-check·build·diff check | 209개 테스트 통과, 나머지 명령 종료 코드 0 |

실물 iPhone/Safari 검증은 이번 지도 작업에서는 수행하지 않았다. 기존 MESSAGE 핫픽스나 운영 DB에는 변경이 없다.

## Figma 자산 대조

Figma 1x PNG와 브라우저가 실제 로드한 SVG를 sRGB Canvas에 원본 크기로 그린 결과를 비교했다. 이는 지도 자산 범위 비교이며 전체 페이지의 픽셀 일치를 의미하지 않는다. 브라우저 전체 화면 캡처는 별도로 남겼다.

| 기준 노드 | 비교 영역 | 차이 | 판정 |
| --- | --- | --- | --- |
| 3369:10959 | 560 × 396 | 채널 차이 16 초과 픽셀 2.325%, 평균 채널 절댓값 차이 0.644/255 | 오버레이에서 구조적 어긋남 없음. 렌더러 간 글자·경계 AA 차이가 남으며, 별도 허용 임계값이 없어 완전 픽셀 일치로 판정하지 않음 |
| 3369:11053 | 384 × 542 | 채널 차이 16 초과 픽셀 2.487%, 평균 채널 절댓값 차이 0.681/255 | 동일 |

- [가로 오버레이](./assets/2026-10-20/space-vector/knud-space-landscape-overlay.png), [가로 diff](./assets/2026-10-20/space-vector/knud-space-landscape-diff.png)
- [세로 오버레이](./assets/2026-10-20/space-vector/knud-space-portrait-overlay.png), [세로 diff](./assets/2026-10-20/space-vector/knud-space-portrait-diff.png)
- [로컬 페이지 화면: 600px / DPR 2](./assets/2026-10-20/space-vector/knud-space-context-600.png)

Storybook·Chromatic은 이 저장소에 실행 구성이 없어 이번 검수에 사용하지 않았다. 디자이너 검토 대기 상태로 남긴다.
