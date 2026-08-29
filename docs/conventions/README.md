# 프로젝트 컨벤션

이 디렉터리는 프로젝트를 일관되게 개발하기 위한 규칙의 단일 진입점이다. 규칙은 1인 개발에 필요한 수준으로 유지하고, 자동화할 수 있는 항목은 이후 lint, type-check, test로 강제한다.

## 문서 목록

- [Git 컨벤션](./git.md): 브랜치, 커밋, PR, 병합 규칙
- [네이밍 컨벤션](./naming.md): 폴더, 파일, 식별자 이름
- [프로젝트 구조](./project-structure.md): 예정 폴더와 책임 경계
- [코드 스타일](./code-style.md): TypeScript, Next.js, 서버, UI 규칙
- [리뷰 기준](./review.md): 작업 완료 및 PR 검증 기준
- [ADR-0001](../architecture/adr/0001-use-nextjs.md): Next.js 선정 근거
- [ADR-0002](../architecture/adr/0002-use-storybook-and-chromatic.md): Storybook·Chromatic 선정 근거
- [ADR-0003](../architecture/adr/0003-use-pressure-assisted-layered-spray-rendering.md): 메인 스프레이 렌더링 선정 근거
- [디자인 문서](../design/README.md): 디자인 QA와 인터랙션 명세

## 적용 원칙

1. 사용자의 현재 요청과 저장소에서 가장 가까운 `AGENTS.md`를 우선한다.
2. 아키텍처를 바꾸는 결정은 ADR로 기록한다.
3. 세부 구현은 이 디렉터리의 컨벤션을 따른다.
4. 규칙이 실제 작업을 방해하거나 반복해서 예외를 만든다면 문서를 수정한다.
5. 같은 규칙을 여러 문서에 복사하지 않고 한 곳에서 정의한 뒤 링크한다.

## 현재 확정된 경계

- Next.js App Router와 TypeScript를 사용한다.
- 전시·작품·작가 데이터는 저장소에서 관리하고 정적 생성한다.
- 롤링페이퍼와 최소 관리자 기능만 동적 서버 기능과 데이터베이스를 사용한다.
- Server Component를 기본으로 하고 인터랙션이 필요한 최소 경계만 Client Component로 만든다.
- 초기에는 별도 NestJS 애플리케이션이나 모노레포를 만들지 않는다.
- UI 상태 문서화는 Storybook, 시각 회귀와 디자이너 검수는 Chromatic을 사용한다.

## 아직 확정하지 않는 항목

다음 항목은 요구사항과 배포 환경을 확인한 뒤 별도의 결정으로 기록한다.

- 패키지 매니저와 Node.js 버전
- 데이터베이스와 ORM
- 입력 검증 라이브러리
- 관리자 인증 방식
- CSS 및 컴포넌트 라이브러리
- 애니메이션 라이브러리
- 단위 테스트와 E2E 테스트 프레임워크
- 배포 및 모니터링 서비스
