import { useState } from 'react';
import type { CanvasElement } from '../types';

export function useCanvasHistory(initialElements: CanvasElement[]) {
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);
  const [history, setHistory] = useState<CanvasElement[][]>([initialElements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = (newElements: CanvasElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  const handleUndo = (
    currentHistory: CanvasElement[][],
    currentIndex: number,
    setElements: (els: CanvasElement[]) => void
  ) => {
    if (currentIndex > 0) {
      setHistoryIndex(currentIndex - 1);
      setElements(currentHistory[currentIndex - 1]);
    }
  };

  const handleRedo = (
    currentHistory: CanvasElement[][],
    currentIndex: number,
    setElements: (els: CanvasElement[]) => void
  ) => {
    if (currentIndex < currentHistory.length - 1) {
      setHistoryIndex(currentIndex + 1);
      setElements(currentHistory[currentIndex + 1]);
    }
  };

  const handleCopy = (elements: CanvasElement[], selectedElementId: string | null) => {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (el) setClipboard({ ...el });
  };

  const handlePaste = (
    elements: CanvasElement[],
    setElements: (els: CanvasElement[]) => void,
    setSelectedElementId: (id: string) => void
  ) => {
    if (!clipboard) return;
    const newEl: CanvasElement = {
      ...clipboard,
      id: Date.now().toString(),
      x: clipboard.x + 30,
      y: clipboard.y + 30,
      ...(clipboard.x2 !== undefined ? { x2: clipboard.x2 + 30 } : {}),
      ...(clipboard.y2 !== undefined ? { y2: clipboard.y2 + 30 } : {})
    };
    const newElements = [...elements, newEl];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElementId(newEl.id);
  };

  return {
    clipboard,
    history,
    historyIndex,
    saveToHistory,
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
}
