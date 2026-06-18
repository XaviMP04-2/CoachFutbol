import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import API_URL from '../config';
import './Profile.css';

interface ProfileStats {
  exerciseCount: number;
  totalViews: number;
  sessionCount: number;
}

const Profile: React.FC = () => {
  const { user, token, logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProfileStats>({ exerciseCount: 0, totalViews: 0, sessionCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Settings state
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notifEnabled') !== 'false');
  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/api/ejercicios`, { headers: { 'x-auth-token': token } }).then(r => r.json()),
      fetch(`${API_URL}/api/sessions`, { headers: { 'x-auth-token': token } }).then(r => r.json()),
    ]).then(([exercises, sessions]) => {
      const mine = Array.isArray(exercises) ? exercises.filter((e: { autor?: string }) => e.autor === user?.username) : [];
      const totalViews = mine.reduce((acc: number, e: { viewCount?: number }) => acc + (e.viewCount ?? 0), 0);
      setStats({
        exerciseCount: mine.length,
        totalViews,
        sessionCount: Array.isArray(sessions) ? sessions.length : 0,
      });
      setLoadingStats(false);
    }).catch(() => setLoadingStats(false));
  }, [token, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const saveSettings = () => {
    localStorage.setItem('notifEnabled', String(notifEnabled));
    showToast('Configuración guardada');
  };

  if (!user) return null;

  return (
    <main className="profile-page">
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar-large">
          {(user.username || '').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="profile-name">{user.username || 'Usuario'}</h1>
          <p className="profile-email">{user.email ?? 'Sin email registrado'}</p>
          {user.isAdmin && <span className="profile-admin-badge">⚡ Admin</span>}
        </div>
      </div>

      {/* Stats */}
      <section className="profile-section">
        <h2 className="profile-section-title">Estadísticas</h2>
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-value">{loadingStats ? '…' : stats.exerciseCount}</div>
            <div className="profile-stat-label">✏️ Ejercicios creados</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{loadingStats ? '…' : stats.totalViews}</div>
            <div className="profile-stat-label">👁 Vistas totales</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{loadingStats ? '…' : stats.sessionCount}</div>
            <div className="profile-stat-label">📋 Sesiones</div>
          </div>
        </div>
      </section>

      {/* Settings */}
      <section className="profile-section">
        <h2 className="profile-section-title">Configuración</h2>
        <div className="profile-settings-list">
          <div className="profile-setting-row">
            <div>
              <div className="profile-setting-label">Notificaciones</div>
              <div className="profile-setting-desc">Mostrar toasts de confirmación</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={notifEnabled} onChange={e => setNotifEnabled(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="profile-setting-row">
            <div>
              <div className="profile-setting-label">Tema</div>
              <div className="profile-setting-desc">{theme === 'dark' ? '🌙 Modo oscuro activo' : '☀️ Modo claro activo'}</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={theme === 'light'} onChange={toggleTheme} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
        <button className="profile-save-btn" onClick={saveSettings}>
          Guardar configuración
        </button>
      </section>

      {/* Danger zone */}
      <section className="profile-section profile-danger">
        <h2 className="profile-section-title" style={{ color: '#e74c3c' }}>Zona de peligro</h2>
        <button className="profile-logout-btn" onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </section>
    </main>
  );
};

export default Profile;
