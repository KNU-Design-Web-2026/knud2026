"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { KnudLogo } from "@/components/layout/knud-logo";
import { getHeaderSpacerBackgroundClass, isNavigationPathActive } from "@/components/layout/navigation";

const navigation = [
  { href: "/about", label: "ABOUT", hoverAsset: "/assets/figma/nav-about-hover-2026.svg" },
  { href: "/work", label: "WORK", hoverAsset: "/assets/figma/nav-work-hover-2026.svg" },
  { href: "/profile", label: "PROFILE", hoverAsset: "/assets/figma/nav-profile-hover-2026.svg" },
  { href: "/space", label: "SPACE", hoverAsset: "/assets/figma/nav-space-hover-2026.svg" },
  { href: "/message", label: "MESSAGE", hoverAsset: "/assets/figma/nav-message-hover-2026.svg" },
];

const mobileNavigation = [
  { href: "/about", label: "ABOUT" },
  { href: "/work", label: "WORK" },
  { href: "/profile", label: "PROFILE" },
  { href: "/space", label: "SPACE" },
  { href: "/message", label: "MESSAGE" },
];

type SiteHeaderProps = {
  activePath?: string;
};

export function SiteHeader({ activePath }: SiteHeaderProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const lastScrollYRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const currentPath = activePath ?? pathname;
  const spacerBackgroundClass = getHeaderSpacerBackgroundClass(currentPath);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      const scrollDistance = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= 0) {
        setIsHidden(false);
      } else if (Math.abs(scrollDistance) >= 8) {
        setIsHidden(scrollDistance > 0);
      }

      lastScrollYRef.current = currentScrollY;
      animationFrameRef.current = null;
    };

    const handleScroll = () => {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(updateHeaderVisibility);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  return (
    <div className={`h-[var(--header-height)] ${spacerBackgroundClass}`}>
      <header className={`fixed inset-x-0 top-0 z-50 h-[var(--header-height)] bg-black text-white transition-opacity duration-220 ease-out ${isHidden ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <PageContainer className="flex h-full items-center justify-between gap-[clamp(0.5rem,2.35vw,2rem)]">
        <Link className="site-header__brand flex min-w-0 items-center gap-[var(--header-brand-gap)]" href="/" aria-label="KNUD 졸업전시회 메인으로 이동">
          <KnudLogo />
          <span className="site-header__title min-w-0 text-[length:var(--header-title-size)] leading-[1.3] font-bold tracking-[var(--header-title-tracking)]">
            <span className="block whitespace-nowrap">2026 제<span className="max-[1350.1px]:hidden"> </span>42회 경북대학교 디자인학과 졸업전시회</span>
            <span className="block whitespace-nowrap">42th KNUD Graduation Exhibition Archive</span>
          </span>
        </Link>
        <nav className="flex h-full w-[var(--header-nav-container-width)] shrink-0 items-center gap-[var(--header-nav-gap)] min-[1350.1px]:justify-between max-[1349.9px]:hidden" aria-label="주요 메뉴">
          {navigation.map((item) => {
            const isActive = isNavigationPathActive(currentPath, item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "header-nav-link group relative flex h-full w-[var(--header-nav-item-width)] items-center justify-center text-[length:var(--header-nav-size)] leading-[1.3] tracking-[var(--header-nav-tracking)]",
                  isActive && "header-nav-link--active font-bold text-knud-navigation-active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                key={item.href}
              >
                <span className="header-nav-link__label relative z-10 group-hover:text-[length:var(--header-nav-hover-size)] group-hover:font-bold group-hover:text-knud-navigation-active max-[1350.1px]:group-hover:text-[length:var(--header-nav-size)]">
                  {item.label}
                </span>
                {!isActive && <span className="header-nav-link__bar pointer-events-none absolute bottom-0 left-1/2 h-2 w-[var(--header-nav-item-width)] bg-knud-navigation-active" />}
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
        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          className="mobile-menu-trigger hidden size-[var(--header-menu-size)] shrink-0 max-[1349.9px]:flex"
          data-open={isMenuOpen}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          <span aria-hidden="true" className="mobile-menu-trigger__icon">
            <span className="mobile-menu-trigger__line" />
            <span className="mobile-menu-trigger__line" />
            <span className="mobile-menu-trigger__line" />
          </span>
        </button>
        </PageContainer>
      </header>
      <button
        aria-label="메뉴 닫기"
        className="mobile-menu-backdrop fixed inset-x-0 bottom-0 top-[var(--header-height)] z-30 hidden max-[1349.9px]:block"
        data-open={isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
        tabIndex={isMenuOpen ? 0 : -1}
        type="button"
      />
      <div aria-hidden={!isMenuOpen} className="mobile-menu-panel fixed inset-x-0 top-[var(--header-height)] z-40 border-b border-white/70 bg-black/[0.77] backdrop-blur-[9px]" data-open={isMenuOpen} role="dialog" aria-label="모바일 메뉴">
          <nav className="flex w-full flex-col" id="mobile-navigation" aria-label="모바일 주요 메뉴">
            {mobileNavigation.map((item) => {
              const isActive = isNavigationPathActive(currentPath, item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "mobile-menu-panel__item relative flex h-[86px] items-center justify-center border-b border-white/70 px-5 text-center text-[32px] leading-[1.3] tracking-[-0.2px] text-white last:border-b-0 max-[600.1px]:h-[68px] max-[600.1px]:text-2xl max-[400.1px]:h-[54px] max-[400.1px]:text-xl",
                    isActive && "bg-knud-navigation-active font-normal text-knud-ink",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  tabIndex={isMenuOpen ? 0 : -1}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
    </div>
  );
}
