import React from 'react';

type ActiveTab = 'personas' | 'materiales' | 'flecha' | 'formas' | null;
type ArrowType = 'solid' | 'curved' | 'dashed' | 'zigzag';
type ShapeTool = 'zona' | 'linea' | 'circulo';

interface PendingPlacement {
  type: 'jugador' | 'material';
  data: { color?: string; number?: string; imgSrc?: string };
}

interface CanvasToolPanelProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  selectedNumber: string;
  setSelectedNumber: (n: string) => void;
  setPendingPlacement: (p: PendingPlacement | null) => void;
  selectedArrowType: ArrowType;
  setSelectedArrowType: (t: ArrowType) => void;
  selectedArrowColor: string;
  setSelectedArrowColor: (c: string) => void;
  selectedShapeTool: ShapeTool;
  setSelectedShapeTool: (t: ShapeTool) => void;
  selectedShapeColor: string;
  setSelectedShapeColor: (c: string) => void;
  selectedShapeOpacity: number;
  setSelectedShapeOpacity: (o: number) => void;
  selectedLineWidth: number;
  setSelectedLineWidth: (w: number) => void;
}

const closeBtn: React.CSSProperties = {
  padding: '0.75rem',
  background: '#e74c3c',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '1rem'
};

const CanvasToolPanel: React.FC<CanvasToolPanelProps> = ({
  activeTab, setActiveTab,
  selectedColor, setSelectedColor,
  selectedNumber, setSelectedNumber,
  setPendingPlacement,
  selectedArrowType, setSelectedArrowType,
  selectedArrowColor, setSelectedArrowColor,
  selectedShapeTool, setSelectedShapeTool,
  selectedShapeColor, setSelectedShapeColor,
  selectedShapeOpacity, setSelectedShapeOpacity,
  selectedLineWidth, setSelectedLineWidth
}) => {
  if (!activeTab) return null;

  const close = () => setActiveTab(null);

  if (activeTab === 'personas') return (
    <div className="canvas-tool-popup" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ color: 'white', fontSize: '0.9rem', textAlign: 'center' }}>Toca el jugador y luego el campo</div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
        <label style={{ color: 'white', fontSize: '0.9rem' }}>Color:</label>
        <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)}
          style={{ border: 'none', width: '45px', height: '45px', cursor: 'pointer', borderRadius: '50%', overflow: 'hidden' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
        <label style={{ color: 'white', fontSize: '0.9rem' }}>Dorsal:</label>
        <input type="text" value={selectedNumber} onChange={e => setSelectedNumber(e.target.value)}
          style={{ width: '55px', padding: '10px', borderRadius: '8px', border: 'none', textAlign: 'center', fontSize: '1.1rem' }} maxLength={2} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <div
          draggable
          onDragStart={(e: React.DragEvent) => {
            e.dataTransfer.setData('type', 'jugador');
            e.dataTransfer.setData('color', selectedColor);
            e.dataTransfer.setData('number', selectedNumber);
          }}
          onClick={() => { setPendingPlacement({ type: 'jugador', data: { color: selectedColor, number: selectedNumber } }); close(); }}
          style={{ width: '55px', height: '55px', background: selectedColor, borderRadius: '50%', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: '1.3rem' }}
        >
          {selectedNumber}
        </div>
      </div>

      <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {['jugadora2.png', 'jugador1.png', 'jugadora1.png', 'jugador2.png'].map(src => (
          <div key={src} style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={`/img/${src}`}
              draggable
              onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.dataTransfer.setData('imgSrc', e.currentTarget.src)}
              onClick={() => { setPendingPlacement({ type: 'material', data: { imgSrc: `/img/${src}` } }); close(); }}
              style={{ width: '45px', cursor: 'pointer', padding: '4px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)' }}
            />
          </div>
        ))}
      </div>

      <button onClick={close} style={closeBtn}>✕ Cerrar</button>
    </div>
  );

  if (activeTab === 'materiales') return (
    <div className="canvas-tool-popup" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ color: 'white', fontSize: '0.9rem', textAlign: 'center' }}>Toca un material y luego el campo</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {['balon.png', 'cono.png', 'porteria.png', 'cono-chincheta.png', 'valla.png', 'escalera.png', 'aro.png', 'posta.png', 'barrera.png'].map(src => (
          <div key={src} style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={`/img/${src}`}
              draggable
              onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.dataTransfer.setData('imgSrc', e.currentTarget.src)}
              onClick={() => { setPendingPlacement({ type: 'material', data: { imgSrc: `/img/${src}` } }); close(); }}
              style={{ width: '50px', cursor: 'pointer', padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }}
            />
          </div>
        ))}
      </div>
      <button onClick={close} style={closeBtn}>✕ Cerrar</button>
    </div>
  );

  if (activeTab === 'flecha') {
    const arrowOptions: { type: ArrowType; label: string; icon: string }[] = [
      { type: 'solid', label: 'Recta', icon: '➡️' },
      { type: 'curved', label: 'Curva', icon: '↪️' },
      { type: 'dashed', label: 'Discontinua', icon: '➖➖' },
      { type: 'zigzag', label: 'Zigzag', icon: '⚡' }
    ];
    return (
      <div className="canvas-tool-popup" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>Tipo de flecha:</span>
        {arrowOptions.map(({ type, label, icon }) => (
          <button key={type} onClick={() => setSelectedArrowType(type)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: '8px',
            border: selectedArrowType === type ? '2px solid #3498db' : '2px solid transparent',
            background: selectedArrowType === type ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.1)',
            color: 'white', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '0.9rem' }}>Color:</span>
          <input type="color" value={selectedArrowColor} onChange={e => setSelectedArrowColor(e.target.value)}
            style={{ width: '45px', height: '35px', border: 'none', cursor: 'pointer', borderRadius: '6px', background: 'transparent' }} />
          <div style={{ width: '60px', height: '5px', background: selectedArrowColor, borderRadius: '3px' }} />
        </div>
        <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Arrastra en el campo para dibujar</span>
        </div>
        <button onClick={close} style={closeBtn}>✕ Cerrar</button>
      </div>
    );
  }

  if (activeTab === 'formas') {
    const shapeOptions: { type: ShapeTool; label: string; icon: string }[] = [
      { type: 'zona', label: 'Zona/Area', icon: '⬜' },
      { type: 'linea', label: 'Linea', icon: '━' },
      { type: 'circulo', label: 'Circulo', icon: '⭕' }
    ];
    return (
      <div className="canvas-tool-popup" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>Tipo de forma:</span>
        {shapeOptions.map(({ type, label, icon }) => (
          <button key={type} onClick={() => setSelectedShapeTool(type)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: '8px',
            border: selectedShapeTool === type ? '2px solid #3498db' : '2px solid transparent',
            background: selectedShapeTool === type ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.1)',
            color: 'white', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '0.9rem' }}>Color:</span>
          <input type="color" value={selectedShapeColor} onChange={e => setSelectedShapeColor(e.target.value)}
            style={{ width: '45px', height: '35px', border: 'none', cursor: 'pointer', borderRadius: '6px', background: 'transparent' }} />
          <div style={{ width: '30px', height: '30px', background: selectedShapeColor, borderRadius: '6px', opacity: selectedShapeOpacity, border: '2px solid white' }} />
        </div>
        {selectedShapeTool === 'linea' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '0.9rem' }}>Grosor:</span>
            <input type="range" min="1" max="20" step="1" value={selectedLineWidth}
              onChange={e => setSelectedLineWidth(parseInt(e.target.value))} style={{ flex: 1, maxWidth: '80px' }} />
            <span style={{ color: 'white', fontSize: '0.8rem' }}>{selectedLineWidth}px</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '0.9rem' }}>Opacidad:</span>
            <input type="range" min="0.1" max="1" step="0.1" value={selectedShapeOpacity}
              onChange={e => setSelectedShapeOpacity(parseFloat(e.target.value))} style={{ flex: 1, maxWidth: '80px' }} />
            <span style={{ color: 'white', fontSize: '0.8rem' }}>{Math.round(selectedShapeOpacity * 100)}%</span>
          </div>
        )}
        <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Arrastra en el campo para dibujar</span>
        </div>
        <button onClick={close} style={closeBtn}>✕ Cerrar</button>
      </div>
    );
  }

  return null;
};

export default CanvasToolPanel;
