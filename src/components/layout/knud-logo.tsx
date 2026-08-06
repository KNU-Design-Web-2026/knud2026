const logoParts = [
  { src: "/assets/figma/header-logo-1.svg", className: "inset-[13.75%_0_4.86%_71.28%]" },
  { src: "/assets/figma/header-logo-2.svg", className: "inset-[8.33%_16.38%_20.26%_60.03%]" },
  { src: "/assets/figma/header-logo-3.svg", className: "inset-[4.26%_18.03%_5.03%_50.31%]" },
  { src: "/assets/figma/header-logo-4.svg", className: "inset-[9.41%_44.07%_9.38%_30.18%]" },
  { src: "/assets/figma/header-logo-5.svg", className: "inset-[0_57.77%_6.01%_15.19%]" },
  { src: "/assets/figma/header-logo-6.svg", className: "inset-[8.33%_75.53%_5.33%_0]" },
];

export function KnudLogo() {
  return (
    <span className="relative block h-[var(--header-logo-height)] w-[var(--header-logo-width)] shrink-0" aria-hidden="true">
      {logoParts.map((part) => (
        <span className={["absolute", part.className].join(" ")} key={part.src}>
          <Image alt="" className="object-fill brightness-0 invert" fill src={part.src} />
        </span>
      ))}
    </span>
  );
}
import Image from "next/image";
