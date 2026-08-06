import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { KnudLogo } from "@/components/layout/knud-logo";

const navigation = [
  { href: "/about", label: "ABOUT", hoverAsset: "/assets/figma/nav-about-hover.svg" },
  { href: "/work", label: "WORK", hoverAsset: "/assets/figma/nav-work-hover.svg" },
  { href: "/profile", label: "PROFILE", hoverAsset: "/assets/figma/nav-profile-hover.svg" },
  { href: "/space", label: "SPACE", hoverAsset: "/assets/figma/nav-space-hover.svg" },
  { href: "/message", label: "MESSAGE", hoverAsset: "/assets/figma/nav-message-hover.svg" },
];

type SiteHeaderProps = {
  activePath?: string;
};

export function SiteHeader({ activePath = "/" }: SiteHeaderProps) {
  return (
    <header className="h-[var(--header-height)] border-b border-white/10 bg-black text-white">
      <PageContainer className="flex h-full items-center justify-between gap-8">
        <Link className="flex min-w-0 items-center gap-[var(--header-brand-gap)]" href="/" aria-label="KNUD 졸업전시회 메인으로 이동">
          <KnudLogo />
          <span className="min-w-0 text-[var(--header-title-size)] leading-[1.3] font-bold tracking-[-0.02em] max-[1020px]:min-w-[13.6rem] max-[600px]:min-w-[13.2rem] max-[400px]:min-w-0">
            <span className="block">2026 제42회 경북대학교 디자인학과 졸업전시회</span>
            <span className="block">42th KNUD Graduation Exhibition Archive</span>
          </span>
        </Link>
        <nav className="flex h-full shrink-0 items-center gap-[var(--header-nav-gap)] max-[1020px]:hidden" aria-label="주요 메뉴">
          {navigation.map((item) => {
            const isActive = item.href === activePath;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group relative flex h-full flex-col items-center justify-center overflow-hidden text-[var(--header-nav-size)] leading-[1.3] tracking-[-0.002em] transition-colors hover:text-knud-navigation-active min-[1351px]:w-auto max-[1350px]:w-[var(--header-nav-width)]",
                  isActive && "font-bold text-knud-navigation-active after:absolute after:inset-x-0 after:bottom-0 after:h-2 after:bg-knud-navigation-active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                key={item.href}
              >
                <span className="relative z-10 group-hover:-translate-y-9 group-hover:font-bold">{item.label}</span>
                <Image
                  alt=""
                  className="pointer-events-none absolute bottom-2 hidden h-12 w-[4.56rem] rotate-[2.89deg] group-hover:block"
                  height={48}
                  src={item.hoverAsset}
                  width={73}
                />
                {!isActive && <span className="absolute inset-x-0 bottom-0 hidden h-2 bg-knud-navigation-active group-hover:block" />}
              </Link>
            );
          })}
        </nav>
        <button className="hidden size-[var(--header-menu-size)] items-center justify-end max-[1020px]:flex" type="button" aria-label="메뉴 열기">
          <span className="flex h-full w-8 flex-col justify-center gap-3 overflow-hidden px-0 max-[400px]:w-5 max-[400px]:gap-2">
            {[0, 1, 2].map((line) => (
              <Image alt="" className="block h-px w-full" height={1} key={line} src="/assets/figma/menu-line.svg" width={33} />
            ))}
          </span>
        </button>
      </PageContainer>
    </header>
  );
}
