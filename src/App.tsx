import React from 'react';
import { Canvas } from './components/Canvas';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { Toolbar } from './components/Toolbar';
import { ToolSettingsPanel } from './components/ToolSettingsPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export const App: React.FC = () => {
  // Activate global keyboard shortcuts (Undo, Redo, Tools, Export, etc.)
  useKeyboardShortcuts();

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans">
      {/* Responsive HiDPI Drawing Surface */}
      <Canvas />

      {/* Floating Navigation & Tool Dock */}
      <Toolbar />

      {/* Dynamic Tool Settings Inspector (Color Picker + Stroke/Brush Sliders) */}
      <ToolSettingsPanel />

      {/* Confirmation & Shortcuts Dialogs */}
      <ClearConfirmModal />
    </main>
  );
};

export default App;
