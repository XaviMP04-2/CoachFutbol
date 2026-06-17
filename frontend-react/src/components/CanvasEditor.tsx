import React, { useEffect, useRef, useState } from 'react';
import type { CanvasElement } from '../types';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './canvas/constants';
import { drawElement, drawSelectionOverlay } from './canvas/drawElement';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { useCanvasScale } from '../hooks/useCanvasScale';
import CanvasToolbar from './canvas/CanvasToolbar';
import CanvasActionButtons from './canvas/CanvasActionButtons';
import CanvasToolPanel from './canvas/CanvasToolPanel';
import CanvasPropertiesPanel from './canvas/CanvasPropertiesPanel';

interface CanvasEditorProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  initialElements: CanvasElement[];
  onUpdateElements: (elements: CanvasElement[]) => void;
}

type ActiveTab = 'personas' | 'materiales' | 'texto' | 'flecha' | 'formas' | null;
type ArrowType = 'solid' | 'curved' | 'dashed' | 'zigzag';
type ShapeTool = 'zona' | 'linea' | 'circulo';
type DragMode = 'move' | 'resizeStart' | 'resizeEnd' | 'resizeControl' | 'rotate' | 'scale';

interface PendingPlacement {
  type: 'jugador' | 'material';
  data: { color?: string; number?: string; imgSrc?: string };
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ onSave, onClose, initialElements, onUpdateElements }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [elements, setElements] = useState<CanvasElement[]>(initialElements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<DragMode>('move');
  const [isEditingText, setIsEditingText] = useState(false);
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<PendingPlacement | null>(null);

  // Tool options
  const [selectedColor, setSelectedColor] = useState('#3498db');
  const [selectedNumber, setSelectedNumber] = useState('10');
  const [selectedArrowType, setSelectedArrowType] = useState<ArrowType>('solid');
  const [selectedArrowColor, setSelectedArrowColor] = useState('#ffff00');
  const [selectedShapeTool, setSelectedShapeTool] = useState<ShapeTool>('zona');
  const [selectedShapeColor, setSelectedShapeColor] = useState('#3498db');
  const [selectedShapeOpacity, setSelectedShapeOpacity] = useState(0.3);
  const [selectedLineWidth, setSelectedLineWidth] = useState(4);

  // Live preview ref — tracks mouse position while drawing (doesn't trigger re-render)
  const dragPreviewRef = useRef<{ x: number; y: number } | null>(null);

  const { scale, offset } = useCanvasScale(canvasRef, containerRef);
  const { history, historyIndex, saveToHistory, handleUndo, handleRedo, handleCopy, handlePaste, canUndo, canRedo } =
    useCanvasHistory(initialElements || []);

  // Sync elements to parent
  useEffect(() => { onUpdateElements(elements); }, [elements, onUpdateElements]);

  // Redraw whenever elements or selection changes
  useEffect(() => { drawCanvas(); }, [elements, selectedElementId, isEditingText]);

  // ── Drawing ──────────────────────────────────────────────────────────────

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bg = new Image();
    bg.src = '/img/campo.png';

    const drawContent = () => {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // Shapes first (bottom layer)
      elements
        .filter(el => el.tipo === 'zona' || el.tipo === 'circulo')
        .forEach(el => drawElement(ctx, el));

      // Lines
      elements.filter(el => el.tipo === 'linea').forEach(el => drawElement(ctx, el));

      // Everything else
      elements
        .filter(el => el.tipo !== 'zona' && el.tipo !== 'circulo' && el.tipo !== 'linea')
        .forEach(el => {
          drawElement(ctx, el, isEditingText, selectedElementId);
          if (el.id === selectedElementId) drawSelectionOverlay(ctx, el);
        });

      // Live drawing preview
      const prev = dragPreviewRef.current;
      if (prev) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isDrawingArrow && arrowStart) {
          ctx.strokeStyle = selectedArrowColor;
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 5]);
          ctx.beginPath();
          ctx.moveTo(arrowStart.x, arrowStart.y);
          ctx.lineTo(prev.x, prev.y);
          ctx.stroke();
          // Arrow head preview
          ctx.setLineDash([]);
          const angle = Math.atan2(prev.y - arrowStart.y, prev.x - arrowStart.x);
          const hl = 14;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(prev.x - hl * Math.cos(angle - Math.PI / 6), prev.y - hl * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(prev.x - hl * Math.cos(angle + Math.PI / 6), prev.y - hl * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = selectedArrowColor;
          ctx.fill();
        } else if (isDrawingShape && shapeStart) {
          if (selectedShapeTool === 'linea') {
            ctx.strokeStyle = selectedShapeColor;
            ctx.lineWidth = selectedLineWidth;
            ctx.setLineDash([]);
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            ctx.moveTo(shapeStart.x, shapeStart.y);
            ctx.lineTo(prev.x, prev.y);
            ctx.stroke();
          } else if (selectedShapeTool === 'circulo') {
            const rx = Math.max(5, Math.abs(prev.x - shapeStart.x) / 2);
            const ry = Math.max(5, Math.abs(prev.y - shapeStart.y) / 2);
            const cx = (shapeStart.x + prev.x) / 2;
            const cy = (shapeStart.y + prev.y) / 2;
            ctx.globalAlpha = selectedShapeOpacity;
            ctx.fillStyle = selectedShapeColor;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = selectedShapeColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
          } else {
            const rx = Math.min(shapeStart.x, prev.x);
            const ry = Math.min(shapeStart.y, prev.y);
            const rw = Math.abs(prev.x - shapeStart.x);
            const rh = Math.abs(prev.y - shapeStart.y);
            ctx.globalAlpha = selectedShapeOpacity;
            ctx.fillStyle = selectedShapeColor;
            ctx.fillRect(rx, ry, rw, rh);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = selectedShapeColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(rx, ry, rw, rh);
          }
        }
        ctx.restore();
      }
    };

    if (bg.complete) drawContent();
    else bg.onload = drawContent;
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
      } else return { x: 0, y: 0 };
    } else {
      clientX = e.clientX; clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, ...updates } : el));
  };

  const pointToSegmentDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!selectedElementId) return;
    const newElements = elements.filter(e => e.id !== selectedElementId);
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElementId(null);
  };

  const handleAddText = () => {
    const newElements = [...elements, {
      id: Date.now().toString(),
      tipo: 'texto' as const,
      x: LOGICAL_WIDTH / 2,
      y: LOGICAL_HEIGHT / 2,
      texto: 'Texto',
      fontSize: 40,
      color: 'white'
    }];
    setElements(newElements);
    saveToHistory(newElements);
    setActiveTab(null);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = LOGICAL_WIDTH;
    tempCanvas.height = LOGICAL_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    const bg = new Image();
    bg.src = '/img/campo.png';
    bg.onload = () => {
      tempCtx.drawImage(bg, 0, 0, tempCanvas.width, tempCanvas.height);
      elements.forEach(el => drawElement(tempCtx, el));
      const link = document.createElement('a');
      link.download = `pizarra-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    };
  };

  // ── Mouse/Touch event handlers ────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    // Tap-to-place (mobile)
    if (pendingPlacement) {
      if (pendingPlacement.type === 'jugador') {
        setElements(prev => [...prev, { id: Date.now().toString(), tipo: 'jugador', x, y, width: 40, height: 40, color: pendingPlacement.data.color || selectedColor, number: pendingPlacement.data.number || selectedNumber, textColor: '#fff' }]);
      } else if (pendingPlacement.type === 'material' && pendingPlacement.data.imgSrc) {
        const img = new Image();
        const src = pendingPlacement.data.imgSrc;
        img.src = src;
        img.onload = () => {
          let w = 40, h = 40;
          if (src.includes('balon')) { w = 30; h = 30; }
          else if (src.includes('porteria')) { w = 120; h = 60; }
          else if (src.includes('cono')) { w = 35; h = 35; }
          setElements(prev => [...prev, { id: Date.now().toString(), tipo: 'imagen', x, y, width: w, height: h, img }]);
        };
      }
      setPendingPlacement(null);
      setActiveTab(null);
      return;
    }

    if (activeTab === 'flecha') {
      setIsDrawingArrow(true);
      setArrowStart({ x, y });
      setSelectedElementId(null);
      setIsEditingText(false);
      return;
    }

    if (activeTab === 'formas') {
      setIsDrawingShape(true);
      setShapeStart({ x, y });
      setSelectedElementId(null);
      setIsEditingText(false);
      return;
    }

    // Hit test
    let foundId: string | null = null;
    let foundMode: DragMode = 'move';

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      let hit = false;

      if (el.tipo === 'imagen') {
        const w = el.width || 40, h = el.height || 40;
        const rotation = el.rotation || 0;
        const dx = x - el.x, dy = y - el.y;
        const cos = Math.cos(-rotation), sin = Math.sin(-rotation);
        const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;

        if (el.id === selectedElementId) {
          if (Math.hypot(lx, ly + h / 2 + 25) < 12) { hit = true; foundMode = 'rotate'; }
          if (!hit && Math.hypot(lx - w / 2, ly - h / 2) < 15) { hit = true; foundMode = 'scale'; }
        }
        if (!hit && lx >= -w / 2 && lx <= w / 2 && ly >= -h / 2 && ly <= h / 2) { hit = true; foundMode = 'move'; }
      } else if (el.tipo === 'jugador') {
        const w = el.width || 40, h = el.height || 40;
        hit = x >= el.x - w / 2 && x <= el.x + w / 2 && y >= el.y - h / 2 && y <= el.y + h / 2;
        if (hit) foundMode = 'move';
      } else if (el.tipo === 'texto') {
        const w = (el.texto?.length || 1) * (el.fontSize || 20) * 0.6 + 20;
        const h = (el.fontSize || 20) + 10;
        hit = x >= el.x - w / 2 && x <= el.x + w / 2 && y >= el.y - h / 2 && y <= el.y + h / 2;
        if (hit) foundMode = 'move';
      } else if (el.tipo === 'flecha') {
        if (el.arrowType === 'curved') {
          const dx = (el.x2 || 0) - el.x, dy = (el.y2 || 0) - el.y;
          const cpX = el.cpX ?? ((el.x + (el.x2 || 0)) / 2 - dy * 0.3);
          const cpY = el.cpY ?? ((el.y + (el.y2 || 0)) / 2 + dx * 0.3);
          if (Math.hypot(x - cpX, y - cpY) < 15) { hit = true; foundMode = 'resizeControl'; }
        }
        if (!hit && Math.hypot(x - el.x, y - el.y) < 15) { hit = true; foundMode = 'resizeStart'; }
        else if (!hit && Math.hypot(x - (el.x2 || 0), y - (el.y2 || 0)) < 15) { hit = true; foundMode = 'resizeEnd'; }
        else if (!hit && pointToSegmentDistance(x, y, el.x, el.y, el.x2 || 0, el.y2 || 0) < 10) { hit = true; foundMode = 'move'; }
      }

      if (hit) { foundId = el.id; break; }
    }

    if (foundId) {
      setSelectedElementId(foundId);
      setDragMode(foundMode);
      setIsEditingText(false);
      const el = elements.find(e => e.id === foundId)!;
      if (foundMode === 'move') setDragOffset({ x: x - el.x, y: y - el.y });
      setIsDragging(true);
    } else {
      setSelectedElementId(null);
      setIsEditingText(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const el = elements.find(el => el.id === selectedElementId);
    if (el?.tipo === 'texto') {
      const w = (el.texto?.length || 1) * (el.fontSize || 20) * 0.6 + 20;
      const h = (el.fontSize || 20) + 10;
      if (x >= el.x - w / 2 && x <= el.x + w / 2 && y >= el.y - h / 2 && y <= el.y + h / 2) {
        setIsEditingText(true);
        setIsDragging(false);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update live preview while drawing arrows or shapes
    if (isDrawingArrow || isDrawingShape) {
      const coords = getCanvasCoords(e);
      dragPreviewRef.current = coords;
      drawCanvas();
      return;
    }
    if (!isDragging || !selectedElementId) return;
    const { x, y } = getCanvasCoords(e);
    setElements(prev => prev.map(el => {
      if (el.id !== selectedElementId) return el;
      if (dragMode === 'move') {
        if (el.tipo === 'flecha') {
          const dx = x - dragOffset.x - el.x, dy = y - dragOffset.y - el.y;
          return { ...el, x: x - dragOffset.x, y: y - dragOffset.y, x2: (el.x2 || 0) + dx, y2: (el.y2 || 0) + dy };
        }
        return { ...el, x: x - dragOffset.x, y: y - dragOffset.y };
      }
      if (dragMode === 'resizeStart' && el.tipo === 'flecha') return { ...el, x, y };
      if (dragMode === 'resizeEnd' && el.tipo === 'flecha') return { ...el, x2: x, y2: y };
      if (dragMode === 'resizeControl' && el.tipo === 'flecha') return { ...el, cpX: x, cpY: y };
      if (dragMode === 'rotate' && el.tipo === 'imagen') return { ...el, rotation: Math.atan2(y - el.y, x - el.x) + Math.PI / 2 };
      if (dragMode === 'scale' && el.tipo === 'imagen') {
        const dist = Math.hypot(x - el.x, y - el.y);
        const diag = Math.hypot(el.width || 40, el.height || 40) / 2;
        const f = dist / diag;
        return { ...el, width: Math.max(20, Math.min(300, (el.width || 40) * f)), height: Math.max(20, Math.min(300, (el.height || 40) * f)) };
      }
      return el;
    }));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    dragPreviewRef.current = null;
    if (isDrawingArrow && arrowStart) {
      const { x, y } = getCanvasCoords(e);
      const newEl: CanvasElement = {
        id: Date.now().toString(), tipo: 'flecha',
        x: arrowStart.x, y: arrowStart.y, x2: x, y2: y,
        color: selectedArrowColor, arrowType: selectedArrowType,
        ...(selectedArrowType === 'curved' ? {
          cpX: (arrowStart.x + x) / 2 - (y - arrowStart.y) * 0.3,
          cpY: (arrowStart.y + y) / 2 + (x - arrowStart.x) * 0.3
        } : {})
      };
      const newElements = [...elements, newEl];
      setElements(newElements);
      saveToHistory(newElements);
      setIsDrawingArrow(false);
      setArrowStart(null);
    }

    if (isDrawingShape && shapeStart) {
      const { x, y } = getCanvasCoords(e);
      let newEl: CanvasElement;
      if (selectedShapeTool === 'linea') {
        newEl = { id: Date.now().toString(), tipo: 'linea', x: shapeStart.x, y: shapeStart.y, x2: x, y2: y, color: selectedShapeColor, strokeWidth: selectedLineWidth };
      } else if (selectedShapeTool === 'circulo') {
        newEl = { id: Date.now().toString(), tipo: 'circulo', x: (shapeStart.x + x) / 2, y: (shapeStart.y + y) / 2, width: Math.max(20, Math.abs(x - shapeStart.x)), height: Math.max(20, Math.abs(y - shapeStart.y)), color: selectedShapeColor, fillColor: selectedShapeColor, opacity: selectedShapeOpacity };
      } else {
        newEl = { id: Date.now().toString(), tipo: 'zona', x: Math.min(shapeStart.x, x), y: Math.min(shapeStart.y, y), width: Math.max(20, Math.abs(x - shapeStart.x)), height: Math.max(20, Math.abs(y - shapeStart.y)), color: selectedShapeColor, fillColor: selectedShapeColor, opacity: selectedShapeOpacity };
      }
      const newElements = [...elements, newEl];
      setElements(newElements);
      saveToHistory(newElements);
      setIsDrawingShape(false);
      setShapeStart(null);
    }

    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const type = e.dataTransfer.getData('type');
    if (type === 'jugador') {
      const color = e.dataTransfer.getData('color') || selectedColor;
      const number = e.dataTransfer.getData('number') || selectedNumber;
      setElements(prev => [...prev, { id: Date.now().toString(), tipo: 'jugador', x, y, width: 40, height: 40, color, number, textColor: '#fff' }]);
    } else {
      const imgSrc = e.dataTransfer.getData('imgSrc');
      if (imgSrc) {
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => {
          let w = 40, h = 40;
          if (imgSrc.includes('balon')) { w = 30; h = 30; }
          else if (imgSrc.includes('porteria')) { w = 120; h = 60; }
          else if (imgSrc.includes('cono')) { w = 35; h = 35; }
          setElements(prev => [...prev, { id: Date.now().toString(), tipo: 'imagen', img, x, y, width: w, height: h }]);
        };
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable);
      if (isEditingText || isInput) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); handleUndo(history, historyIndex, setElements); }
        else if (e.key === 'y') { e.preventDefault(); handleRedo(history, historyIndex, setElements); }
        else if (e.key === 'c') { e.preventDefault(); handleCopy(elements, selectedElementId); }
        else if (e.key === 'v') { e.preventDefault(); handlePaste(elements, newEls => { setElements(newEls); saveToHistory(newEls); }, setSelectedElementId); }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, isEditingText, elements, historyIndex, history]);

  const selectedElement = elements.find(e => e.id === selectedElementId) ?? null;

  return (
    <div
      id="canvas-container"
      className="canvas-editor-container"
      style={{ display: 'flex', flexDirection: 'row', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#1a1a1a', zIndex: 2000, padding: 0 }}
    >
      {/* Left toolbar */}
      <CanvasToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddText={handleAddText}
        onUndo={() => handleUndo(history, historyIndex, setElements)}
        onRedo={() => handleRedo(history, historyIndex, setElements)}
        onExportPNG={handleExportPNG}
        canUndo={canUndo}
        canRedo={canRedo}
        hasPendingPlacement={!!pendingPlacement}
        clearPendingPlacement={() => setPendingPlacement(null)}
      />

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="canvas-editor-area"
        style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', background: '#121212' }}
      >
        {pendingPlacement && (
          <div className="canvas-pending-indicator">Toca en el campo para colocar</div>
        )}

        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={e => { e.preventDefault(); handleMouseDown(e as unknown as React.MouseEvent); }}
          onTouchMove={e => { e.preventDefault(); handleMouseMove(e as unknown as React.MouseEvent); }}
          onTouchEnd={e => { e.preventDefault(); handleMouseUp(e as unknown as React.MouseEvent); }}
          onDoubleClick={handleDoubleClick}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: `${LOGICAL_WIDTH}/${LOGICAL_HEIGHT}`,
            boxShadow: pendingPlacement ? '0 0 20px #27ae60' : '0 0 30px rgba(0,0,0,0.5)',
            cursor: pendingPlacement || activeTab === 'flecha' || activeTab === 'formas' ? 'crosshair' : 'default',
            touchAction: 'none',
            border: pendingPlacement ? '3px solid #27ae60' : 'none'
          }}
        />

        {/* Tool popup panels */}
        <CanvasToolPanel
          activeTab={activeTab as 'personas' | 'materiales' | 'flecha' | 'formas' | null}
          setActiveTab={setActiveTab as (tab: 'personas' | 'materiales' | 'flecha' | 'formas' | null) => void}
          selectedColor={selectedColor} setSelectedColor={setSelectedColor}
          selectedNumber={selectedNumber} setSelectedNumber={setSelectedNumber}
          setPendingPlacement={setPendingPlacement}
          selectedArrowType={selectedArrowType} setSelectedArrowType={setSelectedArrowType}
          selectedArrowColor={selectedArrowColor} setSelectedArrowColor={setSelectedArrowColor}
          selectedShapeTool={selectedShapeTool} setSelectedShapeTool={setSelectedShapeTool}
          selectedShapeColor={selectedShapeColor} setSelectedShapeColor={setSelectedShapeColor}
          selectedShapeOpacity={selectedShapeOpacity} setSelectedShapeOpacity={setSelectedShapeOpacity}
          selectedLineWidth={selectedLineWidth} setSelectedLineWidth={setSelectedLineWidth}
        />

        {/* Floating properties panel */}
        {selectedElement && (
          <CanvasPropertiesPanel
            selectedElement={selectedElement}
            scale={scale}
            offset={offset}
            isEditingText={isEditingText}
            setIsEditingText={setIsEditingText}
            updateSelectedElement={updateSelectedElement}
          />
        )}
      </div>

      {/* Right action buttons */}
      <CanvasActionButtons
        onSave={() => canvasRef.current && onSave(canvasRef.current.toDataURL('image/png'))}
        onClose={onClose}
        onDelete={handleDelete}
        hasSelection={!!selectedElementId}
      />
    </div>
  );
};

export default CanvasEditor;
