import { create } from 'zustand';
import {
  BrushSettings,
  CanvasBackgroundMode,
  EraserMode,
  Stroke,
  ToolType,
} from '../types/canvas';

export const MAX_HISTORY_LIMIT = 50;

export const DEFAULT_PALETTE = [
  '#0F172A', // Slate 900 (Ink Black)
  '#EF4444', // Red 500
  '#F97316', // Orange 500
  '#F59E0B', // Amber 500
  '#10B981', // Emerald 500
  '#06B6D4', // Cyan 500
  '#3B82F6', // Blue 500
  '#6366F1', // Indigo 500
  '#8B5CF6', // Violet 500
  '#EC4899', // Pink 500
  '#64748B', // Slate 500
  '#FFFFFF', // Pure White
];

/**
 * Memento snapshot representing an immutable state of the canvas strokes
 */
interface HistorySnapshot {
  strokes: Stroke[];
  description: string;
  timestamp: number;
}

interface DrawingState {
  // Active Tool & Brush Configuration
  activeTool: ToolType;
  settings: BrushSettings;
  recentColors: string[];
  backgroundMode: CanvasBackgroundMode;

  // Memento History Stacks (Command / Snapshot Pattern)
  strokes: Stroke[];
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // UI Dialog States
  isClearConfirmOpen: boolean;
  isExportModalOpen: boolean;
  showShortcutsHelp: boolean;

  // Actions — Tool & Brush Settings
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setThinning: (thinning: number) => void;
  setSmoothing: (smoothing: number) => void;
  setStreamline: (streamline: number) => void;
  setSimulatePressure: (simulate: boolean) => void;
  setFilledShape: (filled: boolean) => void;
  setEraserMode: (mode: EraserMode) => void;
  setBackgroundMode: (mode: CanvasBackgroundMode) => void;

  // Actions — Canvas & History (Memento Pattern with 50-state cap)
  commitStroke: (stroke: Stroke) => void;
  removeStrokesByIds: (ids: string[], saveHistory?: boolean) => void;
  pushHistorySnapshot: (description: string) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;

  // Actions — UI Modals
  setClearConfirmOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setShowShortcutsHelp: (open: boolean) => void;
}

const initialSettings: BrushSettings = {
  color: '#0F172A',
  size: 8,
  opacity: 1,
  thinning: 0.55,
  smoothing: 0.65,
  streamline: 0.55,
  simulatePressure: true,
  filledShape: false,
  eraserMode: 'mask',
};

export const useDrawingStore = create<DrawingState>((set, get) => ({
  activeTool: 'brush',
  settings: initialSettings,
  recentColors: ['#0F172A', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
  backgroundMode: 'grid',

  strokes: [],
  past: [],
  future: [],

  isClearConfirmOpen: false,
  isExportModalOpen: false,
  showShortcutsHelp: false,

  setTool: (tool) => set({ activeTool: tool }),

  setColor: (color) =>
    set((state) => {
      const normalized = color.toUpperCase();
      const filtered = state.recentColors.filter(
        (c) => c.toUpperCase() !== normalized
      );
      const nextRecent = [color, ...filtered].slice(0, 8);
      return {
        settings: { ...state.settings, color },
        recentColors: nextRecent,
        // Automatically switch from eraser to brush when user picks a color
        activeTool: state.activeTool === 'eraser' ? 'brush' : state.activeTool,
      };
    }),

  setSize: (size) =>
    set((state) => ({
      settings: {
        ...state.settings,
        size: Math.max(1, Math.min(50, size)),
      },
    })),

  setOpacity: (opacity) =>
    set((state) => ({
      settings: {
        ...state.settings,
        opacity: Math.max(0.05, Math.min(1, Number(opacity.toFixed(2)))),
      },
    })),

  setThinning: (thinning) =>
    set((state) => ({
      settings: {
        ...state.settings,
        thinning: Math.max(0, Math.min(1, thinning)),
      },
    })),

  setSmoothing: (smoothing) =>
    set((state) => ({
      settings: {
        ...state.settings,
        smoothing: Math.max(0, Math.min(1, smoothing)),
      },
    })),

  setStreamline: (streamline) =>
    set((state) => ({
      settings: {
        ...state.settings,
        streamline: Math.max(0, Math.min(1, streamline)),
      },
    })),

  setSimulatePressure: (simulatePressure) =>
    set((state) => ({
      settings: { ...state.settings, simulatePressure },
    })),

  setFilledShape: (filledShape) =>
    set((state) => ({
      settings: { ...state.settings, filledShape },
    })),

  setEraserMode: (eraserMode) =>
    set((state) => ({
      settings: { ...state.settings, eraserMode },
    })),

  setBackgroundMode: (backgroundMode) => set({ backgroundMode }),

  pushHistorySnapshot: (description) =>
    set((state) => {
      const snapshot: HistorySnapshot = {
        strokes: state.strokes,
        description,
        timestamp: Date.now(),
      };
      const updatedPast = [...state.past, snapshot];
      if (updatedPast.length > MAX_HISTORY_LIMIT) {
        updatedPast.shift();
      }
      return {
        past: updatedPast,
        future: [],
      };
    }),

  commitStroke: (stroke) =>
    set((state) => {
      const snapshot: HistorySnapshot = {
        strokes: state.strokes,
        description: `Traço (${stroke.tool})`,
        timestamp: Date.now(),
      };
      const updatedPast = [...state.past, snapshot];
      if (updatedPast.length > MAX_HISTORY_LIMIT) {
        updatedPast.shift();
      }
      return {
        strokes: [...state.strokes, stroke],
        past: updatedPast,
        future: [],
      };
    }),

  removeStrokesByIds: (ids, saveHistory = false) =>
    set((state) => {
      if (ids.length === 0) return state;
      const idSet = new Set(ids);
      const nextStrokes = state.strokes.filter((s) => !idSet.has(s.id));
      if (nextStrokes.length === state.strokes.length) return state;

      if (!saveHistory) {
        return { strokes: nextStrokes };
      }

      const snapshot: HistorySnapshot = {
        strokes: state.strokes,
        description: 'Apagar objeto(s)',
        timestamp: Date.now(),
      };
      const updatedPast = [...state.past, snapshot];
      if (updatedPast.length > MAX_HISTORY_LIMIT) {
        updatedPast.shift();
      }

      return {
        strokes: nextStrokes,
        past: updatedPast,
        future: [],
      };
    }),

  undo: () => {
    const { past, strokes, future } = get();
    if (past.length === 0) return;

    const previousSnapshot = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    const currentSnapshot: HistorySnapshot = {
      strokes,
      description: 'Estado desfeito',
      timestamp: Date.now(),
    };

    const newFuture = [currentSnapshot, ...future].slice(0, MAX_HISTORY_LIMIT);

    set({
      strokes: previousSnapshot.strokes,
      past: newPast,
      future: newFuture,
    });
  },

  redo: () => {
    const { past, strokes, future } = get();
    if (future.length === 0) return;

    const nextSnapshot = future[0];
    const newFuture = future.slice(1);

    const currentSnapshot: HistorySnapshot = {
      strokes,
      description: 'Estado refeito',
      timestamp: Date.now(),
    };

    const newPast = [...past, currentSnapshot];
    if (newPast.length > MAX_HISTORY_LIMIT) {
      newPast.shift();
    }

    set({
      strokes: nextSnapshot.strokes,
      past: newPast,
      future: newFuture,
    });
  },

  clearCanvas: () =>
    set((state) => {
      if (state.strokes.length === 0) {
        return { isClearConfirmOpen: false };
      }
      const snapshot: HistorySnapshot = {
        strokes: state.strokes,
        description: 'Limpar tela',
        timestamp: Date.now(),
      };
      const updatedPast = [...state.past, snapshot];
      if (updatedPast.length > MAX_HISTORY_LIMIT) {
        updatedPast.shift();
      }
      return {
        strokes: [],
        past: updatedPast,
        future: [],
        isClearConfirmOpen: false,
      };
    }),

  setClearConfirmOpen: (isClearConfirmOpen) => set({ isClearConfirmOpen }),
  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
  setShowShortcutsHelp: (showShortcutsHelp) => set({ showShortcutsHelp }),
}));
