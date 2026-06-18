import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { TrainingSession } from '../types';
import API_URL from '../config';
import { useToast } from '../context/ToastContext';
import './Sessions.css';

const Sessions: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/sessions`, { headers: { 'x-auth-token': token || '' } })
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch(`${API_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
      body: JSON.stringify({ name: newName, description: newDesc })
    });
    if (res.ok) {
      const created: TrainingSession = await res.json();
      setSessions(prev => [created, ...prev]);
      setNewName(''); setNewDesc(''); setShowCreate(false);
      navigate(`/sesiones/${created._id}`);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setConfirmDelete(null);
    await fetch(`${API_URL}/api/sessions/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token || '' } });
    setSessions(prev => prev.filter(s => s._id !== id));
    showToast('Sesión eliminada', 'info');
  };

  const totalMinutes = (s: TrainingSession) =>
    s.exercises.reduce((acc, e) => acc + (e.duration || 0), 0);

  if (loading) return (
    <div className="standard-page-container" style={{ color: 'rgba(255,255,255,0.5)', paddingTop: '4rem', textAlign: 'center' }}>
      Cargando sesiones...
    </div>
  );

  return (
    <div className="standard-page-container">
      <div className="sessions-header">
        <div>
          <h1 className="sessions-title">Sesiones de Entrenamiento</h1>
          <p className="sessions-subtitle">Organiza tus ejercicios en sesiones estructuradas</p>
        </div>
        <button className="sessions-create-btn" onClick={() => setShowCreate(!showCreate)}>
          + Nueva Sesión
        </button>
      </div>

      {showCreate && (
        <div className="sessions-create-form">
          <form onSubmit={createSession} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Nombre de la sesión *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="sessions-input"
              autoFocus
              required
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="sessions-input"
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="sessions-create-btn" style={{ fontSize: '0.9rem', padding: '0.55rem 1.2rem' }}>
                Crear y abrir
              </button>
              <button type="button" className="nav-button sessions-cancel" onClick={() => setShowCreate(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {sessions.length === 0 && !showCreate ? (
        <div className="sessions-empty">
          <div className="sessions-empty-icon">📋</div>
          <h3>Sin sesiones todavía</h3>
          <p>Crea tu primera sesión para organizar tus ejercicios en un plan de entrenamiento.</p>
          <button className="sessions-create-btn" onClick={() => setShowCreate(true)}>
            + Crear primera sesión
          </button>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map(s => {
            const mins = totalMinutes(s);
            const date = new Date(s.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            return (
              <Link key={s._id} to={`/sesiones/${s._id}`} className="session-card">
                <div className="session-card-accent" />
                <div className="session-card-body">
                  <div className="session-card-header">
                    <h3 className="session-card-title">{s.name}</h3>
                    <button className="session-card-delete" onClick={e => deleteSession(s._id, e)} title={confirmDelete === s._id ? "Confirmar eliminación" : "Eliminar"} style={{ background: confirmDelete === s._id ? "rgba(231,76,60,0.3)" : undefined, color: confirmDelete === s._id ? "#e74c3c" : undefined }}>{confirmDelete === s._id ? "¿Confirmar?" : "🗑"}</button>
                  </div>
                  {s.description && <p className="session-card-desc">{s.description}</p>}
                  <div className="session-card-meta">
                    <span className="session-card-badge accent">
                      📝 {s.exercises.length} {s.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                    </span>
                    {mins > 0 && (
                      <span className="session-card-badge">⏱ {mins} min</span>
                    )}
                  </div>
                </div>
                <div className="session-card-footer">{date}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sessions;
