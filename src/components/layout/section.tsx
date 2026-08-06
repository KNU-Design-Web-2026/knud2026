import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

type SectionProps = PropsWithChildren<ComponentPropsWithoutRef<"section">>;

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section className={["py-24 max-[600px]:py-16", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </section>
  );
}
