# Git 컨벤션

## 브랜치 전략

1인 개발에 맞는 GitHub Flow를 사용한다. `develop` 같은 장기 브랜치는 두지 않는다.

- `main`은 항상 빌드와 배포가 가능한 상태로 유지한다.
- 기능과 수정 작업은 최신 `main`에서 짧게 유지되는 작업 브랜치를 만든다.
- 작업 브랜치는 PR로 검증한 뒤 `main`에 병합하고 삭제한다.
- `main`에서 force push하거나 이미 공유된 커밋을 임의로 다시 쓰지 않는다.
- 에이전트는 사용자가 명시적으로 요청하지 않으면 커밋, push, merge, PR 생성을 하지 않는다.

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
<type>(<optional-scope>): <summary>
```

예시:

```text
feat(letters): add anonymous letter form
fix(header): prevent mobile menu overflow
docs: define project conventions
refactor(works): separate work data mapper
test(letters): cover invalid content
chore: configure TypeScript
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

- 제목은 영문 명령형 현재 시제로 작성하고 마침표를 붙이지 않는다.
- 제목은 무엇을 했는지가 드러나게 작성한다.
- 한 커밋에는 하나의 논리적 변경만 담는다.
- scope는 기능이나 영역을 명확히 할 때만 사용한다.
- 호환성을 깨는 변경은 본문에 `BREAKING CHANGE:`를 기록한다.

## 풀 리퀘스트

- `.github/pull_request_template.md`를 사용한다.
- 제목은 커밋 메시지와 같은 형식을 권장한다.
- UI 변경에는 PC와 모바일 스크린샷 또는 짧은 영상을 첨부한다.
- 관련 피그마, 이슈, ADR 링크를 연결한다.
- 수행한 검증과 수행하지 못한 검증을 구분해 작성한다.
- 한 PR에 관련 없는 리팩터링이나 포맷 변경을 섞지 않는다.

## 병합

- CI가 준비되면 lint, type-check, test, build 통과를 `main` 병합 조건으로 설정한다.
- 기본 병합 방식은 Squash merge를 사용해 PR 하나를 하나의 의미 있는 커밋으로 남긴다.
- 운영 장애 대응을 제외하고 검증 실패 상태로 병합하지 않는다.
