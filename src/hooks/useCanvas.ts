import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyShapeShiftConstraint,
  extractNormalizedPoint,
} from '../engine/PointerHandler';
import { CanvasEngineRenderer } from '../engine/Renderer';
import { useDrawingStore } from '../store/useDrawingStore';
import { Stroke } from '../types/canvas';
import { doesPointCollideWithStroke } from '../utils/canvasRenderer';

export interface UseCanvasReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cursorRef: React.RefObject<HTMLDivElement>;
  dimensions: { width: number; height: number; dpr: number };
  handlePointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerCancel: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerLeave: () => void;
}

export function useCanvas(): UseCanvasReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasEngineRenderer | null>(null);

  // Mutable refs for high-frequency 60-240Hz pointer loop without React re-renders
  const activeStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const objectErasedIdsRef = useRef<Set<string>>(new Set());

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
    dpr: number;
  }>({
    width: 1200,
    height: 800,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  });

  // Subscribe to committed strokes changes from Zustand
  const strokes = useDrawingStore((state) => state.strokes);

  // Initialize Renderer & ResizeObserver with HiDPI handling
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new CanvasEngineRenderer(canvas);
    rendererRef.current = renderer;

    const syncSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const metrics = renderer.resize(rect.width, rect.height);
      setDimensions(metrics);

      const currentStrokes = useDrawingStore.getState().strokes;
      renderer.renderImmediate(
        currentStrokes,
        activeStrokeRef.current,
        objectErasedIdsRef.current
      );
    };

    syncSize();

    const resizeObserver = new ResizeObserver(() => {
      syncSize();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', syncSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncSize);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Re-render whenever committed strokes change (e.g., Undo, Redo, Clear, Stroke Commit)
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.scheduleRender(
      strokes,
      activeStrokeRef.current,
      objectErasedIdsRef.current
    );
  }, [strokes]);

  const updateCursorOverlay = useCallback((clientX: number, clientY: number, visible: boolean) => {
    const cursorEl = cursorRef.current;
    const containerEl = containerRef.current;
    if (!cursorEl || !containerEl) return;

    if (!visible) {
      cursorEl.style.opacity = '0';
      return;
    }

    const rect = containerEl.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { settings, activeTool } = useDrawingStore.getState();

    const isShape =
      activeTool === 'line' ||
      activeTool === 'rectangle' ||
      activeTool === 'circle';

    if (isShape) {
      cursorEl.style.opacity = '0';
      return;
    }

    const diameter = Math.max(4, settings.size);
    cursorEl.style.width = `${diameter}px`;
    cursorEl.style.height = `${diameter}px`;
    cursorEl.style.transform = `translate3d(${x - diameter / 2}px, ${
      y - diameter / 2
    }px, 0)`;
    cursorEl.style.opacity = '1';
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Only respond to primary button for mouse
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;

      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      activePointerIdRef.current = e.pointerId;
      isDrawingRef.current = true;

      const point = extractNormalizedPoint(e, canvas);
      const { activeTool, settings, strokes: currentStrokes } =
        useDrawingStore.getState();

      updateCursorOverlay(e.clientX, e.clientY, true);

      // Handle Object Collision Eraser mode
      if (activeTool === 'eraser' && settings.eraserMode === 'object') {
        objectErasedIdsRef.current = new Set();
        const radius = settings.size / 2;
        for (const s of currentStrokes) {
          if (doesPointCollideWithStroke(point, s, radius)) {
            objectErasedIdsRef.current.add(s.id);
          }
        }
        renderer.scheduleRender(
          currentStrokes,
          null,
          objectErasedIdsRef.current
        );
        return;
      }

      // Create new in-progress Stroke
      const newStroke: Stroke = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tool: activeTool,
        points: [point],
        color: settings.color,
        size: settings.size,
        opacity: settings.opacity,
        thinning: settings.thinning,
        smoothing: settings.smoothing,
        streamline: settings.streamline,
        simulatePressure: settings.simulatePressure,
        filled: settings.filledShape,
        timestamp: Date.now(),
      };

      activeStrokeRef.current = newStroke;
      renderer.scheduleRender(currentStrokes, newStroke);
    },
    [updateCursorOverlay]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      updateCursorOverlay(e.clientX, e.clientY, true);

      if (!isDrawingRef.current || activePointerIdRef.current !== e.pointerId) {
        return;
      }

      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;

      e.preventDefault();
      const { activeTool, settings, strokes: currentStrokes } =
        useDrawingStore.getState();

      // Object Collision Eraser mode
      if (activeTool === 'eraser' && settings.eraserMode === 'object') {
        const point = extractNormalizedPoint(e, canvas);
        const radius = settings.size / 2;
        let changed = false;
        for (const s of currentStrokes) {
          if (
            !objectErasedIdsRef.current.has(s.id) &&
            doesPointCollideWithStroke(point, s, radius)
          ) {
            objectErasedIdsRef.current.add(s.id);
            changed = true;
          }
        }
        if (changed) {
          renderer.scheduleRender(
            currentStrokes,
            null,
            objectErasedIdsRef.current
          );
        }
        return;
      }

      const activeStroke = activeStrokeRef.current;
      if (!activeStroke) return;

      // Support high-frequency stylus coalesced events when available
      const nativeEvent = e.nativeEvent;
      const coalesced =
        typeof nativeEvent.getCoalescedEvents === 'function'
          ? nativeEvent.getCoalescedEvents()
          : [nativeEvent];

      if (
        activeStroke.tool === 'brush' ||
        activeStroke.tool === 'eraser'
      ) {
        const eventsToProcess = coalesced.length > 0 ? coalesced : [nativeEvent];
        for (const ev of eventsToProcess) {
          const pt = extractNormalizedPoint(ev, canvas);
          const lastPt = activeStroke.points[activeStroke.points.length - 1];
          // Filter sub-pixel jitter while keeping smooth curves
          if (!lastPt || Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) >= 1.2) {
            activeStroke.points.push(pt);
          }
        }
      } else {
        // Geometric shape preview (Line, Rectangle, Circle): [startPoint, currentPoint]
        const rawPoint = extractNormalizedPoint(e, canvas);
        const startPoint = activeStroke.points[0];
        const constrainedPoint = applyShapeShiftConstraint(
          startPoint,
          rawPoint,
          activeStroke.tool,
          e.shiftKey
        );
        activeStroke.points = [startPoint, constrainedPoint];
      }

      renderer.scheduleRender(currentStrokes, activeStroke);
    },
    [updateCursorOverlay]
  );

  const finishStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || activePointerIdRef.current !== e.pointerId) {
        return;
      }

      const canvas = canvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }

      isDrawingRef.current = false;
      activePointerIdRef.current = null;

      const state = useDrawingStore.getState();

      // Commit Object Eraser removals if any strokes were hit
      if (state.activeTool === 'eraser' && state.settings.eraserMode === 'object') {
        const idsToRemove = Array.from(objectErasedIdsRef.current);
        objectErasedIdsRef.current = new Set();
        if (idsToRemove.length > 0) {
          state.removeStrokesByIds(idsToRemove, true);
        } else if (rendererRef.current) {
          rendererRef.current.scheduleRender(state.strokes, null);
        }
        return;
      }

      const completedStroke = activeStrokeRef.current;
      activeStrokeRef.current = null;

      if (!completedStroke || completedStroke.points.length === 0) return;

      // Ignore zero-size shapes if user just clicked without dragging
      const isShape =
        completedStroke.tool === 'line' ||
        completedStroke.tool === 'rectangle' ||
        completedStroke.tool === 'circle';
      if (isShape && completedStroke.points.length < 2) {
        if (rendererRef.current) {
          rendererRef.current.scheduleRender(state.strokes, null);
        }
        return;
      }

      state.commitStroke(completedStroke);
    },
    []
  );

  const handlePointerLeave = useCallback(() => {
    updateCursorOverlay(0, 0, false);
  }, [updateCursorOverlay]);

  return {
    containerRef,
    canvasRef,
    cursorRef,
    dimensions,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: finishStroke,
    handlePointerCancel: finishStroke,
    handlePointerLeave,
  };
}
