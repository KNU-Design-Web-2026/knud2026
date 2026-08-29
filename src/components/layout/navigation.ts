export function isNavigationPathActive(pathname: string, href: string) {
  return pathname === href;
}

export function getHeaderSpacerBackgroundClass(pathname: string) {
  return pathname === "/" ? "bg-[#0dadfb]" : "bg-white";
}
