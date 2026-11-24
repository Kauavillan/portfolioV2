import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { createRng } from "../../util/rng";
import { disposeObject } from "../../util/dispose";
import { approach } from "../../util/ease";
import { createHitProxy, type Artifact, type ArtifactDef, type ArtifactOptions } from "./types";

const COLS = 5;
const ROWS = 6;
const TILE = 1.7;
const GAP = 0.3;
const THICKNESS = 0.5;
/** Each tile carries a 3 × 5 "pixel letter". */
const GLYPH_COLS = 3;
const GLYPH_ROWS = 5;
const PIXELS = GLYPH_COLS * GLYPH_ROWS;
const PIXEL_PITCH_X = 0.3;
const PIXEL_PITCH_Y = 0.26;
const FLIP_SECONDS = 0.8;
const COLUMN_DELAY = 0.1;

type TileState = "absent" | "present" | "correct";

interface Tile {
  x: number;
  y: number;
  state: TileState;
  /** Bit i = pixel i is lit. */
  glyph: number;
  /** Seconds since the flip began; < 0 = waiting for its delay; `null` = idle. */
  flip: number | null;
  next: { state: TileState; glyph: number } | null;
}

/**
 * Entropyle: a word-game board whose tiles flip row by row, re-rolling their
 * colour and their pixel letter. Two instanced draw calls (tiles + pixels);
 * matrices are only rewritten for the tiles that are mid-flip.
 */
function create({ colors, reduced, seed }: ArtifactOptions): Artifact {
  const rng = createRng(seed + 7);
  const group = new Group();
  const board = new Group();
  group.add(board);

  const stateColor: Record<TileState, Color> = {
    absent: new Color("#2a3150"),
    present: colors.a.clone(),
    correct: colors.b.clone(),
  };
  const randomState = (): TileState => {
    const r = rng();
    return r < 0.34 ? "absent" : r < 0.68 ? "present" : "correct";
  };
  const randomGlyph = () => {
    // 15 random bits, but never an empty letter.
    const bits = Math.floor(rng() * (1 << PIXELS));
    return bits === 0 ? 0b010101010101010 : bits;
  };

  const tiles: Tile[] = [];
  const stepX = TILE + GAP;
  const stepY = TILE + GAP;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      tiles.push({
        x: (col - (COLS - 1) / 2) * stepX,
        y: ((ROWS - 1) / 2 - row) * stepY,
        state: randomState(),
        glyph: randomGlyph(),
        flip: null,
        next: null,
      });
    }
  }

  const tileMesh = new InstancedMesh(
    new BoxGeometry(TILE, TILE, THICKNESS),
    new MeshStandardMaterial({ color: new Color("#ffffff"), metalness: 0.2, roughness: 0.42 }),
    tiles.length,
  );
  const pixelMesh = new InstancedMesh(
    new BoxGeometry(0.22, 0.2, 0.2),
    new MeshBasicMaterial({ color: new Color("#f4f6ff") }),
    tiles.length * PIXELS,
  );
  board.add(tileMesh, pixelMesh);

  // Matrix scratch (allocated once).
  const tileMatrix = new Matrix4();
  const localMatrix = new Matrix4();
  const instanceMatrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const unit = new Vector3(1, 1, 1);
  const hidden = new Vector3(0.0001, 0.0001, 0.0001);
  const axisX = new Vector3(1, 0, 0);

  const writeTile = (index: number, angle: number) => {
    const tile = tiles[index];
    position.set(tile.x, tile.y, 0);
    rotation.setFromAxisAngle(axisX, angle);
    tileMatrix.compose(position, rotation, unit);
    tileMesh.setMatrixAt(index, tileMatrix);
    tileMesh.setColorAt(index, stateColor[tile.state]);

    for (let p = 0; p < PIXELS; p++) {
      const gx = p % GLYPH_COLS;
      const gy = Math.floor(p / GLYPH_COLS);
      position.set(
        (gx - (GLYPH_COLS - 1) / 2) * PIXEL_PITCH_X,
        ((GLYPH_ROWS - 1) / 2 - gy) * PIXEL_PITCH_Y,
        THICKNESS / 2 + 0.08,
      );
      rotation.identity();
      localMatrix.compose(position, rotation, (tile.glyph >> p) & 1 ? unit : hidden);
      instanceMatrix.multiplyMatrices(tileMatrix, localMatrix);
      pixelMesh.setMatrixAt(index * PIXELS + p, instanceMatrix);
    }
  };
  const flush = () => {
    tileMesh.instanceMatrix.needsUpdate = true;
    pixelMesh.instanceMatrix.needsUpdate = true;
    if (tileMesh.instanceColor) tileMesh.instanceColor.needsUpdate = true;
  };
  tiles.forEach((_, i) => writeTile(i, 0));
  flush();

  group.add(
    createHitProxy([COLS * (TILE + GAP) - GAP + 0.6, ROWS * (TILE + GAP) - GAP + 0.6, 3]),
  );

  let energy = 0;
  let nextRow = 0;
  let sinceRow = 0;

  const startRow = () => {
    for (let col = 0; col < COLS; col++) {
      const tile = tiles[nextRow * COLS + col];
      tile.flip = -col * COLUMN_DELAY;
      tile.next = { state: randomState(), glyph: randomGlyph() };
    }
    nextRow = (nextRow + 1) % ROWS;
  };

  const stepFlips = (dt: number) => {
    let touched = false;
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      if (tile.flip === null) continue;
      const previous = tile.flip;
      tile.flip += dt;
      if (tile.flip < 0) continue;
      const progress = Math.min(1, tile.flip / FLIP_SECONDS);
      if (previous / FLIP_SECONDS < 0.5 && progress >= 0.5 && tile.next) {
        tile.state = tile.next.state;
        tile.glyph = tile.next.glyph;
      }
      writeTile(i, progress * Math.PI * 2);
      touched = true;
      if (progress >= 1) {
        tile.flip = null;
        tile.next = null;
      }
    }
    if (touched) flush();
  };

  const pose = (t: number) => {
    board.rotation.y = 0.16 + Math.sin(t * 0.3) * 0.32 * (0.5 + 0.5 * energy);
    board.rotation.x = -0.1 + Math.sin(t * 0.22 + 1) * 0.07;
  };
  pose(0);

  return {
    group,

    update(t, active, dt) {
      energy = approach(energy, active ? 1 : 0, 2, dt, reduced);
      pose(t);
      if (reduced) return;
      sinceRow += dt;
      if (sinceRow > (active ? 1.9 : 4.2)) {
        sinceRow = 0;
        startRow();
      }
      stepFlips(dt);
    },

    dispose() {
      disposeObject(group);
      group.clear();
    },
  };
}

export const tileGrid: ArtifactDef = { create };
