import React, { useEffect, useRef } from "react";
import type { SceneProject, Hotspot, Layer } from "@lib/sceneSchema";
import { globalImageCache } from "@lib/imageCache";
import { projectToCanvasScalar, projectToCanvasPoint } from "@lib/utils";

type CanvasViewProps =
  | {
      // Расширенный режим: рисуем сцену проекта + хотспоты
      project: SceneProject;
      sceneId: string;
      useWebGL?: boolean;
      onExit?: () => void;
      width?: number;
      height?: number;
      layers?: never;
    }
  | {
      // Простой режим: рисуем список слоёв как есть (без хотспотов)
      layers: Layer[];
      width: number;
      height: number;
      project?: never;
      sceneId?: never;
      useWebGL?: boolean;
      onExit?: () => void;
    };

function drawHotspotPreview(
  ctx: CanvasRenderingContext2D,
  proj: SceneProject,
  hs: Hotspot,
  W: number,
  H: number
) {
  ctx.save();
  ctx.translate(0.5, 0.5);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ff0";
  ctx.fillStyle = "rgba(255,255,0,0.15)";

  if (hs.shape === "rect" && hs.rect) {
    const refW = proj.project.reference_resolution.width;
    const refH = proj.project.reference_resolution.height;
    const x = projectToCanvasScalar(proj, hs.rect.x, W, refW);
    const y = projectToCanvasScalar(proj, hs.rect.y, H, refH);
    const w = projectToCanvasScalar(proj, hs.rect.w, W, refW);
    const h = projectToCanvasScalar(proj, hs.rect.h, H, refH);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  } else if (hs.shape === "polygon" && hs.points) {
    const pts = hs.points.map((p) => projectToCanvasPoint(proj, p[0], p[1], W, H));
    if (pts.length) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (hs.shape === "circle" && hs.circle) {
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

export default function CanvasView(props: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Вычисляем источник слоёв/хотспотов в зависимости от режима
  const project = "project" in props ? props.project : undefined;
  const sceneId = "sceneId" in props ? props.sceneId : undefined;
  const useWebGL = props.useWebGL;
  const onExit = props.onExit;

  const scene = project ? project.scenes.find((s) => s.id === sceneId) : undefined;
  const layersToDraw: Layer[] = scene ? scene.layers : (("layers" in props && props.layers) || []);
  const hotspots: Hotspot[] = scene?.hotspots ?? [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Размеры канваса: если передали width/height — используем их, иначе растягиваем по контейнеру
    const W =
      "width" in props && typeof props.width === "number"
        ? (canvas.width = props.width)
        : (canvas.width = canvas.clientWidth);
    const H =
      "height" in props && typeof props.height === "number"
        ? (canvas.height = props.height)
        : (canvas.height = canvas.clientHeight);

    (async () => {
      // Предзагрузка изображений через LRU-кеш
      const imageLayers = layersToDraw.filter((l) => l.type === "image");
      const loaded = await Promise.all(
        imageLayers.map(async (l) => ({
          key: l.image,
          z: l.zorder ?? 0,
          alpha: (l as any).alpha ?? 1,
          img: await globalImageCache.load(l.image),
        }))
      );
      const imageMap = new Map(loaded.map((e) => [e.key, e]));

      let gl: WebGLRenderingContext | null = null;
      if (useWebGL) {
        gl = canvas.getContext("webgl");
      }

      if (gl) {
        // Пока что чистим фон вебглом, остальное рисуем 2D (позже можно заменить на текстурные квадраты)
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const ctx2d = canvas.getContext("2d");
        if (!ctx2d) return;
        ctx2d.clearRect(0, 0, W, H);

        // Единая сортировка всех слоёв по zorder
        const sorted = [...layersToDraw].sort((a, b) => (a.zorder ?? 0) - (b.zorder ?? 0));
        for (const layer of sorted) {
          if (layer.type === "color") {
            ctx2d.globalAlpha = (layer as any).alpha ?? 1;
            ctx2d.fillStyle = layer.color;
            ctx2d.fillRect(0, 0, W, H);
          } else if (layer.type === "image") {
            const rec = imageMap.get(layer.image);
            if (rec?.img) {
              ctx2d.globalAlpha = rec.alpha;
              ctx2d.drawImage(rec.img, 0, 0, W, H);
            }
          }
        }
        ctx2d.globalAlpha = 1;

        // Хотспоты
        if (project && scene) {
          for (const hs of hotspots) {
            if (!hs.hidden) drawHotspotPreview(ctx2d, project, hs, W, H);
          }
        }
      } else {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, W, H);

        // Единая сортировка всех слоёв по zorder
        const sorted = [...layersToDraw].sort((a, b) => (a.zorder ?? 0) - (b.zorder ?? 0));
        for (const layer of sorted) {
          if (layer.type === "color") {
            ctx.globalAlpha = (layer as any).alpha ?? 1;
            ctx.fillStyle = layer.color;
            ctx.fillRect(0, 0, W, H);
          } else if (layer.type === "image") {
            const rec = imageMap.get(layer.image);
            if (rec?.img) {
              ctx.globalAlpha = rec.alpha;
              ctx.drawImage(rec.img, 0, 0, W, H);
            }
          }
        }

        ctx.globalAlpha = 1;

        // Хотспоты
        if (project && scene) {
          for (const hs of hotspots) {
            if (!hs.hidden) drawHotspotPreview(ctx, project, hs, W, H);
          }
        }
      }
    })();
  }, [project, sceneId, scene, layersToDraw, props.width, props.height, useWebGL]);

  // Режим полноэкранного превью (если передан onExit) — кликом закрываем
  if (onExit) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000 }} onClick={onExit}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

  // Иначе — «встраиваемый» канвас (как в простом варианте)
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
