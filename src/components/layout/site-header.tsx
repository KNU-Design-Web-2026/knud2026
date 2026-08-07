import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { KnudLogo } from "@/components/layout/knud-logo";

const navigation = [
  { href: "/about", label: "ABOUT", hoverAsset: "/assets/figma/nav-about-hover-2026.svg" },
  { href: "/work", label: "WORK", hoverAsset: "/assets/figma/nav-work-hover-2026.svg" },
  { href: "/profile", label: "PROFILE", hoverAsset: "/assets/figma/nav-profile-hover-2026.svg" },
  { href: "/space", label: "SPACE", hoverAsset: "/assets/figma/nav-space-hover-2026.svg" },
  { href: "/message", label: "MESSAGE", hoverAsset: "/assets/figma/nav-message-hover-2026.svg" },
];

type SiteHeaderProps = {
  activePath?: string;
};

export function SiteHeader({ activePath = "/" }: SiteHeaderProps) {
  return (
    <header className="relative z-10 h-[var(--header-height)] bg-black text-white">
      <PageContainer className="flex h-full items-center justify-between gap-8">
        <Link className="flex w-[32.9375rem] min-w-0 items-center gap-[var(--header-brand-gap)] max-[1350.1px]:w-[31.8125rem]" href="/" aria-label="KNUD 졸업전시회 메인으로 이동">
          <KnudLogo />
          <span className="w-[24.5rem] min-w-0 text-[length:var(--header-title-size)] leading-[1.3] font-bold tracking-[var(--header-title-tracking)] max-[1350.1px]:w-[24.3125rem] max-[1020.1px]:min-w-[13.6rem] max-[600.1px]:min-w-[13.2rem] max-[400.1px]:min-w-0 max-[400.1px]:w-auto max-[360.1px]:shrink-0">
            <span className="block whitespace-nowrap">2026 제<span className="max-[1350.1px]:hidden"> </span>42회 경북대학교 디자인학과 졸업전시회</span>
            <span className="block whitespace-nowrap">42th KNUD Graduation Exhibition Archive</span>
          </span>
        </Link>
        <nav className="flex h-full w-[var(--header-nav-container-width)] shrink-0 items-center gap-[var(--header-nav-gap)] min-[1350.1px]:justify-between max-[1349.9px]:hidden" aria-label="주요 메뉴">
          {navigation.map((item) => {
            const isActive = item.href === activePath;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "header-nav-link group relative flex h-full items-center justify-center text-[length:var(--header-nav-size)] leading-[1.3] tracking-[var(--header-nav-tracking)] min-[1350.1px]:w-auto max-[1350.1px]:w-[var(--header-nav-width)]",
                  isActive && "font-bold text-knud-navigation-active after:absolute after:inset-x-0 after:bottom-0 after:h-2 after:bg-knud-navigation-active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                key={item.href}
              >
                <span className="header-nav-link__label relative z-10 group-hover:text-[length:var(--header-nav-hover-size)] group-hover:font-bold group-hover:text-knud-navigation-active max-[1350.1px]:group-hover:text-[length:var(--header-nav-size)]">
                  {item.label}
                </span>
                {!isActive && <span className="header-nav-link__bar pointer-events-none absolute bottom-0 left-1/2 h-2 w-[8.625rem] bg-knud-navigation-active max-[1350.1px]:w-[var(--header-nav-width)]" />}
                {!isActive && (
                  <Image
                    alt=""
                    className="header-nav-link__decoration pointer-events-none absolute bottom-0 left-1/2 z-0 h-[2.993rem] w-[4.558rem] max-[1350.1px]:h-[2.56rem] max-[1350.1px]:w-[3.893rem]"
                    height={47.889}
                    src={item.hoverAsset}
                    width={72.929}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <button className="hidden size-[var(--header-menu-size)] shrink-0 max-[1349.9px]:flex" type="button" aria-label="메뉴 열기">
          <Image alt="" className="hidden size-full min-[600.1px]:max-[1349.9px]:block" height={48} src="/assets/figma/menu-list-1020.svg" width={48} />
          <Image alt="" className="hidden size-full min-[480.1px]:max-[600.1px]:block" height={48} src="/assets/figma/menu-list-600.svg" width={48} />
          <Image alt="" className="hidden size-full max-[480.1px]:block" height={30} src="/assets/figma/menu-list-400.svg" width={30} />
        </button>
      </PageContainer>
    </header>
  );
}
