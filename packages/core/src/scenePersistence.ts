import { SceneProject, validateSceneProject } from './sceneSchema';
import { loadFileAsText, saveTextFile } from './io';

export const SCHEMA_VERSION = 1;

export function parseSceneProject(data: any): SceneProject {
  const version = data?.schema_version ?? 0;
  const projectData = version === 1 ? data.project : data;
  const validated = validateSceneProject(projectData);
  return validated;
}

export async function importSceneProjectFromFile(): Promise<SceneProject | null> {
  const text = await loadFileAsText('.json');
  if (!text) return null;
  const raw = JSON.parse(text);
  return parseSceneProject(raw);
}

export function exportSceneProjectToFile(proj: SceneProject) {
  const out = JSON.stringify(
    { schema_version: SCHEMA_VERSION, project: proj },
    null,
    2,
  );
  saveTextFile(out, 'scenes.json');
}

export function saveProjectToStorage(proj: SceneProject) {
  const out = { schema_version: SCHEMA_VERSION, project: proj };
  localStorage.setItem('scenesProject', JSON.stringify(out));
}

export function loadProjectFromStorage(): SceneProject | null {
  const text = localStorage.getItem('scenesProject');
  if (!text) return null;
  try {
    const raw = JSON.parse(text);
    return parseSceneProject(raw);
  } catch {
    return null;
  }
}
