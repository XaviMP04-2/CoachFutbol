import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { TrainingSession, Exercise, SessionExercise } from '../types';
import API_URL from '../config';
import ExerciseCard from '../components/ExerciseCard';
import { useToast } from '../context/ToastContext';
import './SessionDetail.css';

const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Inline edit
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/sessions/${id}`, { headers: { 'x-auth-token': token || '' } });
    if (res.ok) {
      const data = await res.json();
      setSession(data);
      setShareUrl(`${window.location.origin}/sesion-publica/${data.shareToken}`);
    }
    setLoading(false);
  }, [id, token]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  useEffect(() => {
    if (editingName && nameInputRef.current) nameInputRef.current.focus();
  }, [editingName]);

  // ── Inline name edit ─────────────────────────────────
  const startEditName = () => {
    setEditName(session?.name || '');
    setEditingName(true);
  };

  const saveEditName = async () => {
    if (!editName.trim() || !session) return;
    setEditingName(false);
    const res = await fetch(`${API_URL}/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
      body: JSON.stringify({ name: editName.trim() })
    });
    if (res.ok) {
      setSession(prev => prev ? { ...prev, name: editName.trim() } : null);
      showToast('Nombre actualizado');
    }
  };

  const removeExercise = async (exerciseId: string) => {
    await fetch(`${API_URL}/api/sessions/${id}/exercises/${exerciseId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token || '' }
    });
    fetchSession();
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Drag & drop reorder ──────────────────────────────
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex || !session) return;

    const reordered = [...populatedExercises];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    // Optimistic update
    setSession(prev => {
      if (!prev) return null;
      const updatedExercises = reordered.map((ex, i) => ({ ...ex, order: i }));
      return { ...prev, exercises: updatedExercises };
    });

    await fetch(`${API_URL}/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
      body: JSON.stringify({
        exercises: reordered.map((ex, i) => ({
          exerciseId: (ex.exerciseId as Exercise)._id,
          duration: ex.duration,
          notes: ex.notes,
          order: i,
        }))
      })
    });

    setDragIndex(null);
    setDragOverIndex(null);
    showToast('Orden actualizado');
  };

  // ── PDF export ───────────────────────────────────────
  const handlePrint = () => window.print();

  const totalMinutes = session?.exercises.reduce((acc, e) => acc + (e.duration || 0), 0) || 0;

  if (loading) return <div className="standard-page-container">Cargando...</div>;
  if (!session) return <div className="standard-page-container">Sesión no encontrada</div>;

  const populatedExercises: SessionExercise[] = session.exercises
    .filter(e => e.exerciseId && typeof e.exerciseId === 'object')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="standard-page-container session-detail-page">

      {/* Print-only header */}
      <div className="print-only session-print-header">
        <h1>{session.name}</h1>
        {session.description && <p>{session.description}</p>}
        <p>{populatedExercises.length} ejercicios · {totalMinutes > 0 ? `${totalMinutes} min` : ''} · {new Date(session.createdAt).toLocaleDateString('es-ES')}</p>
        <hr />
      </div>

      {/* Back + actions */}
      <div className="session-detail-header no-print">
        <button className="session-back-btn" onClick={() => navigate('/sesiones')}>← Mis Sesiones</button>
        <div className="session-detail-actions">
          <button className="nav-button session-pdf-btn" onClick={handlePrint} title="Exportar como PDF">
            📄 Exportar PDF
          </button>
          <button className="nav-button session-share-btn" onClick={copyShareLink}>
            {copied ? '✓ Copiado!' : '🔗 Compartir'}
          </button>
        </div>
      </div>

      {/* Title (inline editable) */}
      <div className="session-title-row no-print">
        {editingName ? (
          <input
            ref={nameInputRef}
            className="session-name-input"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={saveEditName}
            onKeyDown={e => { if (e.key === 'Enter') saveEditName(); if (e.key === 'Escape') setEditingName(false); }}
          />
        ) : (
          <h1 className="session-detail-title" onClick={startEditName} title="Haz clic para editar">
            {session.name}
            <span className="session-title-edit-hint">✏️</span>
          </h1>
        )}
      </div>

      {session.description && <p className="session-detail-desc no-print">{session.description}</p>}

      <div className="session-detail-stats no-print">
        <span className="session-stat">📝 {session.exercises.length} ejercicios</span>
        {totalMinutes > 0 && <span className="session-stat">⏱ {totalMinutes} minutos totales</span>}
        {populatedExercises.length > 1 && (
          <span className="session-stat session-drag-hint">↕ Arrastra para reordenar</span>
        )}
      </div>

      {shareUrl && (
        <div className="session-share-box no-print">
          <span className="session-share-label">Enlace público:</span>
          <input className="session-share-input" value={shareUrl} readOnly onClick={e => (e.target as HTMLInputElement).select()} />
        </div>
      )}

      {populatedExercises.length === 0 ? (
        <div className="session-detail-empty no-print">
          <p>Esta sesión no tiene ejercicios todavía.</p>
          <p>Ve a un ejercicio y usa el botón "Añadir a sesión" para incluirlo aquí.</p>
          <Link to="/ejercicios" className="nav-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Explorar ejercicios
          </Link>
        </div>
      ) : (
        <div className="session-exercises-grid">
          {populatedExercises.map((e, index) => {
            const ex = e.exerciseId as Exercise;
            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index;
            return (
              <div
                key={ex._id}
                className={`session-exercise-item${isDragging ? ' dragging' : ''}${isDragOver ? ' drag-over' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={ev => handleDragOver(ev, index)}
                onDrop={ev => handleDrop(ev, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="session-exercise-drag-handle no-print" title="Arrastra para reordenar">
                  <span>⠿</span>
                  <span className="session-exercise-order">#{index + 1}</span>
                </div>
                <ExerciseCard exercise={ex} />
                {e.duration > 0 && (
                  <div className="session-exercise-duration">⏱ {e.duration} min</div>
                )}
                {e.notes && (
                  <div className="session-exercise-notes">📝 {e.notes}</div>
                )}
                <button
                  className="session-exercise-remove no-print"
                  onClick={() => removeExercise(ex._id)}
                >
                  Quitar de la sesión
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionDetail;
