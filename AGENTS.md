# AGENTS.md

## 기준 문서

- 아키텍처 결정: `docs/architecture/adr/`
- 프로젝트 컨벤션: `docs/conventions/README.md`
- 디자인 결정 및 QA: `docs/design/README.md`
- 풀 리퀘스트 체크리스트: `.github/pull_request_template.md`

수정 전에 관련 문서를 읽는다. 상세 설명은 이 파일을 늘리지 않고 해당 문서에 기록한다.

## 핵심 규칙

- ADR-0001을 따른다. Next.js App Router와 TypeScript를 사용하며, 새로운 ADR 없이 별도 NestJS 앱을 추가하지 않는다.
- TypeScript strict 설정을 유지하고 `any`를 추가하지 않는다.
- Server Component를 기본으로 하고 Client Component는 인터랙션이 필요한 최소 말단으로 제한한다.
- Route Handler는 얇게 유지하고 검증, 인가, 서비스 로직, 데이터 접근을 분리한다.
- 신뢰할 수 없는 모든 입력을 서버에서 검증하고 관리자 변경 작업마다 실행 경계에서 권한을 확인한다.
- 정적 전시 데이터는 저장소에서, 동적 롤링페이퍼 편지는 데이터베이스에서 관리한다.
- 반응형, 시맨틱 HTML, 키보드 접근, focus 상태, reduced motion 지원을 유지한다.
- 필요성을 설명하고 관련 문서를 갱신하지 않은 채 의존성을 추가하거나 아키텍처를 변경하지 않는다.
- 사용자가 명시적으로 요청하지 않으면 커밋, push, merge, PR 생성을 하지 않는다.
- 하위 디렉터리 규칙이 실제로 다를 때만 중첩 `AGENTS.md`를 추가하고 루트 규칙을 복사하지 않는다.

## 완료 전 확인

- `package.json`을 확인하고 존재하는 lint, type-check, test, build 스크립트 중 관련 항목을 실행한다.
- `git diff --check`를 실행하고 전체 변경 내역에서 무관한 변경, 비밀값, 로그, 생성 파일을 확인한다.
- 실행한 검증과 실행하지 못한 검증을 보고한다.
- 동작, 아키텍처, 프로젝트 규칙이 바뀌면 ADR 또는 컨벤션을 갱신한다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
