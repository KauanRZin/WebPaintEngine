import { useEffect } from 'react';
import { useDrawingStore } from '../store/useDrawingStore';

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInputFocused) {
        if (event.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const state = useDrawingStore.getState();
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      // Escape closes any open modal
      if (event.key === 'Escape') {
        if (state.isClearConfirmOpen) state.setClearConfirmOpen(false);
        if (state.isExportModalOpen) state.setExportModalOpen(false);
        if (state.showShortcutsHelp) state.setShowShortcutsHelp(false);
        return;
      }

      // Undo: Ctrl+Z
      if (isCtrlOrMeta && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        state.undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (isCtrlOrMeta && event.key.toLowerCase() === 'y') ||
        (isCtrlOrMeta && event.shiftKey && event.key.toLowerCase() === 'z')
      ) {
        event.preventDefault();
        state.redo();
        return;
      }

      // Export: Ctrl+E or Ctrl+S
      if (
        isCtrlOrMeta &&
        (event.key.toLowerCase() === 'e' || event.key.toLowerCase() === 's')
      ) {
        event.preventDefault();
        state.setExportModalOpen(true);
        return;
      }

      if (isCtrlOrMeta || event.altKey) return;

      // Single-key tool & brush shortcuts
      switch (event.key.toLowerCase()) {
        case 'b':
          state.setTool('brush');
          break;
        case 'e':
          state.setTool('eraser');
          break;
        case 'l':
          state.setTool('line');
          break;
        case 'r':
          state.setTool('rectangle');
          break;
        case 'c':
          state.setTool('circle');
          break;
        case '[':
          state.setSize(state.settings.size - 2);
          break;
        case ']':
          state.setSize(state.settings.size + 2);
          break;
        case 'f':
          state.setFilledShape(!state.settings.filledShape);
          break;
        case '?':
          state.setShowShortcutsHelp(!state.showShortcutsHelp);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
