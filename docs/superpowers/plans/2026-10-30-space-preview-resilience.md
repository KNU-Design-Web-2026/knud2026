# SPACE 작품 탐색 회복력 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans after approval. All changes stay local unless the user separately requests commits or deployment.

**Goal:** 네트워크 지연에도 지도에서 선택한 작품을 식별하고 상세로 이동할 수 있도록 정보·미리보기·최종 이미지를 분리한다.
**Architecture:** 기존 SpaceMap, 작품별 key, Next Image와 SPACE 원본을 유지한다. 기존 manifest의 미리보기만 연결하고 준비 상태는 이미지에만 적용한다. 오류 상태에만 재시도 컨트롤을 제공한다.
**Tech Stack:** 기존 Next.js/React/TypeScript, Playwright Test, tsx/node:test.
**Spec:** 사용자 승인 대화(현장 제보→관찰→원인 구분→선택→검증), `docs/design/qa/2026-10-30-space-preview-resilience.md`에 구현·검증 결과를 남긴다. 현장 재측정이나 성능 개선율을 사전에 가정하지 않는다.

## Global Constraints

- 최종 이미지 경로·quality·sizes·object-fit·카드 크기·폰트·shade·모션·지도 좌표를 유지한다.
- MESSAGE/헤더/낙서/운영 DB/분석 태그는 수정하지 않는다.
- 원본은 보존한다. 일괄 원본 prefetch, 전체 offline 앱, 프레임워크 변경은 하지 않는다.
- 현재 baseline은 5328fc2. 데이터·코드·빌드·조건과 실패를 원시 기록에 남긴다.
- 사용자 명시 요청 전 commit/push/PR/merge/deploy는 하지 않는다.

## Review Focus

- A→B→A 및 늦은 이전 이미지 완료가 현재 작품과 뒤섞이지 않는가.
- 오류 컨트롤로 이동할 때 팝업이 닫히거나 작품 링크와 중첩되지 않는가.
- 비활성/모바일 미리보기가 불필요한 요청·타이머를 만드는가.
- 미리보기 데이터가 초기 응답을 과도하게 키우지 않는가.
- mock 실패 테스트를 캐시 성능이나 실제 사용자 개선으로 해석하지 않는가.

### Task 1: 테스트 기반·baseline 확보

- [ ] Playwright 버전을 고정하고 정상 빌드 서버 대상 설정을 추가한다.
- [ ] SPACE 원본 코드의 독립 baseline 빌드를 준비한다. 비밀값/운영 DB 없이 공개 정적 경로만 검증한다.
- [ ] 실제 브라우저에서 이미지 응답을 보류해 정보·미리보기 표시 요구가 실패하는 것을 확인한다.
- [ ] routing 없는 성능 측정과 routing 기반 기능 검증을 분리한다.

### Task 2: 최소 이미지 상태·데이터 개선

- [ ] SPACE 미리보기 매칭과 오래된 요청/재시도 상태를 검사하는 테스트를 먼저 작성하고 RED를 확인한다.
- [ ] WorkItem에 SPACE 전용 preview data를 연결한다. 큰 manifest의 불필요한 필드를 Client props로 추가 전달하지 않는다.
- [ ] 선택 정보·preview는 즉시, 최종 이미지만 ready 때 표시한다. 2초 지연 안내는 선택 중에만 작동하고 요청을 취소하지 않는다.
- [ ] 오류 상태에서만 재시도 가능하게 하며 포인터/focus가 해당 부스·팝업에 있을 때 유지한다. Escape/외부 이탈과 타이머를 정리한다.
- [ ] 정상 상태와 모바일 직접 이동을 유지한다. quality/sizes 조정이나 LRU는 별도 증거가 없으므로 제외한다.

### Task 3: 브라우저·전후 측정·디자인 검증

- [ ] 지연/실패/재시도/역순 완료/빠른 선택/키보드/모바일/reduced motion을 자동 검사한다.
- [ ] 고화질 준비 이후 baseline/candidate의 같은 화면을 비교한다. 동적 상태를 통째로 마스킹해 통과시키지 않는다.
- [ ] 저속·정상 및 cold/warm 조건을 고정해 전후를 반복 비교하고 정보 표시/최종 준비/요청량을 분리한다.
- [ ] 지표 집계에서 실패·timeout을 보존하고 baseline에 없는 결과를 백분율로 바꾸지 않는다.
- [ ] 전체 기존 테스트, lint, type-check, build 및 fresh-context 코드 리뷰를 수행한다.

### Task 4: 제품 판단·포트폴리오 기록

- [ ] 선택한 범위와 선택하지 않은 대안을 기록한다. 지도 우선 선택은 증거·검증 가능성 근거이지 피해 빈도 1위라는 증거가 아님을 명시한다.
- [ ] 실제 측정된 숫자와 출처·조건만 결과에 반영한다. 사용자 만족/이탈/현장 해결을 과장하지 않는다.
- [ ] 스토리는 사용자 목적→피드백→현장 관찰→원인 구분→결정→검증으로 연결한다.
