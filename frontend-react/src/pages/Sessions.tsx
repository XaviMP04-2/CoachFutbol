import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { TrainingSession } from '../types';
import API_URL from '../config';
import './Sessions.css';

const Sessions: React.FC = () => {
  const { token } = useAuth();
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

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Eliminar esta sesion?')) return;
    await fetch(`${API_URL}/api/sessions/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token || '' } });
    setSessions(prev => prev.filter(s => s._id !== id));
  };

  const totalMinutes = (s: TrainingSession) => s.exercises.reduce((acc, e) => acc + (e.duration || 0), 0);

  if (loading) return <div className="standard-page-container">Cargando...</div>;

  return (
    <div className="standard-page-container">
      <div className="sessions-header">
        <div>
          <h1 className="sessions-title">Sesiones de Entrenamiento</h1>
          <p className="sessions-subtitle">Organiza tus ejercicios en sesiones estructuradas</p>
        </div>
        <button className="nav-button sessions-create-btn" onClick={() => setShowCreate(!showCreate)}>
          + Nueva Sesion
        </button>
      </div>

      {showCreate && (
        <div className="sessions-create-form">
          <form onSubmit={createSession}>
            <input
              type="text"
              placeholder="Nombre de la sesion *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="sessions-input"
              required
            />
            <input
              type="text"
              placeholder="Descripcion (opcional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="sessions-input"
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="nav-button">Crear y abrir</button>
              <button type="button" className="nav-button sessions-cancel" onClick={() => setShowCreate(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="sessions-empty">
          <div className="sessions-empty-icon">📋</div>
          <h3>Sin sesiones todavia</h3>
          <p>Crea tu primera sesion de entrenamiento para organizar tus ejercicios.</p>
          <button className="nav-button" onClick={() => setShowCreate(true)}>Crear sesion</button>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map(s => (
            <Link key={s._id} to={`/sesiones/${s._id}`} className="session-card">
              <div className="session-card-header">
                <h3 className="session-card-title">{s.name}</h3>
                <button className="session-card-delete" onClick={e => deleteSession(s._id, e)} title="Eliminar">🗑</button>
              </div>
              {s.description && <p className="session-card-desc">{s.description}</p>}
              <div className="session-card-meta">
                <span>📝 {s.exercises.length} ejercicios</span>
                {totalMinutes(s) > 0 && <span>⏱ {totalMinutes(s)} min</span>}
              </div>
              <div className="session-card-footer">
                {new Date(s.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sessions;
