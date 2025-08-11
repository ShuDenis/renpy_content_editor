import React from 'react';

interface FullscreenCanvasOverlayProps {
  onExit: () => void;
  children: React.ReactNode;
}

export default function FullscreenCanvasOverlay({
  onExit,
  children,
}: FullscreenCanvasOverlayProps) {
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
      {children}
    </div>
  );
}
