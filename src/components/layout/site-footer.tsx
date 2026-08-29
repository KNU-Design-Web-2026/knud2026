import Image from "next/image";
import { PageContainer } from "@/components/layout/page-container";

export function SiteFooter() {
  return (
    <footer className="site-footer h-[var(--footer-height)] bg-knud-footer text-white">
      <PageContainer className="site-footer__container flex h-full items-center py-[var(--footer-padding-y)]">
        <div className="site-footer__content flex w-full items-center justify-between max-[1350px]:grid max-[1350px]:grid-cols-2">
          <div className="site-footer__brand flex w-98 shrink-0 flex-col gap-[var(--footer-brand-gap)] max-[1350px]:w-auto">
            <Image
              alt="KNUD"
              className="site-footer__logo h-[var(--footer-logo-height)] w-[var(--footer-logo-width)]"
              height={84}
              src="/assets/figma/footer-logo.svg"
              width={80}
            />
            <div className="site-footer__brand-copy text-[var(--footer-font-size)] leading-[1.3] font-bold tracking-[-0.02em]">
              <p>제42회 경북대학교 디자인학과 졸업전시회</p>
              <p>42th KNUD Graduation Exhibition Archive</p>
            </div>
          </div>
          <div className="site-footer__information flex w-151.25 shrink-0 flex-col gap-[var(--footer-content-gap)] text-[var(--footer-font-size)] leading-[1.3] font-bold tracking-[-0.02em] max-[1350px]:w-auto">
            <div className="site-footer__schedule">
              <p>2026.10.20 TUE — 2026.10.31 SAT</p>
              <p>9AM — 6PM</p>
              <p>경북대학교 SPACE 9</p>
            </div>
            <a className="text-knud-footer-muted underline underline-offset-2" href="https://www.instagram.com/knu_design_exhibition" target="_blank" rel="noreferrer">
              Instagram @knu_design_exhibition
            </a>
            <p className="site-footer__copyright text-knud-footer-muted">© 2026 Kyungpook National University VCD. All rights Reserved.</p>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
