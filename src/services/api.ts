import type { SceneProject } from "@core/sceneSchema";
import { parseSceneProject } from "@core/scenePersistence";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function fetchScenes(): Promise<SceneProject> {
  const res = await fetch(`${API_BASE}/scenes`);
  if (!res.ok) {
    throw new Error(`Failed to fetch scenes: ${res.status}`);
  }
  const data = await res.json();
  return parseSceneProject(data);
}

export async function saveScene(proj: SceneProject): Promise<void> {
  const res = await fetch(`${API_BASE}/scenes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proj),
  });
  if (!res.ok) {
    throw new Error(`Failed to save scene: ${res.status}`);
  }
}
