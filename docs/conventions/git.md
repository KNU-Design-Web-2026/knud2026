# Git 컨벤션

## 브랜치 전략

1인 개발에 맞는 GitHub Flow를 사용한다. `develop` 같은 장기 브랜치는 두지 않는다.

- `main`은 항상 빌드와 배포가 가능한 상태로 유지한다.
- 기능과 수정 작업은 최신 `main`에서 짧게 유지되는 작업 브랜치를 만든다.
- 모든 변경은 작업 브랜치에서 커밋하고 PR로 기록한 뒤 `main`에 병합한다. `main`으로 직접 push하지 않는다.
- 작업 브랜치는 PR의 QA·검토가 끝난 뒤에만 `main`에 병합하고 삭제한다.
- `main`에서 force push하거나 이미 공유된 커밋을 임의로 다시 쓰지 않는다.
- 에이전트는 사용자가 명시적으로 요청하지 않으면 커밋, push, merge, PR 생성을 하지 않는다. 사용자가 push를 요청해도 `main` 직접 push가 아니라 해당 작업 브랜치의 PR 생성을 우선 제안한다.

### 브랜치 이름

형식은 `<type>/<short-description>`이고 영문 소문자 kebab-case를 사용한다.

| Type | 용도 | 예시 |
|---|---|---|
| `feat` | 새로운 기능 | `feat/rolling-paper` |
| `fix` | 버그 수정 | `fix/mobile-navigation` |
| `docs` | 문서 변경 | `docs/project-conventions` |
| `refactor` | 동작 변화 없는 구조 개선 | `refactor/letter-service` |
| `test` | 테스트 추가·수정 | `test/letter-validation` |
| `chore` | 설정과 유지보수 | `chore/configure-eslint` |
| `hotfix` | 운영 긴급 수정 | `hotfix/block-letter-spam` |

브랜치 이름에 사람 이름, 날짜, 모호한 표현(`update`, `work`, `temp`)을 사용하지 않는다.

## 커밋 메시지

Conventional Commits 형태를 사용한다.

```text
<type>(<optional-scope>): <한국어로 작성한 구체적인 변경 목적>
```

예시:

```text
feat(rolling-paper): 익명 편지 작성 폼을 추가
fix(header): 모바일 메뉴의 가로 넘침을 수정
docs: 프로젝트 작업 규칙을 정의
refactor(works): 작업 데이터 변환 로직을 분리
test(letters): 잘못된 편지 내용 검증을 추가
build: TypeScript 빌드 환경을 구성
```

### 커밋 type

- `feat`: 사용자에게 보이는 기능 추가
- `fix`: 잘못된 동작 수정
- `docs`: 문서만 변경
- `refactor`: 외부 동작을 유지한 구조 변경
- `test`: 테스트만 추가·변경
- `style`: 포맷처럼 동작에 영향 없는 변경
- `perf`: 성능 개선
- `build`: 빌드와 의존성 변경
- `ci`: CI 설정 변경
- `chore`: 그 외 유지보수
- `revert`: 이전 커밋 되돌림

### 작성 규칙

- 제목과 본문은 한국어로 작성하고 제목 끝에 마침표를 붙이지 않는다. Conventional Commit의 `type`은 영문으로 유지한다.
- 제목은 변경 목적이 드러나도록 구체적으로 작성한다. `수정`, `작업`, `업데이트`처럼 의미가 넓은 표현만 사용하지 않는다.
- 모든 커밋에 상세 본문을 작성한다. 본문은 빈 줄 뒤에 `변경 내용`, `변경 이유`를 각각 기록한다.
- 한 커밋에는 하나의 작고 독립적인 논리 변경만 담는다. 의존성·설정, 기능, 테스트, 문서, 리팩터링은 가능한 한 분리한다.
- scope는 기능이나 영역을 명확히 할 때만 사용한다.
- 호환성을 깨는 변경은 본문에 `BREAKING CHANGE:`를 기록한다.

### 본문 형식

```text
feat(header): 반응형 공통 헤더를 추가

변경 내용:
- Web·Tab·Mobile 규격의 메뉴 그리드와 활성 상태를 구현
- Main, About, Work, Profile, Message 탐색을 제공

변경 이유:
- 화면별 구현 전에 공통 탐색 구조와 반응형 기준을 고정하기 위해
```

- `변경 내용`에는 실제 동작이나 구조 변경을 적는다. 수정한 파일의 목록이나 코드 줄을 그대로 나열하지 않는다.
- `변경 이유`에는 문제, 사용자 가치, 후속 작업과의 관계를 적는다.

## 풀 리퀘스트

- `.github/pull_request_template.md`를 사용한다.
- 제목은 커밋 메시지와 같은 형식을 권장한다.
- PR 본문은 당일 작업 맥락을 다음 날에도 빠르게 복기할 수 있도록 짧은 개조식으로 작성한다. 최소 항목은 `오늘 한 일`, `화면 자료`, `다음 작업`이다.
- UI 변경에는 PC와 모바일 스크린샷 또는 짧은 영상을 `화면 자료`에 첨부한다. 화면 변화가 없으면 이유를 적는다.
- QA 요청, 남은 이슈, 피그마·ADR·Discussion 링크는 `검토 메모`에 연결한다.
- 검증 결과는 필요한 경우에만 한 줄로 기록한다. PR 본문을 긴 체크리스트로 만들지 않는다.
- 한 PR에 관련 없는 리팩터링이나 포맷 변경을 섞지 않는다.

## 병합

- CI가 준비되면 lint, type-check, test, build 통과를 `main` 병합 조건으로 설정한다.
- 기본 병합 방식은 Squash merge를 사용해 PR 하나를 하나의 의미 있는 커밋으로 남긴다.
- PR의 QA·검토 결과를 확인한 뒤 사용자가 병합을 요청할 때만 `main`에 병합한다. 운영 장애 대응도 가능한 한 긴급 PR로 기록한다.
