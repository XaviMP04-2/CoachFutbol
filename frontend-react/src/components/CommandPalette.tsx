import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Exercise } from '../types';
import API_URL from '../config';
import './CommandPalette.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  'técnico': '#3498db',
  'táctico': '#9b59b6',
  'físico':  '#e67e22',
};

const CommandPalette: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load exercises once on open
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(0);
    setLoading(true);
    fetch(`${API_URL}/api/ejercicios`)
      .then(r => r.json())
      .then(data => { setExercises(data); setFiltered(data.slice(0, 8)); })
      .catch(() => {})
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(exercises.slice(0, 8));
      setSelected(0);
      return;
    }
    const q = query.toLowerCase();
    const results = exercises.filter(e =>
      e.titulo.toLowerCase().includes(q) ||
      (e.autor && e.autor.toLowerCase().includes(q)) ||
      e.tipo.toLowerCase().includes(q) ||
      (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 10);
    setFiltered(results);
    setSelected(0);
  }, [query, exercises]);

  // Keyboard navigation
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      navigate(`/ejercicio/${filtered[selected]._id}`);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selected, navigate, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  return (
    <>
      <div className="cmd-overlay" onClick={onClose} />
      <div className="cmd-panel" role="dialog" aria-modal aria-label="Búsqueda global">
        {/* Search input */}
        <div className="cmd-search-row">
          <svg className="cmd-search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="7.5" cy="7.5" r="5.25" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11.5 11.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Buscar ejercicios, tipo, etiqueta..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-esc">ESC</kbd>
        </div>

        {/* Results */}
        <div className="cmd-results" ref={listRef}>
          {loading ? (
            <div className="cmd-loading">
              <div className="cmd-spinner" />
              Cargando ejercicios...
            </div>
          ) : filtered.length === 0 ? (
            <div className="cmd-empty">No se encontraron ejercicios para "{query}"</div>
          ) : (
            filtered.map((ex, i) => (
              <button
                key={ex._id}
                className={`cmd-result-item${i === selected ? ' active' : ''}`}
                onMouseEnter={() => setSelected(i)}
                onClick={() => { navigate(`/ejercicio/${ex._id}`); onClose(); }}
              >
                <div className="cmd-result-img">
                  {ex.archivoUrl
                    ? <img src={ex.archivoUrl} alt="" />
                    : <span className="cmd-result-emoji">⚽</span>
                  }
                </div>
                <div className="cmd-result-body">
                  <span className="cmd-result-title">{ex.titulo}</span>
                  <span className="cmd-result-sub">por {ex.autor || 'Coach'}</span>
                </div>
                <div className="cmd-result-badges">
                  <span className="cmd-badge" style={{ background: TYPE_COLORS[ex.tipo] || '#555' }}>
                    {ex.tipo}
                  </span>
                  {ex.dificultad && (
                    <span className="cmd-badge cmd-badge-outline">{ex.dificultad}</span>
                  )}
                </div>
                <svg className="cmd-result-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>Esc</kbd> cerrar</span>
          {!query && <span className="cmd-footer-total">{exercises.length} ejercicios disponibles</span>}
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
