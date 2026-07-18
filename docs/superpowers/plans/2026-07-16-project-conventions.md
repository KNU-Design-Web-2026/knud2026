# 프로젝트 컨벤션 구현 계획

> **에이전트 작업자용:** 이 계획을 작업별로 구현할 때 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 진행 상태는 체크박스(`- [ ]`)로 추적한다.

**목표:** 가벼운 Git, 네이밍, 폴더, 코드, 리뷰 컨벤션을 정의하고 PR 템플릿과 간결한 루트 `AGENTS.md`를 추가한다.

**구조:** 세부 규칙은 `docs/conventions/` 아래에 주제별로 나누고 README를 목차로 사용한다. `AGENTS.md`는 짧은 작업 안내서로 유지한다. 실제 하위 디렉터리에 별도 규칙이 생기기 전에는 중첩 `AGENTS.md`를 만들지 않는다.

**기술 요소:** Markdown, Git, Next.js App Router 구조, TypeScript 컨벤션

## 전체 제약사항

- ADR-0001을 Next.js 선정 근거의 기준 문서로 유지한다.
- 이번 변경에서는 애플리케이션을 생성하거나 승인되지 않은 라이브러리를 선택하지 않는다.
- `AGENTS.md`는 60줄 이하로 유지한다.
- 상세 설명은 `AGENTS.md`가 아니라 `docs/conventions/README.md`와 연결된 문서에 둔다.
- 프로젝트 문서는 한국어, 코드 식별자는 영어를 사용한다.
- 커밋하지 않고 모든 변경을 사용자 검토가 가능한 상태로 남긴다.

---

### 작업 1: 프로젝트 컨벤션 문서 추가

**파일:**

- 생성: `docs/conventions/README.md`
- 생성: `docs/conventions/git.md`
- 생성: `docs/conventions/naming.md`
- 생성: `docs/conventions/project-structure.md`
- 생성: `docs/conventions/code-style.md`
- 생성: `docs/conventions/review.md`
- 참고: `docs/architecture/adr/0001-use-nextjs.md`

**입출력:**

- 입력: ADR-0001에서 승인된 Next.js 아키텍처 결정
- 출력: `AGENTS.md`와 향후 계획이 참조할 컨벤션 기준 문서

- [x] **1단계: 컨벤션 문서 작성**

목차와 Git 작업 흐름, 이름 규칙, 목표 프로젝트 구조, 코드 스타일, 리뷰 기준 문서를 작성한다. Server Component 우선, 기능 중심 경계, 외부 데이터 검증, 편지 논리 삭제, 접근성, 품질 기준, Conventional Commits 접두사, ADR 사용 규칙을 정의한다. 데이터베이스, ORM, CSS 방식, 애니메이션 라이브러리, 인증 제공자, 호스팅 제공자는 선택하지 않는다.

- [x] **2단계: 미완성 표시가 없는지 검증**

실행: `rg -n 'TO''DO|T''BD|FI''XME|나중에'' 작성' docs/conventions`

예상 결과: 출력 없이 종료 코드 1

### 작업 2: PR 템플릿과 경량 에이전트 안내 추가

**파일:**

- 생성: `.github/pull_request_template.md`
- 생성: `AGENTS.md`
- 참고: `docs/conventions/README.md`
- 참고: `docs/architecture/adr/0001-use-nextjs.md`

**입출력:**

- 입력: 상세 컨벤션과 승인된 아키텍처 결정
- 출력: 향후 코딩 에이전트가 읽을 짧은 저장소 수준 안내

- [x] **1단계: `AGENTS.md`와 PR 템플릿 작성**

요약, 변경 사항, 화면 자료, 검증, 관련 자료를 담는 간결한 PR 템플릿을 추가한다. `AGENTS.md`에는 ADR-0001과 컨벤션 목차를 연결하고 TypeScript strict, Server Component 우선, 작은 Client Component 경계, 입력 검증, 서버 관리자 권한 확인, 접근성, 승인되지 않은 의존성 금지, 품질 확인 규칙을 기록한다.

- [x] **2단계: 경량 크기 제한 검증**

실행: `test "$(wc -l < AGENTS.md)" -le 60`

예상 결과: 종료 코드 0

### 작업 3: 커밋하지 않고 문서 검증

**파일:**

- 검증: `AGENTS.md`
- 검증: `docs/conventions/README.md`
- 검증: `.github/pull_request_template.md`
- 검증: `docs/superpowers/plans/2026-07-16-project-conventions.md`

**입출력:**

- 입력: 작업 1과 작업 2에서 생성한 문서
- 출력: 애플리케이션 생성 전에 검토할 수 있는 깨끗한 문서 변경

- [x] **1단계: 내부 링크와 형식 검증**

`test -f docs/architecture/adr/0001-use-nextjs.md`, `git diff --check`, 신규 문서의 미완성 표시 검색을 실행한다.

예상 결과: 파일 확인과 diff 검사는 종료 코드 0, 미완성 표시 검색은 출력 없이 종료 코드 1

- [x] **2단계: 변경 내역 검토**

`git status --short`와 `git diff --stat`을 실행한다.

예상 결과: 계획, 요청된 컨벤션, 템플릿, 에이전트 문서만 신규 상태로 표시된다. 파일을 staging하거나 커밋하지 않는다.
