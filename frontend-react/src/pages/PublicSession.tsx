import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { TrainingSession, Exercise } from '../types';
import API_URL from '../config';
import ExerciseCard from '../components/ExerciseCard';

const PublicSession: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/sessions/public/${token}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSession(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      Cargando sesion...
    </div>
  );

  if (!session) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '1rem' }}>
      <span style={{ fontSize: '3rem' }}>🔒</span>
      <h2>Sesion no encontrada</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>El enlace puede haber expirado o ser incorrecto.</p>
    </div>
  );

  const totalMinutes = session.exercises.reduce((acc, e) => acc + (e.duration || 0), 0);
  const populatedExercises = session.exercises
    .filter(e => e.exerciseId && typeof e.exerciseId === 'object')
    .sort((a, b) => a.order - b.order);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
      <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
        Sesion compartida - CoachFutbol
      </div>

      <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem', background: 'linear-gradient(to right,#fff,#aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {session.name}
      </h1>

      {session.description && (
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>{session.description}</p>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
        <span>📝 {session.exercises.length} ejercicios</span>
        {totalMinutes > 0 && <span>⏱ {totalMinutes} minutos</span>}
      </div>

      {populatedExercises.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Esta sesion no tiene ejercicios.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {populatedExercises.map(e => {
            const ex = e.exerciseId as Exercise;
            return (
              <div key={ex._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <ExerciseCard exercise={ex} />
                {e.duration > 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', padding: '0 0.25rem' }}>⏱ {e.duration} min</div>
                )}
                {e.notes && (
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', padding: '0 0.25rem' }}>{e.notes}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PublicSession;
