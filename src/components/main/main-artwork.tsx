import Image from "next/image";

const artwork = [
  { className: "block max-[1350.1px]:hidden", height: "69.7917vw", left: 0, src: "/assets/figma/main-frame-1920.png", top: "calc(-1 * var(--header-height))", width: "100vw" },
  { className: "hidden min-[1020.1px]:max-[1350.1px]:block", height: "66.6667vw", left: 0, src: "/assets/figma/main-frame-1350.png", top: "-8.8889vw", width: "100vw" },
  { className: "hidden min-[600.1px]:max-[1020.1px]:block", height: "134.3137vw", left: 0, src: "/assets/figma/main-frame-1020.png", top: "-11.7647vw", width: "100vw" },
  { className: "hidden min-[400.1px]:max-[600.1px]:block", height: "163.3333vw", left: 0, src: "/assets/figma/main-frame-600.png", top: "-13.3333vw", width: "100vw" },
  { className: "hidden max-[400.1px]:block", height: "215vw", left: 0, src: "/assets/figma/main-frame-400.png", top: "-15vw", width: "100vw" },
];

export function MainArtwork() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {artwork.map((piece) => (
        <Image alt="" className={`absolute object-fill ${piece.className}`} height={typeof piece.height === "number" ? piece.height : 1340} key={piece.src} priority src={piece.src} style={{ height: piece.height, left: piece.left, top: piece.top, width: piece.width }} unoptimized width={typeof piece.width === "number" ? piece.width : 1920} />
      ))}
    </div>
  );
}
