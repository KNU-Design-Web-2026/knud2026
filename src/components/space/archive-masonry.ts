type MasonryImage = {
  width: number;
  height: number;
};

type MasonryOptions = {
  columnCount: number;
  containerWidth: number;
  gap: number;
};

export type MasonryPosition = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export type MasonryLayout = {
  height: number;
  items: MasonryPosition[];
};

export function calculateMasonryLayout(
  images: MasonryImage[],
  { columnCount, containerWidth, gap }: MasonryOptions,
): MasonryLayout {
  if (images.length === 0 || columnCount <= 0 || containerWidth <= 0) {
    return { height: 0, items: [] };
  }

  const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  const items = images.map(image => {
    const shortestHeight = Math.min(...columnHeights);
    const column = columnHeights.indexOf(shortestHeight);
    const height = columnWidth * image.height / image.width;
    const position = {
      width: columnWidth,
      height,
      left: column * (columnWidth + gap),
      top: shortestHeight,
    };

    columnHeights[column] = shortestHeight + height + gap;
    return position;
  });

  return {
    items,
    height: Math.max(...columnHeights) - gap,
  };
}
