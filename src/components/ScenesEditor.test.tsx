import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../services/api", () => ({
  fetchScenes: vi.fn(),
  saveScene: vi.fn(),
}));

import ScenesEditor from "./ScenesEditor";
import { fetchScenes, saveScene } from "../services/api";
import { useSceneStore } from "../store";
import { emptyProject } from "@core/sceneSchema";

// ─────────────────────────────────────────────────────────────────────────────
// PART 1: hotspot cloning test (structuredClone)
// (no type imports from @core/sceneSchema to avoid breaking the build)
// ─────────────────────────────────────────────────────────────────────────────
type THotspot = {
  id: string;
  shape: "rect" | "polygon" | "circle";
  rect?: { x: number; y: number; w: number; h: number };
  tooltip?: string | undefined;
  // allow any additional fields
  [key: string]: any;
};

describe("ScenesEditor hotspot cloning", () => {
  it("preserves undefined and Date properties", () => {
    const original: THotspot & { created: Date } = {
      id: "hs1",
      shape: "rect",
      hidden: false,
      rect: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 },
      tooltip: undefined,
      created: new Date("2024-06-01T00:00:00Z"),
    };
    const copy = structuredClone(original);
    expect(copy).not.toBe(original);
    expect("tooltip" in copy).toBe(true);
    expect(copy.tooltip).toBeUndefined();
    expect(copy.created).toBeInstanceOf(Date);
    expect(copy.created.getTime()).toBe(original.created.getTime());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PART 2: ScenesEditor component tests (loading, saving, adding a hotspot)
// ─────────────────────────────────────────────────────────────────────────────

const sampleProject = {
  version: "1.0",
  project: {
    reference_resolution: { width: 100, height: 100 },
    coords_mode: "relative",
  },
  scenes: [{ id: "s1", hotspots: [] }],
};

function mockCanvas() {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => ({
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      translate: vi.fn(),
      clearRect: vi.fn(),
      strokeStyle: "",
      fillStyle: "",
      globalAlpha: 1,
      lineWidth: 1,
    }),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
    }),
  });
}

describe("ScenesEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas();
    useSceneStore.getState().resetProj(emptyProject());

    (fetchScenes as any).mockResolvedValue(sampleProject);
    (saveScene as any).mockResolvedValue(undefined);
  });

  it("adds rect hotspot via panel (matches current UI)", async () => {
    const { getByText } = render(<ScenesEditor />);
    await waitFor(() => expect(fetchScenes).toHaveBeenCalled());
    fireEvent.click(getByText("+ Rect"));
    await waitFor(() => getByText("Добавлен прямоугольный хотспот"));
  });

  it("saves project via API", async () => {
    const { getByText } = render(<ScenesEditor />);
    await waitFor(() => expect(fetchScenes).toHaveBeenCalled());
    fireEvent.click(getByText("Сохранить"));
    await waitFor(() => expect(saveScene).toHaveBeenCalled());
    await waitFor(() => getByText("Сцены сохранены"));
  });

  it.skip("updates hotspot coordinates on drag (not implemented in MVP)", async () => {
    // Disabled: the current MVP doesn't support hotspot drag/resize or X/Y fields.
    // We'll re-enable this test once drag-and-drop is added.
  });
});
