import React, { useEffect, useRef, useState } from 'react';
import type { CanvasElement } from '../types';

interface CanvasEditorProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  initialElements: CanvasElement[];
  onUpdateElements: (elements: CanvasElement[]) => void;
}

const LOGICAL_WIDTH = 1219;
const LOGICAL_HEIGHT = 765;

const CanvasEditor: React.FC<CanvasEditorProps> = ({ onSave, onClose, initialElements, onUpdateElements }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>(initialElements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personas' | 'materiales' | 'texto' | 'flecha' | 'formas' | null>(null);
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number, y: number } | null>(null);
  
  // New interaction states
  const [dragMode, setDragMode] = useState<'move' | 'resizeStart' | 'resizeEnd' | 'resizeControl' | 'rotate' | 'scale'>('move');
  const [isEditingText, setIsEditingText] = useState(false);
  
  // Drawing shapes state
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState<{ x: number, y: number } | null>(null);
  const [selectedShapeTool, setSelectedShapeTool] = useState<'zona' | 'linea' | 'circulo'>('zona');

  // Tools state
  const [selectedColor, setSelectedColor] = useState('#3498db'); // Default blue for players
  const [selectedNumber, setSelectedNumber] = useState('10');
  const [selectedArrowType, setSelectedArrowType] = useState<'solid' | 'curved' | 'dashed' | 'zigzag'>('solid');
  const [selectedArrowColor, setSelectedArrowColor] = useState('#ffff00'); // Default yellow for arrows
  const [selectedShapeColor, setSelectedShapeColor] = useState('#3498db'); // Default blue for shapes
  const [selectedShapeOpacity, setSelectedShapeOpacity] = useState(0.3); // Default 30% opacity

  // Clipboard & History
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);
  const [history, setHistory] = useState<CanvasElement[][]>([initialElements || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Scale state for overlays
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // Pending element to place on tap (for mobile tap-to-place feature)
  const [pendingPlacement, setPendingPlacement] = useState<{
    type: 'jugador' | 'material';
    data: { color?: string; number?: string; imgSrc?: string };
  } | null>(null);

  useEffect(() => {
    const handleResize = () => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setScale(rect.width / LOGICAL_WIDTH);
        setOffset({ x: rect.left, y: rect.top });

    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init

    // Also observe container
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
    };
  }, []);

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    setElements(prev => prev.map(el => {
        if (el.id === selectedElementId) {
            return { ...el, ...updates };
        }
        return el;
    }));
  };

  // Sync elements to parent whenever they change
  useEffect(() => {
    onUpdateElements(elements);
  }, [elements, onUpdateElements]);

  // Save to history when elements change (debounced)
  const saveToHistory = (newElements: CanvasElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      // Limit history to 50 items
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Copy selected element
  const handleCopy = () => {
    if (selectedElementId) {
      const el = elements.find(e => e.id === selectedElementId);
      if (el) setClipboard({ ...el });
    }
  };

  // Paste from clipboard
  const handlePaste = () => {
    if (clipboard) {
      const newEl = {
        ...clipboard,
        id: Date.now().toString(),
        x: clipboard.x + 30,
        y: clipboard.y + 30,
        // For arrows, also offset x2/y2
        ...(clipboard.x2 !== undefined ? { x2: clipboard.x2 + 30 } : {}),
        ...(clipboard.y2 !== undefined ? { y2: clipboard.y2 + 30 } : {})
      };
      const newElements = [...elements, newEl];
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElementId(newEl.id);
    }
  };

  // Export as PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas without selection
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = LOGICAL_WIDTH;
    tempCanvas.height = LOGICAL_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw bg
    const bg = new Image();
    bg.src = '/img/campo.png';
    bg.onload = () => {
      tempCtx.drawImage(bg, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw all elements without selection
      elements.forEach(el => {
        drawElement(tempCtx, el, false);
      });
      
      // Download
      const link = document.createElement('a');
      link.download = `pizarra-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    };
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if an input/textarea is focused
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );
      
      // Only handle if canvas is focused (not editing text or using inputs)
      if (isEditingText || isInputFocused) return;
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'c') {
          e.preventDefault();
          handleCopy();
        } else if (e.key === 'v') {
          e.preventDefault();
          handlePaste();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !isEditingText) {
          e.preventDefault();
          const newElements = elements.filter(el => el.id !== selectedElementId);
          setElements(newElements);
          saveToHistory(newElements);
          setSelectedElementId(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, isEditingText, elements, clipboard, historyIndex, history]);

  // Redraw when elements or selection changes
  useEffect(() => {
    drawCanvas();
  }, [elements, selectedElementId]);

  // Helper: Distance from point to line segment
  const pointToSegmentDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  // Draw a single element (used for export)
  const drawElement = (ctx: CanvasRenderingContext2D, el: CanvasElement, _showSelection: boolean = false) => {
    if (el.tipo === 'zona') {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 0.3;
      ctx.fillStyle = el.fillColor || el.color || '#3498db';
      ctx.fillRect(el.x, el.y, el.width || 100, el.height || 60);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = el.color || '#3498db';
      ctx.lineWidth = 2;
      ctx.strokeRect(el.x, el.y, el.width || 100, el.height || 60);
      ctx.restore();
    } else if (el.tipo === 'linea' && el.x2 !== undefined && el.y2 !== undefined) {
      ctx.save();
      ctx.strokeStyle = el.color || '#ffffff';
      ctx.lineWidth = el.strokeWidth || 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
      ctx.restore();
    } else if (el.tipo === 'circulo') {
      const rx = (el.width || 60) / 2;
      const ry = (el.height || 60) / 2;
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 0.3;
      ctx.fillStyle = el.fillColor || el.color || '#3498db';
      ctx.beginPath();
      ctx.ellipse(el.x, el.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = el.color || '#3498db';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    } else if (el.tipo === 'imagen' && el.img) {
      ctx.save();
      ctx.translate(el.x, el.y);
      if (el.rotation) ctx.rotate(el.rotation);
      if (el.flipped) ctx.scale(-1, 1);
      ctx.drawImage(el.img, -(el.width || 0) / 2, -(el.height || 0) / 2, el.width || 0, el.height || 0);
      ctx.restore();
    } else if (el.tipo === 'jugador') {
      const w = el.width || 40;
      ctx.save();
      ctx.beginPath();
      ctx.arc(el.x, el.y, w/2, 0, Math.PI * 2);
      ctx.fillStyle = el.color || '#3498db';
      ctx.fill();
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (el.number) {
        ctx.fillStyle = el.textColor || 'white';
        ctx.font = `bold ${w * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.number, el.x, el.y);
      }
      ctx.restore();
    } else if (el.tipo === 'texto' && el.texto) {
      ctx.font = `bold ${el.fontSize}px Arial`;
      ctx.fillStyle = el.color || 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.texto, el.x, el.y);
    } else if (el.tipo === 'flecha' && el.x2 !== undefined && el.y2 !== undefined) {
      const headLength = 15;
      const arrowType = el.arrowType || 'solid';
      let headAngle: number;
      let cpX: number | undefined;
      let cpY: number | undefined;
      
      if (arrowType === 'curved') {
        const dx = el.x2 - el.x;
        const dy = el.y2 - el.y;
        cpX = el.cpX ?? ((el.x + el.x2) / 2 - dy * 0.3);
        cpY = el.cpY ?? ((el.y + el.y2) / 2 + dx * 0.3);
        headAngle = Math.atan2(el.y2 - cpY, el.x2 - cpX);
      } else {
        headAngle = Math.atan2(el.y2 - el.y, el.x2 - el.x);
      }
      
      const shortenBy = headLength * 0.7;
      const endX = el.x2 - shortenBy * Math.cos(headAngle);
      const endY = el.y2 - shortenBy * Math.sin(headAngle);
      
      ctx.save();
      ctx.strokeStyle = el.color || 'yellow';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      if (arrowType === 'solid') {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else if (arrowType === 'curved') {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.quadraticCurveTo(cpX!, cpY!, endX, endY);
        ctx.stroke();
      } else if (arrowType === 'dashed') {
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
      
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(el.x2 - headLength * Math.cos(headAngle - Math.PI / 6), el.y2 - headLength * Math.sin(headAngle - Math.PI / 6));
      ctx.lineTo(el.x2 - headLength * Math.cos(headAngle + Math.PI / 6), el.y2 - headLength * Math.sin(headAngle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = el.color || 'yellow';
      ctx.fill();
    }
  };

  // Draw function
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    const bg = new Image();
    bg.src = '/img/campo.png';
    
    const drawContent = () => {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // Draw Elements - shapes first (below other elements)
        elements.filter(el => el.tipo === 'zona' || el.tipo === 'circulo').forEach(el => {
          if (el.tipo === 'zona') {
            ctx.save();
            ctx.globalAlpha = el.opacity ?? 0.3;
            ctx.fillStyle = el.fillColor || el.color || '#3498db';
            ctx.fillRect(el.x, el.y, el.width || 100, el.height || 60);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = el.color || '#3498db';
            ctx.lineWidth = 2;
            ctx.strokeRect(el.x, el.y, el.width || 100, el.height || 60);
            ctx.restore();
          } else if (el.tipo === 'circulo') {
            const rx = (el.width || 60) / 2;
            const ry = (el.height || 60) / 2;
            ctx.save();
            ctx.globalAlpha = el.opacity ?? 0.3;
            ctx.fillStyle = el.fillColor || el.color || '#3498db';
            ctx.beginPath();
            ctx.ellipse(el.x, el.y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = el.color || '#3498db';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          }
        });
        
        // Draw lines
        elements.filter(el => el.tipo === 'linea').forEach(el => {
          if (el.x2 !== undefined && el.y2 !== undefined) {
            ctx.save();
            ctx.strokeStyle = el.color || '#ffffff';
            ctx.lineWidth = el.strokeWidth || 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(el.x, el.y);
            ctx.lineTo(el.x2, el.y2);
            ctx.stroke();
            ctx.restore();
          }
        });
        
        // Draw other elements
        elements.filter(el => el.tipo !== 'zona' && el.tipo !== 'circulo' && el.tipo !== 'linea').forEach(el => {
          if (el.tipo === 'imagen' && el.img) {
            ctx.save();
            ctx.translate(el.x, el.y);
            if (el.rotation) ctx.rotate(el.rotation);
            if (el.flipped) ctx.scale(-1, 1);
            ctx.drawImage(el.img, -(el.width || 0) / 2, -(el.height || 0) / 2, el.width || 0, el.height || 0);
            ctx.restore();
          } else if (el.tipo === 'jugador') {
            // Draw Jersey
            const w = el.width || 40;
            // const h = el.height || 40;
            // const x = el.x - w/2; // Unused
            // const y = el.y - h/2; // Unused

            ctx.save();
            
            // Draw simple circle for body/jersey
            ctx.beginPath();
            ctx.arc(el.x, el.y, w/2, 0, Math.PI * 2);
            ctx.fillStyle = el.color || '#3498db';
            ctx.fill();
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw number
            if (el.number) {
                ctx.fillStyle = el.textColor || 'white';
                ctx.font = `bold ${w * 0.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(el.number, el.x, el.y);
            }
            
            ctx.restore();

          } else if (el.tipo === 'texto' && el.texto) {
            ctx.font = `bold ${el.fontSize}px Arial`;
            ctx.fillStyle = el.color || 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Only draw text if NOT editing (to prevent double rendering with input)
            if (!(isEditingText && el.id === selectedElementId)) {
                ctx.fillText(el.texto, el.x, el.y);
            }
          } else if (el.tipo === 'flecha' && el.x2 !== undefined && el.y2 !== undefined) {
            // Draw Arrow based on type
            const headLength = 15;
            const arrowType = el.arrowType || 'solid';
            
            // Calculate angle for arrow head based on type
            let headAngle: number;
            let cpX: number | undefined;
            let cpY: number | undefined;
            
            if (arrowType === 'curved') {
              const dx = el.x2 - el.x;
              const dy = el.y2 - el.y;
              cpX = el.cpX ?? ((el.x + el.x2) / 2 - dy * 0.3);
              cpY = el.cpY ?? ((el.y + el.y2) / 2 + dx * 0.3);
              headAngle = Math.atan2(el.y2 - cpY, el.x2 - cpX);
            } else {
              headAngle = Math.atan2(el.y2 - el.y, el.x2 - el.x);
            }
            
            // Calculate shortened endpoint (line stops before arrow head)
            const shortenBy = headLength * 0.7;
            const endX = el.x2 - shortenBy * Math.cos(headAngle);
            const endY = el.y2 - shortenBy * Math.sin(headAngle);
            
            ctx.save();
            ctx.strokeStyle = el.color || 'yellow';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (arrowType === 'solid') {
              // Straight line - shortened
              ctx.beginPath();
              ctx.moveTo(el.x, el.y);
              ctx.lineTo(endX, endY);
              ctx.stroke();
            } else if (arrowType === 'curved') {
              // Curved line - we draw to a point slightly before the end
              ctx.beginPath();
              ctx.moveTo(el.x, el.y);
              ctx.quadraticCurveTo(cpX!, cpY!, endX, endY);
              ctx.stroke();
            } else if (arrowType === 'dashed') {
              // Dashed line - shortened
              ctx.setLineDash([12, 8]);
              ctx.beginPath();
              ctx.moveTo(el.x, el.y);
              ctx.lineTo(endX, endY);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (arrowType === 'zigzag') {
              // Zigzag pattern
              const dx = el.x2 - el.x;
              const dy = el.y2 - el.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const segments = Math.max(4, Math.floor(distance / 20));
              const perpX = -dy / distance * 8;
              const perpY = dx / distance * 8;
              
              ctx.beginPath();
              ctx.moveTo(el.x, el.y);
              
              for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const baseX = el.x + dx * t;
                const baseY = el.y + dy * t;
                const offsetMultiplier = (i % 2 === 0) ? 1 : -1;
                ctx.lineTo(baseX + perpX * offsetMultiplier, baseY + perpY * offsetMultiplier);
              }
              ctx.lineTo(endX, endY);
              ctx.stroke();
            }
            
            ctx.restore();

            // Arrow head at actual endpoint
            ctx.beginPath();
            ctx.moveTo(el.x2, el.y2);
            ctx.lineTo(el.x2 - headLength * Math.cos(headAngle - Math.PI / 6), el.y2 - headLength * Math.sin(headAngle - Math.PI / 6));
            ctx.lineTo(el.x2 - headLength * Math.cos(headAngle + Math.PI / 6), el.y2 - headLength * Math.sin(headAngle + Math.PI / 6));
            ctx.lineTo(el.x2, el.y2);
            ctx.fillStyle = el.color || 'yellow';
            ctx.fill();
          }

          // Selection box
          if (el.id === selectedElementId) {
             const w = el.width || (el.tipo === 'texto' ? (el.texto?.length || 0) * (el.fontSize || 20) * 0.6 + 20 : 40);
             const h = el.height || (el.tipo === 'texto' ? (el.fontSize || 20) + 10 : 40);
             const x = el.x;
             const y = el.y;
             
             if (el.tipo === 'flecha') {
                // Draw handles for arrow
                ctx.fillStyle = '#e74c3c';
                
                // Start handle
                ctx.beginPath();
                ctx.arc(el.x, el.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                
                // End handle
                ctx.beginPath();
                ctx.arc(el.x2 || 0, el.y2 || 0, 6, 0, 2 * Math.PI);
                ctx.fill();
                
                // Control point handle for curved arrows
                if (el.arrowType === 'curved') {
                    const dx = (el.x2 || 0) - el.x;
                    const dy = (el.y2 || 0) - el.y;
                    const cpX = el.cpX ?? ((el.x + (el.x2 || 0)) / 2 - dy * 0.3);
                    const cpY = el.cpY ?? ((el.y + (el.y2 || 0)) / 2 + dx * 0.3);
                    
                    // Draw line from midpoint to control point
                    ctx.save();
                    ctx.setLineDash([3, 3]);
                    ctx.strokeStyle = 'rgba(52, 152, 219, 0.7)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo((el.x + (el.x2 || 0)) / 2, (el.y + (el.y2 || 0)) / 2);
                    ctx.lineTo(cpX, cpY);
                    ctx.stroke();
                    ctx.restore();
                    
                    // Control point circle (blue)
                    ctx.fillStyle = '#3498db';
                    ctx.beginPath();
                    ctx.arc(cpX, cpY, 7, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                // Dashed line indicator
                ctx.save();
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(el.x, el.y);
                ctx.lineTo(el.x2 || 0, el.y2 || 0);
                ctx.stroke();
                ctx.restore();
             } else if (el.tipo === 'imagen') {
                // Selection box with rotation support
                ctx.save();
                ctx.translate(x, y);
                if (el.rotation) ctx.rotate(el.rotation);
                
                // Selection border
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 2;
                ctx.strokeRect(-w/2, -h/2, w, h);
                
                // Rotation handle (circle above element)
                ctx.fillStyle = '#9b59b6';
                ctx.beginPath();
                ctx.arc(0, -h/2 - 25, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Line connecting to rotation handle
                ctx.beginPath();
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = 'rgba(155, 89, 182, 0.7)';
                ctx.moveTo(0, -h/2);
                ctx.lineTo(0, -h/2 - 17);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Scale handle (bottom-right corner)
                ctx.fillStyle = '#3498db';
                ctx.fillRect(w/2 - 8, h/2 - 8, 12, 12);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.strokeRect(w/2 - 8, h/2 - 8, 12, 12);
                
                ctx.restore();
             } else {
                 ctx.strokeStyle = '#e74c3c';
                 ctx.lineWidth = 2;
                 ctx.strokeRect(x - w/2, y - h/2, w, h);
             }
          }
        });
    };

    if (bg.complete) {
        drawContent();
    } else {
        bg.onload = drawContent;
    }
  };

  // --- Event Handlers ---
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get clientX/Y from either mouse or touch event
    let clientX: number, clientY: number;
    if ('touches' in e) {
      // Touch event
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        // For touchend, use changedTouches
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        return { x: 0, y: 0 };
      }
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    // Handle pending placement (mobile tap-to-place)
    if (pendingPlacement) {
      if (pendingPlacement.type === 'jugador') {
        setElements(prev => [...prev, {
          id: Date.now().toString(),
          tipo: 'jugador',
          x,
          y,
          width: 40,
          height: 40,
          color: pendingPlacement.data.color || selectedColor,
          number: pendingPlacement.data.number || selectedNumber,
          textColor: '#fff'
        }]);
      } else if (pendingPlacement.type === 'material' && pendingPlacement.data.imgSrc) {
        const img = new Image();
        img.src = pendingPlacement.data.imgSrc;
        img.onload = () => {
          let width = 40, height = 40;
          if (pendingPlacement.data.imgSrc?.includes("balon")) { width = 30; height = 30; }
          else if (pendingPlacement.data.imgSrc?.includes("porteria")) { width = 120; height = 60; }
          else if (pendingPlacement.data.imgSrc?.includes("cono")) { width = 35; height = 35; }
          
          setElements(prev => [...prev, {
            id: Date.now().toString(),
            tipo: 'imagen',
            x, y, width, height, img
          }]);
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

    // Check selection
    let foundId: string | null = null;
    let foundMode: 'move' | 'resizeStart' | 'resizeEnd' | 'resizeControl' | 'rotate' | 'scale' = 'move';

    // Iterate backwards (z-index)
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        let hit = false;
        
        if (el.tipo === 'imagen') {
            const w = el.width || 40;
            const h = el.height || 40;
            const rotation = el.rotation || 0;
            
            // Transform click coordinates relative to element center for rotated check
            const dx = x - el.x;
            const dy = y - el.y;
            // Rotate click point in opposite direction to check in local space
            const cos = Math.cos(-rotation);
            const sin = Math.sin(-rotation);
            const localX = dx * cos - dy * sin;
            const localY = dx * sin + dy * cos;
            
            // Check if currently selected - then check handles first
            if (el.id === selectedElementId) {
                // Check rotation handle (circle at 0, -h/2 - 25 in local space)
                const rotHandleX = 0;
                const rotHandleY = -h/2 - 25;
                const dRot = Math.sqrt((localX - rotHandleX)**2 + (localY - rotHandleY)**2);
                if (dRot < 12) {
                    hit = true;
                    foundMode = 'rotate';
                }
                
                // Check scale handle (bottom-right corner at w/2, h/2 in local space)
                if (!hit) {
                    const scaleHandleX = w/2;
                    const scaleHandleY = h/2;
                    const dScale = Math.sqrt((localX - scaleHandleX)**2 + (localY - scaleHandleY)**2);
                    if (dScale < 15) {
                        hit = true;
                        foundMode = 'scale';
                    }
                }
            }
            
            // Check body
            if (!hit) {
                hit = localX >= -w/2 && localX <= w/2 && localY >= -h/2 && localY <= h/2;
                if (hit) foundMode = 'move';
            }
        } else if (el.tipo === 'jugador') {
            const w = el.width || 40;
            const h = el.height || 40;
            hit = x >= el.x - w/2 && x <= el.x + w/2 && y >= el.y - h/2 && y <= el.y + h/2;
            if (hit) foundMode = 'move';
        } else if (el.tipo === 'texto') {
            const w = (el.texto?.length || 1) * (el.fontSize || 20) * 0.6 + 20;
            const h = (el.fontSize || 20) + 10;
            hit = x >= el.x - w/2 && x <= el.x + w/2 && y >= el.y - h/2 && y <= el.y + h/2;
            if (hit) foundMode = 'move';
        } else if (el.tipo === 'flecha') {
            // Check control point for curved arrows first
            if (el.arrowType === 'curved') {
                const dx = (el.x2 || 0) - el.x;
                const dy = (el.y2 || 0) - el.y;
                const cpX = el.cpX ?? ((el.x + (el.x2 || 0)) / 2 - dy * 0.3);
                const cpY = el.cpY ?? ((el.y + (el.y2 || 0)) / 2 + dx * 0.3);
                const dControl = Math.sqrt((x - cpX)**2 + (y - cpY)**2);
                if (dControl < 15) {
                    hit = true;
                    foundMode = 'resizeControl';
                }
            }
            
            if (!hit) {
                // Check start point
                const dStart = Math.sqrt((x - el.x)**2 + (y - el.y)**2);
                if (dStart < 15) {
                    hit = true;
                    foundMode = 'resizeStart';
                } else {
                    // Check end point
                    const dEnd = Math.sqrt((x - (el.x2||0))**2 + (y - (el.y2||0))**2);
                    if (dEnd < 15) {
                        hit = true;
                        foundMode = 'resizeEnd';
                    } else {
                        // Check body
                        const dist = pointToSegmentDistance(x, y, el.x, el.y, el.x2||0, el.y2||0);
                        if (dist < 10) {
                            hit = true;
                            foundMode = 'move';
                        }
                    }
                }
            }
        }

        if (hit) {
            foundId = el.id;
            break; // Stop at first found
        }
    }

    if (foundId) {
        setSelectedElementId(foundId);
        setDragMode(foundMode);
        
        // If clicking a new element (or the same one), ensure we are not in edit mode unless confirmed
        setIsEditingText(false);

        const el = elements.find(e => e.id === foundId)!;
        
        if (foundMode === 'move') {
            setDragOffset({ x: x - el.x, y: y - el.y });
        }
        setIsDragging(true);
    } else {
        setSelectedElementId(null);
        setIsEditingText(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      const { x, y } = getCanvasCoords(e);
      // Check if we double-clicked text
      const el = elements.find(el => el.id === selectedElementId);
      if (el && el.tipo === 'texto') {
          // Check hit again just to be safe or valid bounds
          const w = (el.texto?.length || 1) * (el.fontSize || 20) * 0.6 + 20;
          const h = (el.fontSize || 20) + 10;
          if (x >= el.x - w/2 && x <= el.x + w/2 && y >= el.y - h/2 && y <= el.y + h/2) {
              setIsEditingText(true);
              setIsDragging(false); // Stop dragging if we enter edit mode
          }
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (isDrawingArrow && arrowStart) {
        // Optional: Live preview could be added here
        return;
    }

    if (isDragging && selectedElementId) {
        setElements(prev => prev.map(el => {
            if (el.id === selectedElementId) {
                if (dragMode === 'move') {
                    if (el.tipo === 'flecha') {
                        // Move entire arrow
                        const dx = x - dragOffset.x - el.x;
                        const dy = y - dragOffset.y - el.y;
                        return { 
                            ...el, 
                            x: x - dragOffset.x, 
                            y: y - dragOffset.y, 
                            x2: (el.x2 || 0) + dx, 
                            y2: (el.y2 || 0) + dy 
                        };
                    }
                    return { ...el, x: x - dragOffset.x, y: y - dragOffset.y };
                } else if (dragMode === 'resizeStart' && el.tipo === 'flecha') {
                    return { ...el, x: x, y: y };
                } else if (dragMode === 'resizeEnd' && el.tipo === 'flecha') {
                     return { ...el, x2: x, y2: y };
                } else if (dragMode === 'resizeControl' && el.tipo === 'flecha') {
                     return { ...el, cpX: x, cpY: y };
                } else if (dragMode === 'rotate' && el.tipo === 'imagen') {
                    // Calculate rotation angle from center to mouse
                    const angle = Math.atan2(y - el.y, x - el.x) + Math.PI / 2;
                    return { ...el, rotation: angle };
                } else if (dragMode === 'scale' && el.tipo === 'imagen') {
                    // Calculate new size based on distance from center
                    const dist = Math.sqrt((x - el.x) ** 2 + (y - el.y) ** 2);
                    const currentDiagonal = Math.sqrt((el.width || 40) ** 2 + (el.height || 40) ** 2) / 2;
                    const scaleFactor = dist / currentDiagonal;
                    const newWidth = Math.max(20, Math.min(300, (el.width || 40) * scaleFactor));
                    const newHeight = Math.max(20, Math.min(300, (el.height || 40) * scaleFactor));
                    return { ...el, width: newWidth, height: newHeight };
                }
            }
            return el;
        }));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDrawingArrow && arrowStart) {
        const { x, y } = getCanvasCoords(e);
        const newEl: CanvasElement = {
            id: Date.now().toString(),
            tipo: 'flecha',
            x: arrowStart.x,
            y: arrowStart.y,
            x2: x,
            y2: y,
            color: selectedArrowColor,
            arrowType: selectedArrowType,
            // Initialize control point for curved arrows
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
            newEl = {
                id: Date.now().toString(),
                tipo: 'linea',
                x: shapeStart.x,
                y: shapeStart.y,
                x2: x,
                y2: y,
                color: selectedShapeColor,
                strokeWidth: 3
            };
        } else if (selectedShapeTool === 'circulo') {
            const centerX = (shapeStart.x + x) / 2;
            const centerY = (shapeStart.y + y) / 2;
            const width = Math.abs(x - shapeStart.x);
            const height = Math.abs(y - shapeStart.y);
            newEl = {
                id: Date.now().toString(),
                tipo: 'circulo',
                x: centerX,
                y: centerY,
                width: Math.max(20, width),
                height: Math.max(20, height),
                color: selectedShapeColor,
                fillColor: selectedShapeColor,
                opacity: selectedShapeOpacity
            };
        } else {
            // zona (rectangle)
            const left = Math.min(shapeStart.x, x);
            const top = Math.min(shapeStart.y, y);
            const width = Math.abs(x - shapeStart.x);
            const height = Math.abs(y - shapeStart.y);
            newEl = {
                id: Date.now().toString(),
                tipo: 'zona',
                x: left,
                y: top,
                width: Math.max(20, width),
                height: Math.max(20, height),
                color: selectedShapeColor,
                fillColor: selectedShapeColor,
                opacity: selectedShapeOpacity
            };
        }
        
        const newElements = [...elements, newEl];
        setElements(newElements);
        saveToHistory(newElements);
        setIsDrawingShape(false);
        setShapeStart(null);
    }
    
    setIsDragging(false);
  };

  // Touch event handlers (for mobile support)
  // Note: preventDefault removed - 'touch-action: none' on canvas handles scroll prevention
  const handleTouchStart = (e: React.TouchEvent) => {
    handleMouseDown(e as unknown as React.MouseEvent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMouseMove(e as unknown as React.MouseEvent);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleMouseUp(e as unknown as React.MouseEvent);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const type = e.dataTransfer.getData('type');
    
    if (type === 'jugador') {
        const color = e.dataTransfer.getData('color') || selectedColor;
        const number = e.dataTransfer.getData('number') || selectedNumber;
        
        setElements(prev => [...prev, {
            id: Date.now().toString(),
            tipo: 'jugador',
            x,
            y,
            width: 40,
            height: 40,
            color,
            number,
            textColor: '#fff'
        }]);
    } else {
        const imgSrc = e.dataTransfer.getData('imgSrc');
        if (imgSrc) {
            const img = new Image();
            img.src = imgSrc;
            img.onload = () => {
                let width = 40; 
                let height = 40;
                
                if (imgSrc.includes("balon")) { 
                    width = 30; height = 30;
                } else if (imgSrc.includes("porteria")) {
                    width = 120; height = 60;
                } else if (imgSrc.includes("cono")) {
                    width = 35; height = 35;
                }
                
                setElements(prev => [...prev, {
                    id: Date.now().toString(),
                    tipo: 'imagen',
                    img,
                    x,
                    y,
                    width,
                    height
                }]);
            };
        }
    }
  };

  const handleDelete = () => {
    if (selectedElementId) {
        setElements(prev => prev.filter(e => e.id !== selectedElementId));
        setSelectedElementId(null);
    }
  };

  const handleAddText = () => {
    setElements(prev => [...prev, {
        id: Date.now().toString(),
        tipo: 'texto',
        x: LOGICAL_WIDTH / 2,
        y: LOGICAL_HEIGHT / 2,
        texto: 'Texto',
        fontSize: 40, // Larger text for high res
        color: 'white'
    }]);
    setActiveTab(null);
  };

  return (
    <div id="canvas-container" className="canvas-editor-container" style={{ 
        display: 'flex', 
        flexDirection: 'row',
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: '#1a1a1a', 
        zIndex: 2000,
        padding: 0
    }}>
      
      {/* TOOLBAR - Left sidebar */}
      <div className="canvas-editor-toolbar" style={{
          width: '80px',
          minWidth: '80px',
          background: '#2c3e50',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0',
          gap: '1.5rem',
          zIndex: 30,
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
      }}>
        <button onClick={() => { setActiveTab(null); setSelectedElementId(null); setPendingPlacement(null); }} className={`tool-btn ${activeTab === null && !pendingPlacement ? 'active' : ''}`} title="Seleccionar/Mover">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(-10deg)' }}>
            <path d="M5 3L5 18L9 14L12 21L15 20L12 13L18 13L5 3Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </button>
        <button onClick={() => setActiveTab(activeTab === 'personas' ? null : 'personas')} className={`tool-btn ${activeTab === 'personas' ? 'active' : ''}`} title="Jugadores">👥</button>
        <button onClick={() => setActiveTab(activeTab === 'materiales' ? null : 'materiales')} className={`tool-btn ${activeTab === 'materiales' ? 'active' : ''}`} title="Materiales">🏗️</button>
        <button onClick={handleAddText} className="tool-btn" title="Texto">✍️</button>
        <button onClick={() => setActiveTab(activeTab === 'flecha' ? null : 'flecha')} className={`tool-btn ${activeTab === 'flecha' ? 'active' : ''}`} title="Flecha">↗️</button>
        <button onClick={() => setActiveTab(activeTab === 'formas' ? null : 'formas')} className={`tool-btn ${activeTab === 'formas' ? 'active' : ''}`} title="Formas">⬜</button>
        
        <div style={{ flex: 1 }}></div>
        
        <button onClick={handleUndo} className="tool-btn" title="Deshacer (Ctrl+Z)" style={{ fontSize: '1.2rem' }}>↩️</button>
        <button onClick={handleRedo} className="tool-btn" title="Rehacer (Ctrl+Y)" style={{ fontSize: '1.2rem' }}>↪️</button>
        <button onClick={handleExportPNG} className="tool-btn" title="Exportar PNG" style={{ fontSize: '1.2rem' }}>📥</button>
      </div>

      {/* CENTER - CANVAS */}
      <div ref={containerRef} className="canvas-editor-area" style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          background: '#121212'
      }}>
        {/* Pending placement indicator */}
        {pendingPlacement && (
          <div className="canvas-pending-indicator">
            👆 Toca en el campo para colocar
          </div>
        )}
        
        <canvas
            ref={canvasRef}
            width={LOGICAL_WIDTH}
            height={LOGICAL_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                aspectRatio: `${LOGICAL_WIDTH}/${LOGICAL_HEIGHT}`,
                boxShadow: pendingPlacement ? '0 0 20px #27ae60' : '0 0 30px rgba(0,0,0,0.5)',
                cursor: pendingPlacement ? 'crosshair' : (activeTab === 'flecha' || activeTab === 'formas') ? 'crosshair' : 'default',
                touchAction: 'none', // Prevent browser gestures
                border: pendingPlacement ? '3px solid #27ae60' : 'none'
            }} 
        />
        
        {/* Popups for Tools - Now using CSS class for responsive positioning */}
        {activeTab === 'personas' && (
            <div className="canvas-tool-popup" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ color: 'white', fontSize: '0.9rem', textAlign: 'center' }}>Toca el jugador y luego el campo</div>
               
               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                 <label style={{ color: 'white', fontSize: '0.9rem' }}>Color:</label>
                 <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)} style={{ border: 'none', width: '45px', height: '45px', cursor: 'pointer', borderRadius: '50%', overflow: 'hidden' }} />
               </div>

               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                 <label style={{ color: 'white', fontSize: '0.9rem' }}>Dorsal:</label>
                 <input type="text" value={selectedNumber} onChange={e => setSelectedNumber(e.target.value)} style={{ width: '55px', padding: '10px', borderRadius: '8px', border: 'none', textAlign: 'center', fontSize: '1.1rem' }} maxLength={2} />
               </div>

               <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <div 
                        draggable
                        onDragStart={(e: React.DragEvent) => {
                            e.dataTransfer.setData('type', 'jugador');
                            e.dataTransfer.setData('color', selectedColor);
                            e.dataTransfer.setData('number', selectedNumber);
                        }}
                        onClick={() => {
                            setPendingPlacement({ type: 'jugador', data: { color: selectedColor, number: selectedNumber } });
                            setActiveTab(null);
                        }}
                        style={{ 
                            width: '55px', 
                            height: '55px', 
                            background: selectedColor, 
                            borderRadius: '50%', 
                            border: '3px solid white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.3rem'
                        }}
                    >
                        {selectedNumber}
                    </div>
               </div>

               <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                   {['jugadora2.png', 'jugador1.png', 'jugadora1.png', 'jugador2.png'].map(src => (
                       <div key={src} style={{ display: 'flex', justifyContent: 'center' }}>
                            <img 
                              src={`/img/${src}`} 
                              draggable
                              onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.dataTransfer.setData('imgSrc', e.currentTarget.src)}
                              onClick={() => {
                                  setPendingPlacement({ type: 'material', data: { imgSrc: `/img/${src}` } });
                                  setActiveTab(null);
                              }}
                              style={{ width: '45px', cursor: 'pointer', padding: '4px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)' }} 
                            />
                       </div>
                   ))}
               </div>
               
               <button 
                 onClick={() => setActiveTab(null)} 
                 style={{ padding: '0.75rem', background: '#e74c3c', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
               >
                 ✕ Cerrar
               </button>
            </div>
        )}

        {activeTab === 'materiales' && (
            <div className="canvas-tool-popup" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ color: 'white', fontSize: '0.9rem', textAlign: 'center' }}>Toca un material y luego el campo</div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                 {['balon.png', 'cono.png', 'porteria.png', 'cono-chincheta.png', 'valla.png', 'escalera.png', 'aro.png', 'posta.png', 'barrera.png'].map(src => (
                   <div key={src} style={{ display: 'flex', justifyContent: 'center' }}>
                       <img 
                         src={`/img/${src}`} 
                         draggable
                         onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.dataTransfer.setData('imgSrc', e.currentTarget.src)}
                         onClick={() => {
                             setPendingPlacement({ type: 'material', data: { imgSrc: `/img/${src}` } });
                             setActiveTab(null);
                         }}
                         style={{ width: '50px', cursor: 'pointer', padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }} 
                       />
                   </div>
                 ))}
               </div>
               
               <button 
                 onClick={() => setActiveTab(null)} 
                 style={{ padding: '0.75rem', background: '#e74c3c', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
               >
                 ✕ Cerrar
               </button>
            </div>
        )}

        {activeTab === 'flecha' && (
            <div className="canvas-tool-popup" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>Tipo de flecha:</span>
                
                {[
                    { type: 'solid' as const, label: 'Recta', icon: '➡️' },
                    { type: 'curved' as const, label: 'Curva', icon: '↪️' },
                    { type: 'dashed' as const, label: 'Discontinua', icon: '➖➖' },
                    { type: 'zigzag' as const, label: 'Zigzag', icon: '⚡' }
                ].map(({ type, label, icon }) => (
                    <button
                        key={type}
                        onClick={() => setSelectedArrowType(type)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: selectedArrowType === type ? '2px solid #3498db' : '2px solid transparent',
                            background: selectedArrowType === type ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
                
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>Color:</span>
                    <input 
                        type="color" 
                        value={selectedArrowColor} 
                        onChange={e => setSelectedArrowColor(e.target.value)} 
                        style={{ width: '45px', height: '35px', border: 'none', cursor: 'pointer', borderRadius: '6px', background: 'transparent' }} 
                    />
                    <div style={{ width: '60px', height: '5px', background: selectedArrowColor, borderRadius: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}></div>
                </div>
                
                <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        Arrastra en el campo para dibujar
                    </span>
                </div>
                
                <button 
                  onClick={() => setActiveTab(null)} 
                  style={{ padding: '0.75rem', background: '#e74c3c', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
                >
                  ✕ Cerrar
                </button>
            </div>
        )}

        {activeTab === 'formas' && (
            <div className="canvas-tool-popup" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>Tipo de forma:</span>
                
                {[
                    { type: 'zona' as const, label: 'Zona/Área', icon: '⬜' },
                    { type: 'linea' as const, label: 'Línea', icon: '━' },
                    { type: 'circulo' as const, label: 'Círculo', icon: '⭕' }
                ].map(({ type, label, icon }) => (
                    <button
                        key={type}
                        onClick={() => setSelectedShapeTool(type)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: selectedShapeTool === type ? '2px solid #3498db' : '2px solid transparent',
                            background: selectedShapeTool === type ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
                
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>Color:</span>
                    <input 
                        type="color" 
                        value={selectedShapeColor} 
                        onChange={e => setSelectedShapeColor(e.target.value)} 
                        style={{ width: '45px', height: '35px', border: 'none', cursor: 'pointer', borderRadius: '6px', background: 'transparent' }} 
                    />
                    <div style={{ width: '30px', height: '30px', background: selectedShapeColor, borderRadius: '6px', opacity: selectedShapeOpacity, border: '2px solid white' }}></div>
                </div>
                
                {selectedShapeTool !== 'linea' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: '0.9rem' }}>Opacidad:</span>
                        <input 
                            type="range" 
                            min="0.1" 
                            max="1" 
                            step="0.1"
                            value={selectedShapeOpacity} 
                            onChange={e => setSelectedShapeOpacity(parseFloat(e.target.value))} 
                            style={{ flex: 1, maxWidth: '80px' }} 
                        />
                        <span style={{ color: 'white', fontSize: '0.8rem' }}>{Math.round(selectedShapeOpacity * 100)}%</span>
                    </div>
                )}
                
                <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        Arrastra en el campo para dibujar
                    </span>
                </div>
                
                <button 
                  onClick={() => setActiveTab(null)} 
                  style={{ padding: '0.75rem', background: '#e74c3c', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
                >
                  ✕ Cerrar
                </button>
            </div>
        )}

        {/* FLOATING OVERLAYS */}
        {selectedElementId && (() => {
            const el = elements.find(e => e.id === selectedElementId);
            if (!el) return null;

            // Calculate screen position relative to viewport (since we use fixed position for toolbar, or absolute relative to container)
            // Actually container is relative. Canvas is inside. 
            // Let's use absolute positioning relative to the container which has overflow hidden?
            // No, container has relative.
            // But we calculated offset based on viewport (rect.left/top).
            // If we render outside container, we use fixed. If inside, absolute.
            // Let's render absolute inside containerRef, but we need to subtract container position?
            // Simpler: Render fixed using the calculated rects + element position.
            
            const screenX = offset.x + el.x * scale;
            const screenY = offset.y + el.y * scale;

            // Only show toolbar for elements with specific inline properties (Text, Player, Image)
            if (el.tipo !== 'texto' && el.tipo !== 'jugador' && el.tipo !== 'imagen') return null;

            return (
                <>
                    {/* Floating Toolbar */}
                    <div style={{
                        position: 'fixed',
                        top: screenY - 90, // Above element - more space to prevent drag collision
                        left: screenX,
                        transform: 'translateX(-50%)',
                        background: 'white',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        display: 'flex',
                        gap: '0.5rem',
                        zIndex: 100,
                        alignItems: 'center'
                    }}>
                        {el.tipo === 'texto' && (
                            <>
                                <input 
                                    type="color" 
                                    value={el.color || '#ffffff'} 
                                    onChange={e => updateSelectedElement({ color: e.target.value })} 
                                    style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer', background: 'transparent' }} 
                                />
                                <div style={{ width: '1px', height: '20px', background: '#ccc' }}></div>
                                <span style={{ fontSize: '12px', color: '#333' }}>Aa</span>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="100" 
                                    value={el.fontSize || 20} 
                                    onChange={e => updateSelectedElement({ fontSize: Number(e.target.value) })} 
                                    style={{ width: '80px' }}
                                />
                            </>
                        )}
                        
                        {el.tipo === 'jugador' && (
                             <>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#333' }}>Camiseta</span>
                                    <input 
                                        type="color" 
                                        value={el.color || '#3498db'} 
                                        onChange={e => updateSelectedElement({ color: e.target.value })} 
                                        style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer', background: 'transparent' }} 
                                    />
                                </div>
                                <div style={{ width: '1px', height: '20px', background: '#ccc' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#333' }}>Dorsal</span>
                                    <input 
                                        type="text" 
                                        value={el.number || ''} 
                                        onChange={e => updateSelectedElement({ number: e.target.value })} 
                                        style={{ width: '30px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px' }}
                                        maxLength={2}
                                    />
                                </div>
                                 <div style={{ width: '1px', height: '20px', background: '#ccc' }}></div>
                                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#333' }}>Color N.</span>
                                    <input 
                                        type="color" 
                                        value={el.textColor || '#ffffff'} 
                                        onChange={e => updateSelectedElement({ textColor: e.target.value })} 
                                        style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer', background: 'transparent' }} 
                                    />
                                </div>
                            </>
                        )}
                        
                        {el.tipo === 'imagen' && (
                            <>
                                <button 
                                    onClick={() => updateSelectedElement({ flipped: !el.flipped })}
                                    style={{ 
                                        padding: '6px 10px', 
                                        background: el.flipped ? '#3498db' : '#ecf0f1',
                                        color: el.flipped ? 'white' : '#333',
                                        border: 'none', 
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Voltear horizontalmente"
                                >
                                    ↔️ Flip
                                </button>
                                <div style={{ width: '1px', height: '20px', background: '#ccc' }}></div>
                                <button 
                                    onClick={() => updateSelectedElement({ rotation: 0 })}
                                    style={{ 
                                        padding: '6px 10px', 
                                        background: '#ecf0f1',
                                        color: '#333',
                                        border: 'none', 
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                    title="Resetear rotación"
                                >
                                    🔄 Reset
                                </button>
                                <div style={{ width: '1px', height: '20px', background: '#ccc' }}></div>
                                <button 
                                    onClick={() => updateSelectedElement({ rotation: (el.rotation || 0) + Math.PI / 2 })}
                                    style={{ 
                                        padding: '6px 10px', 
                                        background: '#ecf0f1',
                                        color: '#333',
                                        border: 'none', 
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    title="Rotar 90°"
                                >
                                    ↻ 90°
                                </button>
                            </>
                        )}
                    </div>

                    {/* Inline Text Editor */}
                    {isEditingText && el.tipo === 'texto' && (
                        <input
                            type="text"
                            value={el.texto || ''}
                            onChange={e => updateSelectedElement({ texto: e.target.value })}
                            onBlur={() => setIsEditingText(false)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') setIsEditingText(false);
                            }}
                            style={{
                                position: 'fixed',
                                top: screenY,
                                left: screenX,
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${(el.fontSize || 20) * scale}px`,
                                color: el.color || 'white',
                                background: 'transparent', // Transparent background to look like part of canvas
                                border: '1px dashed rgba(255,255,255,0.5)',
                                textAlign: 'center',
                                outline: 'none',
                                width: `${(el.texto?.length || 1) * (el.fontSize || 20) * scale * 0.8 + 20}px`, // Approximate width
                                zIndex: 99,
                                fontWeight: 'bold',
                                fontFamily: 'Arial'
                            }}
                            autoFocus
                        />
                    )}
                </>
            );
        })()}
      </div>

      {/* RIGHT SIDEBAR - ACTIONS */}
      <div className="canvas-action-buttons" style={{
          width: '80px',
          minWidth: '80px',
          background: '#2c3e50',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0',
          gap: '1.5rem',
          zIndex: 30,
          boxShadow: '-2px 0 10px rgba(0,0,0,0.3)'
      }}>
         <button onClick={() => canvasRef.current && onSave(canvasRef.current.toDataURL('image/png'))} style={{ background: '#2ecc71', color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem' }} title="Guardar">💾</button>
         <button onClick={onClose} style={{ background: '#e74c3c', color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem' }} title="Cancelar">❌</button>
         
         {selectedElementId && (
            <button onClick={handleDelete} style={{ background: '#95a5a6', color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', marginTop: 'auto' }} title="Borrar">🗑</button>
         )}
      </div>

    </div>
  );
};

export default CanvasEditor;
