import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { TrainingSession } from '../types';
import API_URL from '../config';
import './Dashboard.css';

interface DashboardStats {
  myExercises: number;
  sessions: number;
  totalExercises: number;
  totalSessionExercises: number;
}

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    myExercises: 0, sessions: 0, totalExercises: 0, totalSessionExercises: 0
  });
  const [recentSessions, setRecentSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/api/ejercicios`, { headers: { 'x-auth-token': token } }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/sessions`, { headers: { 'x-auth-token': token } }).then(r => r.json()).catch(() => []),
    ]).then(([exercises, sessions]) => {
      const allEx = Array.isArray(exercises) ? exercises : [];
      const mine = allEx.filter((e: { autor?: string }) => e.autor === user?.username);
      const sessArr: TrainingSession[] = Array.isArray(sessions) ? sessions : [];
      const totalSessEx = sessArr.reduce((acc, s) => acc + s.exercises.length, 0);

      setStats({
        myExercises: mine.length,
        sessions: sessArr.length,
        totalExercises: allEx.length,
        totalSessionExercises: totalSessEx,
      });
      setRecentSessions(sessArr.slice(0, 4));
      setLoading(false);
    });
  }, [token, user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="dashboard-page">

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-text">
          <p className="dashboard-greeting-line">{greeting} 👋</p>
          <h1 className="dashboard-title">
            Hola, <span className="dashboard-username">{user?.username}</span>
          </h1>
          <p className="dashboard-subtitle">¿Qué entrenamos hoy?</p>
        </div>
        <div className="dashboard-quick-actions">
          <Link to="/crear" className="dashboard-qa-btn dashboard-qa-primary">
            <span>✨</span> Crear ejercicio
          </Link>
          <Link to="/sesiones" className="dashboard-qa-btn">
            <span>📋</span> Nueva sesión
          </Link>
          <Link to="/pizarra" className="dashboard-qa-btn">
            <span>🎯</span> Pizarra táctica
          </Link>
          <Link to="/ejercicios" className="dashboard-qa-btn">
            <span>⚽</span> Explorar
          </Link>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────── */}
      <div className="dashboard-stats-row">
        <div className="dashboard-stat-card" style={{ '--stat-color': '#5227FF' } as React.CSSProperties}>
          <div className="dashboard-stat-icon">🏋️</div>
          <div className="dashboard-stat-body">
            <span className="dashboard-stat-value">{loading ? '—' : stats.myExercises}</span>
            <span className="dashboard-stat-label">Mis ejercicios</span>
          </div>
        </div>
        <div className="dashboard-stat-card" style={{ '--stat-color': '#2ecc71' } as React.CSSProperties}>
          <div className="dashboard-stat-icon">📋</div>
          <div className="dashboard-stat-body">
            <span className="dashboard-stat-value">{loading ? '—' : stats.sessions}</span>
            <span className="dashboard-stat-label">Sesiones</span>
          </div>
        </div>
        <div className="dashboard-stat-card" style={{ '--stat-color': '#00c6ff' } as React.CSSProperties}>
          <div className="dashboard-stat-icon">📚</div>
          <div className="dashboard-stat-body">
            <span className="dashboard-stat-value">{loading ? '—' : stats.totalExercises}</span>
            <span className="dashboard-stat-label">En la biblioteca</span>
          </div>
        </div>
        <div className="dashboard-stat-card" style={{ '--stat-color': '#f39c12' } as React.CSSProperties}>
          <div className="dashboard-stat-icon">⚡</div>
          <div className="dashboard-stat-body">
            <span className="dashboard-stat-value">{loading ? '—' : stats.totalSessionExercises}</span>
            <span className="dashboard-stat-label">Ejercicios en sesiones</span>
          </div>
        </div>
      </div>

      {/* ── Two-column lower area ─────────────────────── */}
      <div className="dashboard-lower">

        {/* Recent Sessions */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">📋 Sesiones recientes</h2>
            <Link to="/sesiones" className="dashboard-panel-link">Ver todas →</Link>
          </div>
          {loading ? (
            <div className="dashboard-loading-rows">
              {[1,2,3].map(i => <div key={i} className="dashboard-loading-row" />)}
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="dashboard-empty-panel">
              <span>Sin sesiones todavía</span>
              <Link to="/sesiones" className="dashboard-qa-btn dashboard-qa-primary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}>
                + Crear primera
              </Link>
            </div>
          ) : (
            <div className="dashboard-sessions-list">
              {recentSessions.map(s => {
                const date = new Date(s.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const mins = s.exercises.reduce((acc, e) => acc + (e.duration || 0), 0);
                return (
                  <Link key={s._id} to={`/sesiones/${s._id}`} className="dashboard-session-row">
                    <div className="dashboard-session-dot" />
                    <div className="dashboard-session-info">
                      <span className="dashboard-session-name">{s.name}</span>
                      <span className="dashboard-session-meta">
                        {s.exercises.length} ejercicios
                        {mins > 0 && ` · ${mins} min`}
                        {' · '}{date}
                      </span>
                    </div>
                    <span className="dashboard-session-arrow">›</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Explore categories */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">⚽ Explorar por tipo</h2>
            <Link to="/ejercicios" className="dashboard-panel-link">Ver todos →</Link>
          </div>
          <div className="dashboard-explore-grid">
            <Link to="/ejercicios?tipo=técnico" className="dashboard-explore-card" data-color="purple">
              <span className="dashboard-explore-icon">⚽</span>
              <span className="dashboard-explore-label">Técnico</span>
              <span className="dashboard-explore-desc">Control, pase, regate</span>
            </Link>
            <Link to="/ejercicios?tipo=táctico" className="dashboard-explore-card" data-color="blue">
              <span className="dashboard-explore-icon">🧠</span>
              <span className="dashboard-explore-label">Táctico</span>
              <span className="dashboard-explore-desc">Posición, presión, defensa</span>
            </Link>
            <Link to="/ejercicios?tipo=físico" className="dashboard-explore-card" data-color="green">
              <span className="dashboard-explore-icon">💪</span>
              <span className="dashboard-explore-label">Físico</span>
              <span className="dashboard-explore-desc">Resistencia, fuerza, velocidad</span>
            </Link>
            <Link to="/pizarra" className="dashboard-explore-card" data-color="orange">
              <span className="dashboard-explore-icon">🎯</span>
              <span className="dashboard-explore-label">Pizarra táctica</span>
              <span className="dashboard-explore-desc">Diseña jugadas y estrategias</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
