import React, { useRef } from 'react';
import type { SceneProject, Hotspot, Layer } from '@core/sceneSchema';
import useCanvasRendering from '../hooks/useCanvasRendering';
import FullscreenCanvasOverlay from './FullscreenCanvasOverlay';

type CanvasViewProps =
  | {
      // Advanced mode: draw the project scene with hotspots
      project: SceneProject;
      sceneId: string;
      useWebGL?: boolean;
      onExit?: () => void;
      width?: number;
      height?: number;
      layers?: never;
      onDropImage?: (src: string) => void;
    }
  | {
      // Simple mode: draw the list of layers as-is (no hotspots)
      layers: Layer[];
      width: number;
      height: number;
      project?: never;
      sceneId?: never;
      useWebGL?: boolean;
      onExit?: () => void;
      onDropImage?: (src: string) => void;
    };

export default function CanvasView(props: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine layer/hotspot source based on mode
  const project = 'project' in props ? props.project : undefined;
  const sceneId = 'sceneId' in props ? props.sceneId : undefined;
  const useWebGL = props.useWebGL;
  const onExit = props.onExit;
  const onDropImage = props.onDropImage;

  const scene = project ? project.scenes.find((s) => s.id === sceneId) : undefined;
  const layersToDraw: Layer[] = scene
    ? scene.layers
    : ('layers' in props && props.layers) || [];
  const hotspots: Hotspot[] = scene?.hotspots ?? [];

  useCanvasRendering(canvasRef, {
    project,
    layers: layersToDraw,
    hotspots,
    width: 'width' in props ? props.width : undefined,
    height: 'height' in props ? props.height : undefined,
    useWebGL,
  });

  const canvasElement = (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!onDropImage) return;
        const files = e.dataTransfer.files;
        for (const file of Array.from(files)) {
          if (['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            const url = URL.createObjectURL(file);
            onDropImage(url);
          }
        }
        const uri =
          e.dataTransfer.getData('text/uri-list') ||
          e.dataTransfer.getData('text/plain');
        if (uri && uri.match(/\.(png|jpe?g|webp)$/i)) onDropImage(uri.trim());
      }}
    />
  );

  if (onExit) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 1000,
        }}
        onClick={onExit}
      >
        {canvasElement}
      </div>
      <FullscreenCanvasOverlay onExit={onExit}>
        {canvasElement}
      </FullscreenCanvasOverlay>
    );
  }

  return canvasElement;
}
