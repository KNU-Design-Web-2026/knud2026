# 네이밍 컨벤션

코드 식별자는 영어를 사용한다. 의미가 분명한 전체 단어를 우선하고 프로젝트에서 널리 이해되는 약어만 허용한다.

## 폴더와 파일

| 대상 | 규칙 | 예시 |
|---|---|---|
| 일반 폴더 | kebab-case | `rolling-paper/` |
| 라우트 폴더 | URL과 일치하는 kebab-case | `work-detail/` |
| 일반 TypeScript 파일 | kebab-case | `letter-service.ts` |
| React 컴포넌트 파일 | kebab-case | `letter-card.tsx` |
| Hook 파일 | `use-*.ts` | `use-pointer-position.ts` |
| 테스트 파일 | `*.test.ts(x)` | `letter-card.test.tsx` |
| 스키마 파일 | `*.schema.ts` | `letter.schema.ts` |
| 서버 전용 파일 | `*.server.ts` 또는 `server/` 내부 | `auth.server.ts` |
| 정적 데이터 파일 | 복수형 kebab-case | `artists.ts` |

`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx` 등 Next.js 예약 파일명은 그대로 사용한다.

## 코드 식별자

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트·타입 | PascalCase | `LetterCard`, `LetterInput` |
| 함수·변수 | camelCase | `createLetter`, `artistId` |
| 상수 | UPPER_SNAKE_CASE | `MAX_LETTER_LENGTH` |
| Hook | `use` + PascalCase | `usePointerPosition` |
| 이벤트 처리 함수 | `handle` 접두사 | `handleSubmit` |
| 이벤트 prop | `on` 접두사 | `onDelete` |
| Boolean | `is`, `has`, `can`, `should` | `isVisible` |
| Props 타입 | `<Component>Props` | `LetterCardProps` |

## 이름 작성 기준

- `data`, `item`, `value`, `info`, `util`처럼 문맥 없는 이름을 단독으로 사용하지 않는다.
- 배열과 컬렉션은 복수형으로 작성한다.
- 함수 이름은 동사로 시작하고 컴포넌트와 타입은 명사로 작성한다.
- DB 식별자는 코드에서 `artistId`처럼 일관된 camelCase를 사용한다.
- API 경로는 명사 복수형을 사용한다. 예: `/api/letters`.
- 이미지와 영상 파일명은 내용을 설명하는 kebab-case를 사용하고 `final`, `new`, `copy` 같은 버전 표현을 피한다.
