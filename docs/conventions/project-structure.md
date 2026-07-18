# 프로젝트 구조 컨벤션

아래 구조는 애플리케이션을 생성할 때 적용할 목표 구조다. 실제 책임이 생기기 전에는 빈 폴더를 만들지 않는다.

```text
src/
├── app/                  # 라우트, 레이아웃, 페이지, Route Handler
├── components/           # 여러 기능이 공유하는 UI와 레이아웃
│   ├── ui/
│   └── layout/
├── features/             # 기능 단위 UI, 스키마, 서버 로직
├── data/                 # 정적 작품·작가·전시 데이터
├── lib/                  # 공용 인프라와 외부 시스템 연결
├── styles/               # 전역 스타일과 디자인 토큰
└── types/                # 기능을 넘어 공유되는 타입

public/
├── images/
├── icons/
├── fonts/
└── videos/

e2e/                     # 전체 사용자 흐름 테스트
docs/                    # ADR, 컨벤션, 계획 문서
```

## 배치 원칙

- 함께 변경되는 코드는 같은 기능 폴더에 둔다.
- `components/`에는 둘 이상의 기능에서 실제로 재사용하는 UI만 둔다.
- 특정 페이지에서만 쓰는 코드는 해당 라우트 또는 기능 가까이에 둔다.
- `utils/`, `helpers/`, `common/`을 범용 보관함처럼 만들지 않는다.
- `index.ts` barrel export는 기본적으로 만들지 않고 실제 필요가 있을 때만 추가한다.
- 빈 폴더와 미래 가능성만을 위한 추상화는 만들지 않는다.

## App Router 규칙

- `app/`은 URL 구조와 화면 조합을 표현한다.
- `page.tsx`와 `layout.tsx`는 데이터와 UI를 조합하고 복잡한 비즈니스 로직을 직접 갖지 않는다.
- Route Handler는 요청 파싱, 인증·인가 확인, 응답 변환을 담당한다.
- 데이터 검증, 서비스 로직, DB 접근은 Route Handler 밖으로 분리한다.
- Route Group은 URL에 영향을 주지 않는 레이아웃 또는 책임 분리가 실제로 필요할 때만 사용한다.

## 기능 폴더 예시

```text
src/features/rolling-paper/
├── components/
├── schemas/
├── server/
│   ├── letter-repository.ts
│   └── letter-service.ts
└── types.ts
```

- `components/`: 롤링페이퍼 전용 UI
- `schemas/`: 외부 입력과 데이터 경계 검증
- `server/`: 서버에서만 실행되는 서비스와 데이터 접근
- `types.ts`: 기능 내부에서 공유하는 타입

## AGENTS.md 배치

- 저장소 루트 `AGENTS.md`는 전체 공통 규칙만 갖는다.
- 하위 `AGENTS.md`는 해당 디렉터리가 공통 규칙과 다른 명확한 요구를 가질 때만 추가한다.
- 같은 규칙을 루트와 하위 파일에 복사하지 않는다.
- 현재는 하위 파일을 만들지 않는다. 롤링페이퍼나 테스트 디렉터리에 반복되는 별도 규칙이 확인될 때 추가한다.
