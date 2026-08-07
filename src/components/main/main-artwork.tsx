import Image from "next/image";

const artwork = [
  { className: "block max-[1350.1px]:hidden", height: "69.7917vw", left: 0, src: "/assets/figma/main-frame-1920.png", top: "calc(-1 * var(--header-height))", width: "100vw" },
  { className: "hidden min-[1020.1px]:max-[1350.1px]:block", height: 900, left: 0, src: "/assets/figma/main-frame-1350.png", top: -120, width: 1350 },
  { className: "hidden min-[600.1px]:max-[1020.1px]:block", height: 1370, left: 0, src: "/assets/figma/main-frame-1020.png", top: -120, width: 1020 },
  { className: "hidden min-[400.1px]:max-[600.1px]:block", height: 749.217, left: 7.949, src: "/assets/figma/main-artwork-600.svg", top: 64.359, width: 603.051 },
  { className: "hidden max-[400.1px]:block", height: 583.969, left: -14, src: "/assets/figma/main-artwork-400.svg", top: 56, width: 450.001 },
];

export function MainArtwork() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {artwork.map((piece) => (
        <Image alt="" className={`absolute object-fill ${piece.className}`} height={typeof piece.height === "number" ? piece.height : 1340} key={piece.src} priority src={piece.src} style={{ height: piece.height, left: piece.left, top: piece.top, width: piece.width }} width={typeof piece.width === "number" ? piece.width : 1920} />
      ))}
    </div>
  );
}
