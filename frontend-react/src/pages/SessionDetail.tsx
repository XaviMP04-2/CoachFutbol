import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { TrainingSession, Exercise } from '../types';
import API_URL from '../config';
import ExerciseCard from '../components/ExerciseCard';
import './SessionDetail.css';

const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

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

  const totalMinutes = session?.exercises.reduce((acc, e) => acc + (e.duration || 0), 0) || 0;

  if (loading) return <div className="standard-page-container">Cargando...</div>;
  if (!session) return <div className="standard-page-container">Sesion no encontrada</div>;

  const populatedExercises = session.exercises
    .filter(e => e.exerciseId && typeof e.exerciseId === 'object')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="standard-page-container">
      <div className="session-detail-header">
        <button className="session-back-btn" onClick={() => navigate('/sesiones')}>← Mis Sesiones</button>
        <div className="session-detail-actions">
          <button className="nav-button session-share-btn" onClick={copyShareLink}>
            {copied ? '✓ Copiado!' : '🔗 Compartir enlace'}
          </button>
        </div>
      </div>

      <h1 className="session-detail-title">{session.name}</h1>
      {session.description && <p className="session-detail-desc">{session.description}</p>}

      <div className="session-detail-stats">
        <span className="session-stat">📝 {session.exercises.length} ejercicios</span>
        {totalMinutes > 0 && <span className="session-stat">⏱ {totalMinutes} minutos totales</span>}
      </div>

      {shareUrl && (
        <div className="session-share-box">
          <span className="session-share-label">Enlace publico:</span>
          <input className="session-share-input" value={shareUrl} readOnly onClick={e => (e.target as HTMLInputElement).select()} />
        </div>
      )}

      {populatedExercises.length === 0 ? (
        <div className="session-detail-empty">
          <p>Esta sesion no tiene ejercicios todavia.</p>
          <p>Ve a un ejercicio y usa el boton "Añadir a sesion" para incluirlo aqui.</p>
          <Link to="/ejercicios" className="nav-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Explorar ejercicios
          </Link>
        </div>
      ) : (
        <div className="session-exercises-grid">
          {populatedExercises.map(e => {
            const ex = e.exerciseId as Exercise;
            return (
              <div key={ex._id} className="session-exercise-item">
                <ExerciseCard exercise={ex} />
                {e.duration > 0 && (
                  <div className="session-exercise-duration">⏱ {e.duration} min</div>
                )}
                {e.notes && (
                  <div className="session-exercise-notes">{e.notes}</div>
                )}
                <button
                  className="session-exercise-remove"
                  onClick={() => removeExercise(ex._id)}
                >
                  Quitar de la sesion
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
