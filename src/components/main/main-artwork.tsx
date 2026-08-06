import Image from "next/image";

const artwork = [
  { className: "block max-[1350px]:hidden", height: 984.223, left: 31, src: "/assets/figma/main-artwork-1920.svg", top: 115, width: 1857.264 },
  { className: "hidden min-[1021px]:max-[1350px]:block", height: 644.927, left: 67, src: "/assets/figma/main-artwork-1350.svg", top: 67, width: 1217 },
  { className: "hidden min-[601px]:max-[1020px]:block", height: 1024.834, left: 29, src: "/assets/figma/main-artwork-1020.svg", top: 90, width: 959.068 },
  { className: "hidden min-[401px]:max-[600px]:block", height: 749.217, left: 7.949, src: "/assets/figma/main-artwork-600.svg", top: 64.359, width: 603.051 },
  { className: "hidden max-[400px]:block", height: 583.969, left: -14, src: "/assets/figma/main-artwork-400.svg", top: 56, width: 450.001 },
];

export function MainArtwork() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {artwork.map((piece) => (
        <Image alt="" className={`absolute object-fill ${piece.className}`} height={piece.height} key={piece.src} priority src={piece.src} style={{ height: piece.height, left: piece.left, top: piece.top, width: piece.width }} width={piece.width} />
      ))}
    </div>
  );
}
