import type { PaintStamp } from "./spray-paint";

export type StampGroup = { id: number; stamps: PaintStamp[]; cacheable: boolean };
const GROUP_SIZE = 32;

export function createStampGroups() {
  let ids = new WeakMap<PaintStamp, number>();
  let nextId = 0;
  return {
    select(stamps: readonly PaintStamp[], isStatic: (stamp: PaintStamp) => boolean): StampGroup[] {
      const groups: StampGroup[] = [];
      for (const stamp of stamps) {
        let sequence = ids.get(stamp);
        if (sequence === undefined) { sequence = nextId++; ids.set(stamp, sequence); }
        const id = Math.floor(sequence / GROUP_SIZE);
        let group = groups.at(-1);
        if (!group || group.id !== id) {
          group = { id, stamps: [], cacheable: true };
          groups.push(group);
        }
        group.stamps.push(stamp);
        group.cacheable &&= isStatic(stamp);
      }
      for (const group of groups) group.cacheable &&= group.stamps.length === GROUP_SIZE;
      return groups;
    },
    clear() { ids = new WeakMap(); nextId = 0; },
  };
}
