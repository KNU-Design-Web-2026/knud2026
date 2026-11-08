import assert from "node:assert/strict";
import test from "node:test";
import { createSprayDirtyTiles } from "./spray-dirty-tiles";

test("dirty tiles use device pixels and clip the overlap at the canvas edge", () => {
  const tiles = createSprayDirtyTiles(300, 270, 1.5);
  tiles.mark({ left: 250, top: 200, right: 300, bottom: 270 });

  assert.equal(tiles.size, 1);
  assert.equal(tiles.countClearedPixels(), (450 - 256) * (405 - 256));
  assert.deepEqual(tiles.getClipBounds(), [{
    left: 254 / 1.5,
    top: 254 / 1.5,
    right: 300,
    bottom: 270,
  }]);
});

test("replay includes the seam overlap without marking its neighbor dirty", () => {
  const tiles = createSprayDirtyTiles(600, 300, 1);
  tiles.mark({ left: 1, top: 1, right: 256, bottom: 10 });
  tiles.mark({ left: 1, top: 1, right: 256, bottom: 10 });

  assert.equal(tiles.size, 1);
  assert.equal(tiles.touches({ left: 257, top: 4, right: 260, bottom: 5 }), true);
  assert.equal(tiles.touches({ left: 258, top: 4, right: 260, bottom: 5 }), false);
});

test("paint outside the tile grid does not add any dirty tiles", () => {
  const tiles = createSprayDirtyTiles(300, 270, 2);
  tiles.mark({ left: -20, top: -20, right: -10, bottom: -10 });
  tiles.mark({ left: 400, top: 400, right: 420, bottom: 420 });

  assert.equal(tiles.size, 0);
  assert.equal(tiles.countClearedPixels(), 0);
  assert.deepEqual(tiles.getClipBounds(), []);
});
