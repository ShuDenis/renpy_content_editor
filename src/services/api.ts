import {
  SceneProject,
  emptyProject,
  validateSceneProject,
} from "@core/sceneSchema";

export type Scene = SceneProject["scenes"][number];

export async function fetchScenes(): Promise<SceneProject> {
  const res = await fetch("/scenes");
  if (!res.ok) {
    throw new Error("Failed to fetch scenes");
  }
  const data = await res.json();
  const base = emptyProject();
  const project: SceneProject = { ...base, scenes: data.scenes || [] };
  return validateSceneProject(project);
}

export async function saveScene(scene: Scene): Promise<void> {
  const res = await fetch("/scenes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scene),
  });
  if (!res.ok) {
    throw new Error("Failed to save scene");
  }
}
