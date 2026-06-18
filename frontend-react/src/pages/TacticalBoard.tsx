import { useState, useEffect, useRef } from 'react';
import CanvasEditor from '../components/CanvasEditor';
import type { CanvasElement } from '../types';
import { drawFieldCanvas } from '../components/canvas/drawField';
import './TacticalBoard.css';

const TacticalBoard = () => {
  const [showCanvas, setShowCanvas] = useState(false);
  const [boardImage, setBoardImage] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const fieldCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw field preview in placeholder
  useEffect(() => {
    if (boardImage) return;
    let raf: number;
    const draw = () => {
      const canvas = fieldCanvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const w = (parent?.clientWidth ?? canvas.clientWidth) || 800;
      const h = Math.round(w * (765 / 1219));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFieldCanvas(ctx, w, h, 'grass', 'full');
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [boardImage]);

  const handleSaveCanvas = (dataUrl: string) => {
    setBoardImage(dataUrl);
    setShowCanvas(false);
  };

  const handleDownload = () => {
    if (!boardImage) return;
    const link = document.createElement('a');
    link.download = `pizarra-tactica-${Date.now()}.png`;
    link.href = boardImage;
    link.click();
  };

  const handleClear = () => {
    setBoardImage(null);
    setElements([]);
  };

  return (
    <div className="tb-page">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="tb-hero">
        <div className="tb-hero-left">
          <p className="tb-hero-label">Herramienta táctica</p>
          <h1 className="tb-hero-title">Pizarra Táctica</h1>
          <p className="tb-hero-sub">Diseña jugadas, posiciones y estrategias sobre el campo</p>
        </div>
        {boardImage && (
          <div className="tb-hero-actions">
            <button className="tb-btn-secondary" onClick={handleClear}>
              🗑️ Limpiar
            </button>
            <button className="tb-btn-primary" onClick={handleDownload}>
              📥 Descargar PNG
            </button>
          </div>
        )}
      </div>

      {/* ── Main canvas area ──────────────────────────────────── */}
      <div className="tb-canvas-wrap" onClick={() => setShowCanvas(true)}>
        {boardImage ? (
          <img
            src={boardImage}
            alt="Pizarra táctica"
            className="tb-board-img"
          />
        ) : (
          <>
            <canvas ref={fieldCanvasRef} className="tb-field-canvas" />
            <div className="tb-overlay">
              <div className="tb-cta-card">
                <span className="tb-cta-icon">✏️</span>
                <span className="tb-cta-text">Abrir Pizarra</span>
                <span className="tb-cta-hint">Haz clic para empezar a dibujar</span>
              </div>
            </div>
          </>
        )}

        {/* Edit overlay when board has content */}
        {boardImage && (
          <div className="tb-overlay tb-overlay-saved">
            <div className="tb-cta-card">
              <span className="tb-cta-icon">✏️</span>
              <span className="tb-cta-text">Editar pizarra</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Tips row ──────────────────────────────────────────── */}
      <div className="tb-tips">
        <div className="tb-tip">
          <span className="tb-tip-icon">🖊️</span>
          <div>
            <strong>Dibuja libremente</strong>
            <p>Usa el lápiz para trazar movimientos y jugadas</p>
          </div>
        </div>
        <div className="tb-tip">
          <span className="tb-tip-icon">👕</span>
          <div>
            <strong>Coloca jugadores</strong>
            <p>Añade fichas de equipo local y visitante</p>
          </div>
        </div>
        <div className="tb-tip">
          <span className="tb-tip-icon">⚽</span>
          <div>
            <strong>Elementos extras</strong>
            <p>Inserta balones, conos y flechas direccionales</p>
          </div>
        </div>
        <div className="tb-tip">
          <span className="tb-tip-icon">📥</span>
          <div>
            <strong>Exporta en PNG</strong>
            <p>Descarga tu pizarra como imagen de alta calidad</p>
          </div>
        </div>
      </div>

      {showCanvas && (
        <CanvasEditor
          onSave={handleSaveCanvas}
          onClose={() => setShowCanvas(false)}
          initialElements={elements}
          onUpdateElements={setElements}
        />
      )}
    </div>
  );
};

export default TacticalBoard;
