import React from 'react';

interface CanvasActionButtonsProps {
  onSave: () => void;
  onClose: () => void;
  onDelete: () => void;
  hasSelection: boolean;
}

const btnStyle: React.CSSProperties = {
  border: 'none',
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  cursor: 'pointer',
  fontSize: '1.5rem',
  color: 'white'
};

const CanvasActionButtons: React.FC<CanvasActionButtonsProps> = ({ onSave, onClose, onDelete, hasSelection }) => (
  <div
    className="canvas-action-buttons"
    style={{
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
    }}
  >
    <button onClick={onSave} style={{ ...btnStyle, background: '#2ecc71' }} title="Guardar">💾</button>
    <button onClick={onClose} style={{ ...btnStyle, background: '#e74c3c' }} title="Cancelar">❌</button>
    {hasSelection && (
      <button onClick={onDelete} style={{ ...btnStyle, background: '#95a5a6', marginTop: 'auto' }} title="Borrar">🗑</button>
    )}
  </div>
);

export default CanvasActionButtons;
