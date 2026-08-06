import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";

export default function HomePage() {
  return (
    <Section className="grid min-h-[min(45rem,calc(100svh-var(--header-height)))] items-end bg-knud-sky max-[600px]:min-h-128">
      <PageContainer>
        <p className="text-sm font-semibold">KNUD 2026</p>
        <h1 className="my-4 mb-12 font-display text-display font-extrabold leading-[0.78] tracking-[-0.105em]">
          GRADUATION
          <br />
          EXHIBITION
        </h1>
        <p className="max-w-140 text-sm leading-[1.55] font-semibold">
          공통 컴포넌트와 반응형 규격을 먼저 정리한 구현 기반입니다.
          <br />
          다음 단계에서 각 전시 페이지의 콘텐츠와 인터랙션을 연결합니다.
        </p>
      </PageContainer>
    </Section>
  );
}
