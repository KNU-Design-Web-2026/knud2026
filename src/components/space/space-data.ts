import archiveWebImages from "@/data/archive-web-images.json";


// These neutral panels are part of the supplied design, not loaded photographs.
export const archiveColumns = [
  [451.7957, 289, 667.744],
  [287.9956, 287.9956, 553.8401, 553.8401, 553.8401],
  [702.6595, 451.7957, 451.7957, 702.6595],
];

const s3ArchiveBaseUrl = "https://design-graduation-image.s3.ap-northeast-2.amazonaws.com/archive";

// 2025 Archive 원본 40장의 실제 intrinsic size. 테스트 중에도 이미지 비율을
// 미리 예약해 원본 다운로드 전후의 레이아웃 이동을 피한다.
const s3ArchiveImageSizes = [
  [3024, 4032], [4032, 3024], [3024, 4032], [3024, 4032], [3024, 4032],
  [4032, 3024], [3024, 4032], [3024, 4032], [4032, 3024], [3024, 4032],
  [4032, 3024], [4032, 3024], [3024, 4032], [4032, 3024], [4032, 3024],
  [3024, 4032], [4032, 3024], [3024, 4032], [4032, 3024], [4032, 3024],
  [4032, 3024], [4032, 3024], [3024, 4032], [4032, 3024], [3024, 4032],
  [4032, 3024], [4032, 3024], [3024, 4032], [4032, 3024], [1440, 1081],
  [1440, 1080], [1440, 1080], [1440, 1080], [1440, 1081], [1440, 1081],
  [1440, 1080], [1669, 1252], [1733, 1300], [1733, 1300], [1440, 1080],
] as const;

export const s3ArchiveImages = s3ArchiveImageSizes.map(([width, height], index) => ({
  id: `s3-archive-${index + 1}`,
  src: `${s3ArchiveBaseUrl}/${index + 1}.webp`,
  deliverySrc: archiveWebImages[index].src,
  width,
  height,
}));
