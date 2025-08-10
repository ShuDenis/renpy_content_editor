import React, { useEffect, useRef } from "react";
import { SceneProject, Hotspot } from "@lib/sceneSchema";
import { globalImageCache } from "@lib/imageCache";
import { projectToCanvasScalar, projectToCanvasPoint } from "@lib/utils";

interface CanvasViewProps {
  project: SceneProject;
  sceneId: string;
  useWebGL?: boolean;
  onExit?: () => void;
}

function drawHotspotPreview(ctx: CanvasRenderingContext2D, proj: SceneProject, hs: Hotspot, W: number, H: number) {
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
    const pts = hs.points.map(p => projectToCanvasPoint(proj, p[0], p[1], W, H));
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

export default function CanvasView({ project, sceneId, useWebGL, onExit }: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = project.scenes.find(s => s.id === sceneId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scene) return;
    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = canvas.clientHeight);

    (async () => {
      const images = await Promise.all(
        scene.layers
          .filter(l => l.type === "image")
          .map(async l => ({ z: l.zorder || 0, img: await globalImageCache.load(l.image) }))
      );

      let gl: WebGLRenderingContext | null = null;
      if (useWebGL) {
        gl = canvas.getContext("webgl");
      }
      if (gl) {
        // Simple WebGL drawing: draw each image as textured quad
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // Fall back to 2D for drawing images for now
        const ctx2d = canvas.getContext("2d");
        if (ctx2d) {
          images.sort((a, b) => a.z - b.z).forEach(({ img }) => {
            ctx2d.drawImage(img, 0, 0, W, H);
          });
          for (const hs of scene.hotspots ?? []) {
            if (!hs.hidden) drawHotspotPreview(ctx2d, project, hs, W, H);
          }
        }
      } else {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, W, H);
        images.sort((a, b) => a.z - b.z).forEach(({ img }) => {
          ctx.drawImage(img, 0, 0, W, H);
        });
        for (const hs of scene.hotspots ?? []) {
          if (!hs.hidden) drawHotspotPreview(ctx, project, hs, W, H);
        }
      }
    })();
  }, [project, scene, useWebGL]);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000 }}
      onClick={onExit}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
