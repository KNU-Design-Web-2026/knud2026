# 디자인 문서

피그마만으로 표현하기 어려운 질문, 답변, 인터랙션 규칙과 구현 검수 결과를 저장소에서 함께 관리한다.

## 디렉터리

```text
docs/design/
├── README.md
├── common-components.md  # 공통 UI의 기준과 반응형 규격
├── qa/                    # 날짜별 질문과 개발 답변
└── interaction-specs/     # 확정된 화면 전환과 동작 명세
```

`interaction-specs/`는 실제 명세가 확정될 때 생성한다. 빈 디렉터리는 미리 만들지 않는다.

## 기록 구분

- `qa/`: 회의나 메신저에서 나온 질문, 답변, 구현 시 확인할 항목
- `interaction-specs/`: 승인된 트리거, 상태 전환, PC·모바일 대체 동작
- `docs/architecture/adr/`: 도구와 구조를 선택한 이유 및 대안
- Storybook: 구현된 UI 상태와 인터랙션 예시
- Chromatic: 승인된 시각 기준선과 변경 검수

## 작성 규칙

- 파일명은 `YYYY-MM-DD-topic.md` 형식을 사용한다.
- 질문과 답변을 분리하고, 확정된 결정과 구현 중 조정 가능한 값을 구분한다.
- 관련 피그마, ADR, Storybook, PR 링크를 가능한 범위에서 연결한다.
- 합의가 변경되면 기존 기록을 삭제하지 않고 변경 날짜와 이유를 추가한다.
- UI 구현이 완료되면 관련 Story 이름과 Chromatic Review 링크를 기록한다.

## 현재 기록

- [2026-07-16 디자이너 QA](./qa/2026-07-16-designer-qa.md)
- [2026-08-06 메인 페이지 구현 기준](./2026-08-06-main-page.md)
- [2026-08-12 메인 스프레이 인터랙션 규격](./interaction-specs/2026-08-12-main-spray.md)
- [2026-08-12 반응형 모바일 메뉴 규격](./interaction-specs/2026-08-12-mobile-navigation.md)
- [공통 컴포넌트 기준](./common-components.md)
- [ADR-0002: Storybook과 Chromatic 사용](../architecture/adr/0002-use-storybook-and-chromatic.md)
