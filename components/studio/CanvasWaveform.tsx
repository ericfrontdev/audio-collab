'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface CanvasWaveformProps {
  peaks: number[];
  trackColor: string;
  height?: number;
  duration: number;
}

export interface CanvasWaveformRef {
  getDuration: () => number;
}

export const CanvasWaveform = forwardRef<CanvasWaveformRef, CanvasWaveformProps>(
  function CanvasWaveform({ peaks, trackColor, height = 80, duration }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose methods via ref (minimal interface for compatibility)
    useImperativeHandle(ref, () => ({
      getDuration: () => duration,
    }));

    // Draw waveform whenever peaks or color changes
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !peaks || peaks.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match container
      const updateSize = () => {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${height}px`;

        ctx.scale(dpr, dpr);

        drawWaveform();
      };

      const drawWaveform = () => {
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const dpr = window.devicePixelRatio || 1;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw center line (adjust for device pixel ratio to get 1px line)
        ctx.strokeStyle = trackColor;
        ctx.lineWidth = 1 / dpr;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Calculate bar width
        const barWidth = width / peaks.length;
        const barGap = Math.max(1, barWidth * 0.2); // 20% gap between bars

        // Draw each peak as a bar
        peaks.forEach((peak, i) => {
          const x = i * barWidth;
          const barHeight = Math.max(1, peak * height * 0.9); // 90% of height for padding
          const y = (height - barHeight) / 2;

          ctx.fillStyle = trackColor;
          ctx.fillRect(
            x,
            y,
            Math.max(1, barWidth - barGap),
            barHeight
          );
        });
      };

      // Initial draw
      updateSize();

      // Redraw on resize
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }, [peaks, trackColor, height, duration]);

    return (
      <div ref={containerRef} className="w-full" style={{ height: `${height}px` }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }
);
