import { WORK_ITEMS } from "@/data/work-items";

// Temporary assignment approved by the user. Replace once booth allocation arrives.
// There are 21 map positions and 19 works; the last two repeat the first two.
export function getSpaceWork(position: number) {
  return WORK_ITEMS[position % WORK_ITEMS.length];
}

// Equivalent positions are enumerated differently in the three Figma frames.
export const tabletWorkPositions = [15, 0, 6, 8, 9, 1, 2, 3, 4, 5, 17, 10, 7, 12, 20, 11, 16, 14, 13, 18, 19];
export const mobileWorkPositions = [7, 5, 4, 3, 2, 1, 0, 6, 8, 9, 15, 14, 13, 18, 19, 11, 20, 12, 17, 16, 10];
