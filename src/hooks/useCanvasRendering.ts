import { useEffect, RefObject } from 'react';
import type { SceneProject, Hotspot, Layer } from '@core/sceneSchema';
import { globalImageCache } from '@core/imageCache';
import { projectToCanvasScalar, projectToCanvasPoint } from '@core/geometry';

interface UseCanvasRenderingOptions {
  project?: SceneProject;
  layers: Layer[];
  hotspots: Hotspot[];
  width?: number;
  height?: number;
  useWebGL?: boolean;
}

export default function useCanvasRendering(
  canvasRef: RefObject<HTMLCanvasElement>,
  {
    project,
    layers,
    hotspots,
    width,
    height,
    useWebGL,
  }: UseCanvasRenderingOptions,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W =
      typeof width === 'number'
        ? (canvas.width = width)
        : (canvas.width = canvas.clientWidth);
    const H =
      typeof height === 'number'
        ? (canvas.height = height)
        : (canvas.height = canvas.clientHeight);

    (async () => {
      const imageLayers = layers.filter((l) => l.type === 'image');
      type Loaded = { key: string; alpha: number; img: HTMLImageElement };
      const loaded: Loaded[] = await Promise.all(
        imageLayers.map(async (l): Promise<Loaded> => ({
          key: l.image,
          alpha: l.alpha ?? 1,
          img: await globalImageCache.load(l.image),
        })),
      );
      const imageMap = new Map(loaded.map((e) => [e.key, e]));

      let gl: WebGLRenderingContext | null = null;
      if (useWebGL) {
        gl = canvas.getContext('webgl');
      }

      if (gl) {
        // For now we clear the background with WebGL and draw the rest in 2D (could switch to textured quads later)
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) return;
        ctx2d.clearRect(0, 0, W, H);

        // Unified sorting of all layers by z-order
        const sorted = [...layers].sort(
          (a, b) => (a.zorder ?? 0) - (b.zorder ?? 0),
        );
        for (const layer of sorted) {
          if (layer.type === 'color') {
            ctx2d.globalAlpha = layer.alpha ?? 1;
            ctx2d.fillStyle = layer.color;
            ctx2d.fillRect(0, 0, W, H);
          } else if (layer.type === 'image') {
            const rec = imageMap.get(layer.image);
            if (rec?.img) {
              const img = rec.img;
              const scale = Math.min(
                W / img.naturalWidth,
                H / img.naturalHeight,
              );
              const w = img.naturalWidth * scale;
              const h = img.naturalHeight * scale;
              const x = (W - w) / 2;
              const y = (H - h) / 2;
              ctx2d.globalAlpha = rec.alpha;
              ctx2d.drawImage(img, x, y, w, h);
            }
          }
        }
        ctx2d.globalAlpha = 1;

        // Hotspots
        if (project) {
          for (const hs of hotspots) {
            if (!hs.hidden) drawHotspotPreview(ctx2d, project, hs, W, H);
          }
        }
      } else {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, W, H);

        // Unified sorting of all layers by z-order
        const sorted = [...layers].sort(
          (a, b) => (a.zorder ?? 0) - (b.zorder ?? 0),
        );
        for (const layer of sorted) {
          if (layer.type === 'color') {
            ctx.globalAlpha = layer.alpha ?? 1;
            ctx.fillStyle = layer.color;
            ctx.fillRect(0, 0, W, H);
          } else if (layer.type === 'image') {
            const rec = imageMap.get(layer.image);
            if (rec?.img) {
              const img = rec.img;
              const scale = Math.min(
                W / img.naturalWidth,
                H / img.naturalHeight,
              );
              const w = img.naturalWidth * scale;
              const h = img.naturalHeight * scale;
              const x = (W - w) / 2;
              const y = (H - h) / 2;
              ctx.globalAlpha = rec.alpha;
              ctx.drawImage(img, x, y, w, h);
            }
          }
        }

        ctx.globalAlpha = 1;

        // Hotspots
        if (project) {
          for (const hs of hotspots) {
            if (!hs.hidden) drawHotspotPreview(ctx, project, hs, W, H);
          }
        }
      }
    })();
  }, [canvasRef, project, layers, hotspots, width, height, useWebGL]);
}

function drawHotspotPreview(
  ctx: CanvasRenderingContext2D,
  proj: SceneProject,
  hs: Hotspot,
  W: number,
  H: number,
) {
  ctx.save();
  ctx.translate(0.5, 0.5);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ff0';
  ctx.fillStyle = 'rgba(255,255,0,0.15)';

  if (hs.shape === 'rect' && hs.rect) {
    const refW = proj.project.reference_resolution.width;
    const refH = proj.project.reference_resolution.height;
    const x = projectToCanvasScalar(proj, hs.rect.x, W, refW);
    const y = projectToCanvasScalar(proj, hs.rect.y, H, refH);
    const w = projectToCanvasScalar(proj, hs.rect.w, W, refW);
    const h = projectToCanvasScalar(proj, hs.rect.h, H, refH);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  } else if (hs.shape === 'polygon' && hs.points) {
    const pts = hs.points.map((p) =>
      projectToCanvasPoint(proj, p[0], p[1], W, H),
    );
    if (pts.length) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (hs.shape === 'circle' && hs.circle) {
    const refW = proj.project.reference_resolution.width;
    const refH = proj.project.reference_resolution.height;
    const cx = projectToCanvasScalar(proj, hs.circle.cx, W, refW);
    const cy = projectToCanvasScalar(proj, hs.circle.cy, H, refH);
    const r = projectToCanvasScalar(proj, hs.circle.r, W, refW);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
