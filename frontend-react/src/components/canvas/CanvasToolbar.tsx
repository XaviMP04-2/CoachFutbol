import React, { useEffect, useState } from 'react';
import type { FieldType, ViewMode } from './drawField';

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
  fieldType: FieldType;
  onFieldType: (t: FieldType) => void;
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
  zoom: number;
  onZoom: (z: number | ((prev: number) => number)) => void;
  onClearAll: () => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: string; color: string }[] = [
  { type: 'grass',  label: 'Césped',  icon: '🌿', color: '#207d15' },
  { type: 'indoor', label: 'Sala',    icon: '🏟️', color: '#105890' },
  { type: 'beach',  label: 'Arena',   icon: '🏖️', color: '#bc8a35' },
];

const VIEW_MODES: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'full',       label: 'Campo completo',  icon: '▬' },
  { mode: 'half-left',  label: 'Mitad izquierda', icon: '◧' },
  { mode: 'half-right', label: 'Mitad derecha',   icon: '◨' },
];

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTab, setActiveTab,
  onAddText, onUndo, onRedo, onExportPNG,
  canUndo, canRedo,
  hasPendingPlacement, clearPendingPlacement,
  fieldType, onFieldType,
  viewMode, onViewMode,
  zoom, onZoom,
  onClearAll,
}) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [showFieldPanel, setShowFieldPanel] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle = (tab: Exclude<ActiveTab, null>) =>
    setActiveTab(activeTab === tab ? null : tab);

  const zoomPct = Math.round(zoom * 100);

  // Current field type icon (shown on ⚙️ button)
  const currentFieldIcon = FIELD_TYPES.find(f => f.type === fieldType)?.icon ?? '🌿';
  const currentFieldColor = FIELD_TYPES.find(f => f.type === fieldType)?.color ?? '#207d15';

  const btn = (active = false, danger = false): React.CSSProperties => ({
    background: active ? 'rgba(82,170,255,0.18)' : danger ? 'rgba(220,50,50,0.1)' : 'transparent',
    border: active ? '1px solid rgba(82,170,255,0.5)' : danger ? '1px solid rgba(220,50,50,0.3)' : '1px solid transparent',
    borderRadius: '9px',
    color: danger ? '#ff7070' : 'white',
    cursor: 'pointer',
    fontSize: isMobile ? '1.25rem' : '1.1rem',
    padding: isMobile ? '0.6rem' : '0.45rem',
    minWidth: isMobile ? '44px' : '38px',
    minHeight: isMobile ? '44px' : '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
  });

  const divider = (
    <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.15rem 0', flexShrink: 0 }} />
  );

  // ── Shared field settings panel ──────────────────────────────────────
  const FieldSettingsPanel = ({ bottom }: { bottom?: boolean }) => (
    <div style={{
      position: 'fixed',
      ...(bottom
        ? { bottom: '68px', left: '50%', transform: 'translateX(-50%)', minWidth: '300px' }
        : { left: '64px', top: '1rem', minWidth: '280px' }),
      background: 'rgba(30,42,56,0.98)',
      border: '1px solid #34495e',
      borderRadius: '12px',
      padding: '1.1rem',
      zIndex: 3100,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Surface */}
      <div style={{ color: '#95a5a6', fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Superficie</div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {FIELD_TYPES.map(ft => (
          <button key={ft.type} onClick={() => onFieldType(ft.type)} style={{
            flex: 1, padding: '0.5rem 0.2rem', borderRadius: '8px', cursor: 'pointer',
            background: fieldType === ft.type ? ft.color : 'rgba(255,255,255,0.06)',
            border: fieldType === ft.type ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
            color: 'white', fontSize: '0.75rem', fontWeight: 600,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: '1rem' }}>{ft.icon}</span>{ft.label}
          </button>
        ))}
      </div>

      {/* View */}
      <div style={{ color: '#95a5a6', fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Vista del campo</div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {VIEW_MODES.map(vm => (
          <button key={vm.mode} onClick={() => onViewMode(vm.mode)} style={{
            flex: 1, padding: '0.5rem 0.15rem', borderRadius: '8px', cursor: 'pointer',
            background: viewMode === vm.mode ? 'rgba(82,170,255,0.2)' : 'rgba(255,255,255,0.06)',
            border: viewMode === vm.mode ? '1px solid rgba(82,170,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
            color: viewMode === vm.mode ? '#52aaff' : 'rgba(255,255,255,0.75)',
            fontSize: '0.72rem', fontWeight: 600,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: '1.1rem' }}>{vm.icon}</span>
            {vm.label.replace('Campo ', '').replace('Mitad ', '')}
          </button>
        ))}
      </div>

      {/* Zoom */}
      <div style={{ color: '#95a5a6', fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Zoom</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={() => onZoom(z => Math.max(0.4, +(z - 0.25).toFixed(2)))} style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>−</button>
        <span style={{ flex: 1, textAlign: 'center', color: '#ecf0f1', fontSize: '0.9rem', fontWeight: 700 }}>{zoomPct}%</span>
        <button onClick={() => onZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>+</button>
        <button onClick={() => onZoom(1)} style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#ecf0f1', cursor: 'pointer', fontSize: '0.75rem' }}>1:1</button>
      </div>

      {/* Clear all */}
      <button onClick={() => { onClearAll(); setShowFieldPanel(false); }} style={{
        width: '100%', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer',
        background: 'rgba(220,50,50,0.12)', border: '1px solid rgba(220,50,50,0.35)',
        color: '#ff7070', fontSize: '0.82rem', fontWeight: 600,
      }}>
        🗑️ Borrar todo el campo
      </button>
    </div>
  );

  // ── MOBILE: horizontal bar at bottom ──────────────────────────────────
  if (isMobile) {
    return (
      <>
        {showFieldPanel && <FieldSettingsPanel bottom />}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
          background: '#1e2a38', borderTop: '1px solid #2c3e50',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '0 0.3rem', zIndex: 30,
        }}>
          <button onClick={() => { setActiveTab(null); clearPendingPlacement(); setShowFieldPanel(false); }} style={btn(activeTab === null && !hasPendingPlacement)} title="Seleccionar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3L5 18L9 14L12 21L15 20L12 13L18 13L5 3Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => { toggle('personas'); setShowFieldPanel(false); }} style={btn(activeTab === 'personas')} title="Jugadores">👥</button>
          <button onClick={() => { toggle('materiales'); setShowFieldPanel(false); }} style={btn(activeTab === 'materiales')} title="Materiales">🏗️</button>
          <button onClick={() => { toggle('flecha'); setShowFieldPanel(false); }} style={btn(activeTab === 'flecha')} title="Flecha">↗️</button>
          <button onClick={() => { toggle('formas'); setShowFieldPanel(false); }} style={btn(activeTab === 'formas')} title="Formas">⬜</button>
          <button onClick={() => { onAddText(); setShowFieldPanel(false); }} style={btn()} title="Texto">✍️</button>
          <button onClick={() => setShowFieldPanel(v => !v)} style={btn(showFieldPanel)} title="Campo, zoom y más">⚙️</button>
          <button onClick={onUndo} style={{ ...btn(), opacity: canUndo ? 1 : 0.35 }} title="Deshacer">↩️</button>
          <button onClick={onRedo} style={{ ...btn(), opacity: canRedo ? 1 : 0.35 }} title="Rehacer">↪️</button>
        </div>
      </>
    );
  }

  // ── DESKTOP: compact vertical sidebar (~550px tall — fits any screen) ──
  return (
    <div style={{
      width: '54px', minWidth: '54px',
      background: '#1e2a38',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0.5rem 0',
      gap: '0.2rem',
      zIndex: 30,
      boxShadow: '2px 0 12px rgba(0,0,0,0.4)',
      overflowY: 'auto',
      overflowX: 'visible',
    }}>

      {showFieldPanel && <FieldSettingsPanel />}

      {/* ── Drawing tools (6) ── */}
      <button onClick={() => { setActiveTab(null); clearPendingPlacement(); setShowFieldPanel(false); }} style={btn(activeTab === null && !hasPendingPlacement)} title="Seleccionar/Mover">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 3L5 18L9 14L12 21L15 20L12 13L18 13L5 3Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      </button>
      <button onClick={() => { toggle('personas'); setShowFieldPanel(false); }} style={btn(activeTab === 'personas')} title="Jugadores">👥</button>
      <button onClick={() => { toggle('materiales'); setShowFieldPanel(false); }} style={btn(activeTab === 'materiales')} title="Materiales">🏗️</button>
      <button onClick={() => { onAddText(); setShowFieldPanel(false); }} style={btn()} title="Texto">✍️</button>
      <button onClick={() => { toggle('flecha'); setShowFieldPanel(false); }} style={btn(activeTab === 'flecha')} title="Flecha">↗️</button>
      <button onClick={() => { toggle('formas'); setShowFieldPanel(false); }} style={btn(activeTab === 'formas')} title="Formas">⬜</button>

      {divider}

      {/* ── Campo settings toggle — shows current surface icon ── */}
      <button
        onClick={() => setShowFieldPanel(v => !v)}
        title="Campo: superficie, vista, zoom"
        style={{
          ...btn(showFieldPanel),
          background: showFieldPanel ? currentFieldColor : `${currentFieldColor}33`,
          border: showFieldPanel ? `1px solid rgba(255,255,255,0.45)` : `1px solid ${currentFieldColor}66`,
          fontSize: '1rem',
          position: 'relative',
        }}
      >
        {currentFieldIcon}
        {/* Small indicator showing view mode */}
        <span style={{
          position: 'absolute', bottom: '2px', right: '2px',
          fontSize: '0.45rem', lineHeight: 1,
          color: 'rgba(255,255,255,0.7)',
        }}>
          {viewMode === 'full' ? '▬' : viewMode === 'half-left' ? '◧' : '◨'}
        </span>
      </button>

      {divider}

      {/* ── Zoom: in/out + percentage label (click to reset) ── */}
      <button onClick={() => onZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} style={btn()} title="Zoom in">+</button>
      <button
        onClick={() => onZoom(1)}
        title="Restablecer zoom (100%)"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: zoom !== 1 ? '#52aaff' : 'rgba(255,255,255,0.4)',
          fontSize: '0.62rem', fontWeight: 700, lineHeight: 1,
          padding: '0.1rem 0', userSelect: 'none', flexShrink: 0,
        }}
      >
        {zoomPct}%
      </button>
      <button onClick={() => onZoom(z => Math.max(0.4, +(z - 0.25).toFixed(2)))} style={btn()} title="Zoom out">−</button>

      {divider}

      {/* ── History & export ── */}
      <button onClick={onUndo} style={{ ...btn(), opacity: canUndo ? 1 : 0.35 }} title="Deshacer (Ctrl+Z)">↩️</button>
      <button onClick={onRedo} style={{ ...btn(), opacity: canRedo ? 1 : 0.35 }} title="Rehacer (Ctrl+Y)">↪️</button>
      <button onClick={onClearAll} style={btn(false, true)} title="Borrar todo">🗑️</button>
      <button onClick={onExportPNG} style={btn()} title="Exportar PNG">📥</button>
    </div>
  );
};

export default CanvasToolbar;
