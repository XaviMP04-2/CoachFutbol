import React from 'react';
import type { CanvasElement } from '../../types';

interface CanvasPropertiesPanelProps {
  selectedElement: CanvasElement;
  scale: number;
  offset: { x: number; y: number };
  isEditingText: boolean;
  setIsEditingText: (v: boolean) => void;
  updateSelectedElement: (updates: Partial<CanvasElement>) => void;
}

const divider = <div style={{ width: '1px', height: '20px', background: '#ccc' }} />;

const CanvasPropertiesPanel: React.FC<CanvasPropertiesPanelProps> = ({
  selectedElement: el,
  scale,
  offset,
  isEditingText,
  setIsEditingText,
  updateSelectedElement
}) => {
  const screenX = offset.x + el.x * scale;
  const screenY = offset.y + el.y * scale;

  if (el.tipo !== 'texto' && el.tipo !== 'jugador' && el.tipo !== 'imagen') return null;

  return (
    <>
      {/* Floating toolbar above element */}
      <div style={{
        position: 'fixed',
        top: screenY - 90,
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
            <input type="color" value={el.color || '#ffffff'}
              onChange={e => updateSelectedElement({ color: e.target.value })}
              style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer', background: 'transparent' }} />
            {divider}
            <span style={{ fontSize: '12px', color: '#333' }}>Aa</span>
            <input type="range" min="10" max="100" value={el.fontSize || 20}
              onChange={e => updateSelectedElement({ fontSize: Number(e.target.value) })}
              style={{ width: '80px' }} />
          </>
        )}

        {el.tipo === 'jugador' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#333' }}>Camiseta</span>
              <input type="color" value={el.color || '#3498db'}
                onChange={e => updateSelectedElement({ color: e.target.value })}
                style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer', background: 'transparent' }} />
            </div>
            {divider}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#333' }}>Dorsal</span>
              <input type="text" value={el.number || ''}
                onChange={e => updateSelectedElement({ number: e.target.value })}
                style={{ width: '30px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px' }}
                maxLength={2} />
            </div>
            {divider}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#333' }}>Color N.</span>
              <input type="color" value={el.textColor || '#ffffff'}
                onChange={e => updateSelectedElement({ textColor: e.target.value })}
                style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer', background: 'transparent' }} />
            </div>
          </>
        )}

        {el.tipo === 'imagen' && (
          <>
            <button
              onClick={() => updateSelectedElement({ flipped: !el.flipped })}
              style={{ padding: '6px 10px', background: el.flipped ? '#3498db' : '#ecf0f1', color: el.flipped ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Voltear horizontalmente"
            >
              ↔️ Flip
            </button>
            {divider}
            <button
              onClick={() => updateSelectedElement({ rotation: 0 })}
              style={{ padding: '6px 10px', background: '#ecf0f1', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              title="Resetear rotación"
            >
              🔄 Reset
            </button>
            {divider}
            <button
              onClick={() => updateSelectedElement({ rotation: (el.rotation || 0) + Math.PI / 2 })}
              style={{ padding: '6px 10px', background: '#ecf0f1', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
              title="Rotar 90°"
            >
              ↻ 90°
            </button>
          </>
        )}
      </div>

      {/* Inline text editor */}
      {isEditingText && el.tipo === 'texto' && (
        <input
          type="text"
          value={el.texto || ''}
          onChange={e => updateSelectedElement({ texto: e.target.value })}
          onBlur={() => setIsEditingText(false)}
          onKeyDown={e => { if (e.key === 'Enter') setIsEditingText(false); }}
          style={{
            position: 'fixed',
            top: screenY,
            left: screenX,
            transform: 'translate(-50%, -50%)',
            fontSize: `${(el.fontSize || 20) * scale}px`,
            color: el.color || 'white',
            background: 'transparent',
            border: '1px dashed rgba(255,255,255,0.5)',
            textAlign: 'center',
            outline: 'none',
            width: `${(el.texto?.length || 1) * (el.fontSize || 20) * scale * 0.8 + 20}px`,
            zIndex: 99,
            fontWeight: 'bold',
            fontFamily: 'Arial'
          }}
          autoFocus
        />
      )}
    </>
  );
};

export default CanvasPropertiesPanel;
