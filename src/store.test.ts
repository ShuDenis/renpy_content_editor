import { describe, expect, it } from "vitest";
import { createUndoStore } from "./store";

describe("createUndoStore", () => {
  it("limits history stacks", () => {
    const maxHistory = 3;
    const store = createUndoStore<number>(0, (v) => v, maxHistory);
    const { setProj, undo } = store.getState();

    for (let i = 1; i <= maxHistory + 2; i++) {
      setProj(i);
    }
    expect(store.getState().undoStack).toHaveLength(maxHistory);

    for (let i = 0; i < maxHistory + 2; i++) {
      undo();
    }
    expect(store.getState().redoStack).toHaveLength(maxHistory);
  });
});
