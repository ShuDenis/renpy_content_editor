import { describe, it, expect } from 'vitest';
import {
  projectToCanvasScalar,
  canvasToProjectScalar,
  projectToCanvasPoint,
  canvasToProjectPoint,
  round3,
  convertProjectCoordsMode,
} from './geometry';
import type { SceneProject } from './sceneSchema';

describe('coordinate helpers', () => {
  const proj: SceneProject = {
    version: '1.0',
    project: {
      reference_resolution: { width: 100, height: 100 },
      coords_mode: 'relative',
    },
    scenes: [],
  };

  it('converts scalars between project and canvas', () => {
    expect(projectToCanvasScalar(proj, 0.5, 200, 100)).toBe(100);
    expect(canvasToProjectScalar(proj, 100, 200, 100)).toBeCloseTo(0.5);

    const abs: SceneProject = {
      ...proj,
      project: { ...proj.project, coords_mode: 'absolute' },
    };
    expect(projectToCanvasScalar(abs, 50, 200, 100)).toBe(100);
    expect(canvasToProjectScalar(abs, 100, 200, 100)).toBe(50);
  });

  it('converts points between project and canvas', () => {
    const pt = projectToCanvasPoint(proj, 0.5, 0.25, 200, 200);
    expect(pt).toEqual({ x: 100, y: 50 });
    const back = canvasToProjectPoint(proj, 100, 50, 200, 200);
    expect(back.x).toBeCloseTo(0.5);
    expect(back.y).toBeCloseTo(0.25);
  });

  it('rounds numbers to 3 decimals', () => {
    expect(round3(0.123456)).toBe(0.123);
    expect(round3(0.1235)).toBe(0.124);
  });

  it('converts project coordinate modes', () => {
    const src: SceneProject = {
      version: '1.0',
      project: {
        reference_resolution: { width: 100, height: 100 },
        coords_mode: 'relative',
      },
      scenes: [
        {
          id: 's',
          layers: [],
          hotspots: [
            {
              id: 'h',
              hidden: false,
              shape: 'rect',
              rect: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 },
            },
          ],
        },
      ],
    };
    const abs = convertProjectCoordsMode(src, 'absolute');
    expect(abs.project.coords_mode).toBe('absolute');
    expect(abs.scenes[0].hotspots[0].rect!.w).toBe(30);
    const back = convertProjectCoordsMode(abs, 'relative');
    expect(back.project.coords_mode).toBe('relative');
    expect(back.scenes[0].hotspots[0].rect!.w).toBeCloseTo(0.3);
  });
});
