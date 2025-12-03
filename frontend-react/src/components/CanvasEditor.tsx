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
  const [activeTab, setActiveTab] = useState<'personas' | 'materiales' | 'texto' | 'flecha' | null>(null);
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number, y: number } | null>(null);

  // Sync elements to parent whenever they change
  useEffect(() => {
    onUpdateElements(elements);
  }, [elements, onUpdateElements]);

  // Redraw when elements or selection changes
  useEffect(() => {
    drawCanvas();
  }, [elements, selectedElementId]);

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

        // Draw Elements
        elements.forEach(el => {
          if (el.tipo === 'imagen' && el.img) {
            ctx.drawImage(el.img, el.x - (el.width || 0) / 2, el.y - (el.height || 0) / 2, el.width || 0, el.height || 0);
            if (el.id === selectedElementId) {
              ctx.strokeStyle = '#e74c3c';
              ctx.lineWidth = 2;
              ctx.strokeRect(el.x - (el.width || 0) / 2, el.y - (el.height || 0) / 2, el.width || 0, el.height || 0);
            }
          } else if (el.tipo === 'texto' && el.texto) {
            ctx.font = `bold ${el.fontSize}px Arial`;
            ctx.fillStyle = el.color || 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(el.texto, el.x, el.y);
            
            if (el.id === selectedElementId) {
                const metrics = ctx.measureText(el.texto);
                const w = metrics.width;
                const h = el.fontSize || 20;
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 1;
                ctx.strokeRect(el.x - w/2 - 5, el.y - h/2 - 5, w + 10, h + 10);
            }
          } else if (el.tipo === 'flecha' && el.x2 !== undefined && el.y2 !== undefined) {
            // Draw Arrow
            const headLength = 15;
            const angle = Math.atan2(el.y2 - el.y, el.x2 - el.x);
            
            ctx.beginPath();
            ctx.moveTo(el.x, el.y);
            ctx.lineTo(el.x2, el.y2);
            ctx.strokeStyle = el.color || 'yellow';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Arrow head
            ctx.beginPath();
            ctx.moveTo(el.x2, el.y2);
            ctx.lineTo(el.x2 - headLength * Math.cos(angle - Math.PI / 6), el.y2 - headLength * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(el.x2 - headLength * Math.cos(angle + Math.PI / 6), el.y2 - headLength * Math.sin(angle + Math.PI / 6));
            ctx.lineTo(el.x2, el.y2);
            ctx.fillStyle = el.color || 'yellow';
            ctx.fill();

            if (el.id === selectedElementId) {
                ctx.beginPath();
                ctx.arc(el.x, el.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#e74c3c';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(el.x2, el.y2, 5, 0, 2 * Math.PI);
                ctx.fill();
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
  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (activeTab === 'flecha') {
        setIsDrawingArrow(true);
        setArrowStart({ x, y });
        setSelectedElementId(null);
        return;
    }

    // Check selection
    let found = false;
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        let hit = false;
        if (el.tipo === 'imagen') {
            const w = el.width || 0;
            const h = el.height || 0;
            hit = x >= el.x - w/2 && x <= el.x + w/2 && y >= el.y - h/2 && y <= el.y + h/2;
        } else if (el.tipo === 'texto') {
            hit = x >= el.x - 50 && x <= el.x + 50 && y >= el.y - 15 && y <= el.y + 15; 
        } else if (el.tipo === 'flecha') {
            const d1 = Math.sqrt((x - el.x)**2 + (y - el.y)**2);
            const d2 = Math.sqrt((x - (el.x2||0))**2 + (y - (el.y2||0))**2);
            hit = d1 < 20 || d2 < 20;
        }

        if (hit) {
            setSelectedElementId(el.id);
            setDragOffset({ x: x - el.x, y: y - el.y });
            setIsDragging(true);
            found = true;
            break;
        }
    }

    if (!found) {
        setSelectedElementId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (isDrawingArrow && arrowStart) {
        // Optional: Implement live preview here
        return;
    }

    if (isDragging && selectedElementId) {
        setElements(prev => prev.map(el => {
            if (el.id === selectedElementId) {
                if (el.tipo === 'flecha') {
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
            color: 'yellow'
        };
        setElements(prev => [...prev, newEl]);
        setIsDrawingArrow(false);
        setArrowStart(null);
    }
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const imgSrc = e.dataTransfer.getData('imgSrc');
    
    if (imgSrc) {
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => {
            // Logical sizes based on 1219x765 resolution
            let width = 40; 
            let height = 40;
            
            if (imgSrc.includes("jugador")) { 
                width = 80; height = 80; // Players larger
            } else if (imgSrc.includes("balon")) { 
                width = 30; height = 30; // Ball smaller
            } else if (imgSrc.includes("porteria")) {
                width = 120; height = 60; // Goal larger
            } else if (imgSrc.includes("cono")) {
                width = 35; height = 35; // Cones smaller
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
    <div id="canvas-container" style={{ 
        display: 'flex', 
        flexDirection: 'row', // Horizontal layout
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: '#1a1a1a', 
        zIndex: 2000,
        padding: 0
    }}>
      
      {/* LEFT SIDEBAR - TOOLS */}
      <div className="sidebar-left" style={{
          width: '80px',
          background: '#2c3e50',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0',
          gap: '1.5rem',
          zIndex: 30,
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
      }}>
        <button onClick={() => setActiveTab(activeTab === 'personas' ? null : 'personas')} className={`tool-btn ${activeTab === 'personas' ? 'active' : ''}`} title="Jugadores">👥</button>
        <button onClick={() => setActiveTab(activeTab === 'materiales' ? null : 'materiales')} className={`tool-btn ${activeTab === 'materiales' ? 'active' : ''}`} title="Materiales">🏗️</button>
        <button onClick={handleAddText} className="tool-btn" title="Texto">✍️</button>
        <button onClick={() => setActiveTab(activeTab === 'flecha' ? null : 'flecha')} className={`tool-btn ${activeTab === 'flecha' ? 'active' : ''}`} title="Flecha">↗️</button>
      </div>

      {/* CENTER - CANVAS */}
      <div ref={containerRef} style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          background: '#121212'
      }}>
        <canvas
            ref={canvasRef}
            width={LOGICAL_WIDTH}
            height={LOGICAL_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                aspectRatio: `${LOGICAL_WIDTH}/${LOGICAL_HEIGHT}`,
                boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                cursor: activeTab === 'flecha' ? 'crosshair' : 'default'
            }} 
        />
        
        {/* Popups for Tools - Positioned relative to sidebar or center */}
        {activeTab === 'personas' && (
            <div className="tool-popup" style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem', // Near left sidebar
                background: 'rgba(44, 62, 80, 0.95)',
                padding: '1rem',
                borderRadius: '10px',
                display: 'flex',
                gap: '1rem',
                zIndex: 40,
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
               {['jugadora1.png', 'jugadora2.png', 'jugador1.png', 'jugador2.png'].map(src => (
                   <img key={src} src={`/img/${src}`} draggable onDragStart={e => e.dataTransfer.setData('imgSrc', e.currentTarget.src)} style={{ width: '50px', cursor: 'grab' }} />
               ))}
            </div>
        )}

        {activeTab === 'materiales' && (
            <div className="tool-popup" style={{
                position: 'absolute',
                top: '5rem',
                left: '1rem',
                background: 'rgba(44, 62, 80, 0.95)',
                padding: '1rem',
                borderRadius: '10px',
                display: 'flex',
                gap: '1rem',
                zIndex: 40,
                flexWrap: 'wrap',
                maxWidth: '300px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
               {['balon.png', 'cono.png', 'porteria.png', 'cono-chincheta.png', 'valla.png', 'escalera.png', 'aro.png', 'posta.png', 'barrera.png'].map(src => (
                   <img key={src} src={`/img/${src}`} draggable onDragStart={e => e.dataTransfer.setData('imgSrc', e.currentTarget.src)} style={{ width: '40px', cursor: 'grab' }} />
               ))}
            </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - ACTIONS */}
      <div className="sidebar-right" style={{
          width: '80px',
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
