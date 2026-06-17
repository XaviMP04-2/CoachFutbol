import React from 'react';

type ActiveTab = 'personas' | 'materiales' | 'texto' | 'flecha' | 'formas' | null;

interface CanvasToolbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onAddText: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportPNG: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasPendingPlacement: boolean;
  clearPendingPlacement: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTab,
  setActiveTab,
  onAddText,
  onUndo,
  onRedo,
  onExportPNG,
  canUndo,
  canRedo,
  hasPendingPlacement,
  clearPendingPlacement
}) => {
  const toggle = (tab: Exclude<ActiveTab, null>) =>
    setActiveTab(activeTab === tab ? null : tab);

  return (
    <div
      className="canvas-editor-toolbar"
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
        boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
      }}
    >
      {/* Select tool */}
      <button
        onClick={() => { setActiveTab(null); clearPendingPlacement(); }}
        className={`tool-btn ${activeTab === null && !hasPendingPlacement ? 'active' : ''}`}
        title="Seleccionar/Mover"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(-10deg)' }}>
          <path d="M5 3L5 18L9 14L12 21L15 20L12 13L18 13L5 3Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </button>

      <button onClick={() => toggle('personas')} className={`tool-btn ${activeTab === 'personas' ? 'active' : ''}`} title="Jugadores">👥</button>
      <button onClick={() => toggle('materiales')} className={`tool-btn ${activeTab === 'materiales' ? 'active' : ''}`} title="Materiales">🏗️</button>
      <button onClick={onAddText} className="tool-btn" title="Texto">✍️</button>
      <button onClick={() => toggle('flecha')} className={`tool-btn ${activeTab === 'flecha' ? 'active' : ''}`} title="Flecha">↗️</button>
      <button onClick={() => toggle('formas')} className={`tool-btn ${activeTab === 'formas' ? 'active' : ''}`} title="Formas">⬜</button>

      <div style={{ flex: 1 }} />

      <button onClick={onUndo} className="tool-btn" title="Deshacer (Ctrl+Z)" style={{ fontSize: '1.2rem', opacity: canUndo ? 1 : 0.4 }}>↩️</button>
      <button onClick={onRedo} className="tool-btn" title="Rehacer (Ctrl+Y)" style={{ fontSize: '1.2rem', opacity: canRedo ? 1 : 0.4 }}>↪️</button>
      <button onClick={onExportPNG} className="tool-btn" title="Exportar PNG" style={{ fontSize: '1.2rem' }}>📥</button>
    </div>
  );
};

export default CanvasToolbar;
