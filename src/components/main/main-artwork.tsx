import Image from "next/image";

type ArtworkPiece = {
  height: string;
  left: string;
  src: string;
  top: string;
  width: string;
};

const artwork: ArtworkPiece[] = [
  { src: "/assets/figma/main-art-01.svg", left: "1.61%", top: "9.58%", width: "26.56%", height: "49.26%" },
  { src: "/assets/figma/main-art-02.svg", left: "25.31%", top: "70.5%", width: "11.36%", height: "17.63%" },
  { src: "/assets/figma/main-art-03.svg", left: "48.54%", top: "54.33%", width: "16.26%", height: "26.35%" },
  { src: "/assets/figma/main-art-04.svg", left: "63.01%", top: "19.92%", width: "18.29%", height: "48.38%" },
  { src: "/assets/figma/main-art-05.svg", left: "55.84%", top: "16.7%", width: "15.03%", height: "42.46%" },
  { src: "/assets/figma/main-art-06.svg", left: "49.65%", top: "14.28%", width: "20.17%", height: "53.93%" },
  { src: "/assets/figma/main-art-07.svg", left: "36.83%", top: "17.35%", width: "16.41%", height: "48.27%" },
  { src: "/assets/figma/main-art-08.svg", left: "27.28%", top: "11.75%", width: "17.22%", height: "55.88%" },
  { src: "/assets/figma/main-art-09.svg", left: "17.6%", top: "16.7%", width: "15.59%", height: "51.33%" },
  { src: "/assets/figma/main-art-10.svg", left: "80.07%", top: "39.42%", width: "9.92%", height: "13.12%" },
  { src: "/assets/figma/main-art-11.svg", left: "75.5%", top: "60.19%", width: "9.02%", height: "25.33%" },
  { src: "/assets/figma/main-art-12.svg", left: "79.72%", top: "60.06%", width: "9.02%", height: "25.43%" },
  { src: "/assets/figma/main-art-13.svg", left: "63.14%", top: "62.11%", width: "17.19%", height: "29.02%" },
  { src: "/assets/figma/main-art-14.svg", left: "68.43%", top: "62.11%", width: "17.11%", height: "29.1%" },
  { src: "/assets/figma/main-art-15.svg", left: "73.62%", top: "50%", width: "15.22%", height: "20.91%" },
  { src: "/assets/figma/main-art-16.svg", left: "61.88%", top: "46.14%", width: "26.64%", height: "41.18%" },
  { src: "/assets/figma/main-art-17.svg", left: "70.61%", top: "64.3%", width: "7.3%", height: "8.75%" },
  { src: "/assets/figma/main-art-18.svg", left: "90.23%", top: "90.01%", width: "8.12%", height: "1.17%" },
  { src: "/assets/figma/main-art-19.svg", left: "84.8%", top: "79.85%", width: "13.06%", height: "10.78%" },
  { src: "/assets/figma/main-art-20.svg", left: "84.8%", top: "79.85%", width: "13.06%", height: "10.78%" },
  { src: "/assets/figma/main-art-21.svg", left: "83.65%", top: "69.09%", width: "7.89%", height: "22.51%" },
  { src: "/assets/figma/main-art-22.svg", left: "83.65%", top: "69.09%", width: "7.89%", height: "22.51%" },
];

export function MainArtwork() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {artwork.map((piece) => (
        <span
          className="absolute block"
          key={piece.src}
          style={{ height: piece.height, left: piece.left, top: piece.top, width: piece.width }}
        >
          <Image alt="" className="object-fill" fill sizes="100vw" src={piece.src} />
        </span>
      ))}
    </div>
  );
}
