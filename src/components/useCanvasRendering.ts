import { useEffect } from 'react';
import type { SceneProject, Hotspot, Layer } from '@core/sceneSchema';
import { globalImageCache } from '@core/imageCache';
import { drawHotspotPreview } from './drawHotspotPreview';

interface UseCanvasRenderingOptions {
  project?: SceneProject;
  layers: Layer[];
  hotspots: Hotspot[];
  width?: number;
  height?: number;
  useWebGL?: boolean;
}

export function useCanvasRendering(
  canvasRef: React.RefObject<HTMLCanvasElement>,
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
      const loaded = await Promise.all(
        imageLayers.map(async (l) => ({
          key: l.image,
          z: l.zorder ?? 0,
          alpha: (l as any).alpha ?? 1,
          img: await globalImageCache.load(l.image),
        })),
      );
      const imageMap = new Map(loaded.map((e) => [e.key, e]));

      let gl: WebGLRenderingContext | null = null;
      if (useWebGL) {
        gl = canvas.getContext('webgl');
      }

      if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) return;
        ctx2d.clearRect(0, 0, W, H);

        const sorted = [...layers].sort(
          (a, b) => (a.zorder ?? 0) - (b.zorder ?? 0),
        );
        for (const layer of sorted) {
          if (layer.type === 'color') {
            ctx2d.globalAlpha = (layer as any).alpha ?? 1;
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

        if (project) {
          for (const hs of hotspots) {
            if (!hs.hidden) drawHotspotPreview(ctx2d, project, hs, W, H);
          }
        }
      } else {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, W, H);

        const sorted = [...layers].sort(
          (a, b) => (a.zorder ?? 0) - (b.zorder ?? 0),
        );
        for (const layer of sorted) {
          if (layer.type === 'color') {
            ctx.globalAlpha = (layer as any).alpha ?? 1;
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

        if (project) {
          for (const hs of hotspots) {
            if (!hs.hidden) drawHotspotPreview(ctx, project, hs, W, H);
          }
        }
      }
    })();
  }, [canvasRef, project, layers, hotspots, width, height, useWebGL]);
}
