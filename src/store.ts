import { create } from "zustand";
import {
  SceneProject,
  emptyProject,
  validateSceneProject,
} from "@core/sceneSchema";
import {
  DialogProject,
  emptyDialogProject,
  validateDialogProject,
} from "@core/dialogSchema";

interface UndoState<T> {
  proj: T;
  undoStack: T[];
  redoStack: T[];
  setProj: (value: T | ((prev: T) => T)) => void;
  resetProj: (value: T) => void;
  undo: () => void;
  redo: () => void;
}

function createUndoStore<T>(initial: T, validate: (v: T) => T) {
  return create<UndoState<T>>((set, get) => ({
    proj: validate(initial),
    undoStack: [],
    redoStack: [],
    setProj: (value) =>
      set((state) => {
        const prev = state.proj;
        const next =
          typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        return {
          proj: validate(next),
          undoStack: [...state.undoStack, prev],
          redoStack: [],
        };
      }),
    resetProj: (value) =>
      set({ proj: validate(value), undoStack: [], redoStack: [] }),
    undo: () =>
      set((state) => {
        const prev = state.undoStack[state.undoStack.length - 1];
        if (prev === undefined) return state;
        const undoStack = state.undoStack.slice(0, -1);
        const redoStack = [...state.redoStack, state.proj];
        return { proj: prev, undoStack, redoStack };
      }),
    redo: () =>
      set((state) => {
        const next = state.redoStack[state.redoStack.length - 1];
        if (next === undefined) return state;
        const redoStack = state.redoStack.slice(0, -1);
        const undoStack = [...state.undoStack, state.proj];
        return { proj: next, undoStack, redoStack };
      }),
  }));
}

export const useSceneStore = createUndoStore<SceneProject>(
  emptyProject(),
  validateSceneProject,
);
export const useDialogStore = createUndoStore<DialogProject>(
  emptyDialogProject(),
  validateDialogProject,
);
