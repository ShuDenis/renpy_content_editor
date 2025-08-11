import type { SceneProject, Hotspot } from '@core/sceneSchema';
import { projectToCanvasScalar, projectToCanvasPoint } from '@core/geometry';

export function drawHotspotPreview(
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
