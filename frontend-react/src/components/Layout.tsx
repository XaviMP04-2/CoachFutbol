import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CommandPalette from './CommandPalette';
import ScrollToTop from './ScrollToTop';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [cmdOpen, setCmdOpen] = useState(false);

  // Spotlight cursor effect
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="app-container">
      <ScrollToTop />
      <header className="premium-header">
        <div className="header-content">
          <Link to="/" className="brand-logo">
            <div className="logo-glow"></div>
            <img src="/img/favicon-proyecto.png" alt="CoachFutbol Logo" />
            <span className="brand-text">COACHFUTBOL</span>
          </Link>

          <nav className="main-nav">
            <Link to="/ejercicios" className={`nav-link ${isActive('/ejercicios')}`}>
              <span className="nav-icon">⚽</span>
              Ejercicios
            </Link>
            <Link to="/pizarra" className={`nav-link ${isActive('/pizarra')}`}>
              <span className="nav-icon">🎯</span>
              Pizarra
            </Link>
            <Link to="/crear" className={`nav-link ${isActive('/crear')}`}>
              <span className="nav-icon">✨</span>
              Crear
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/my-space" className={`nav-link ${isActive('/my-space')}`}>
                  <span className="nav-icon">🚀</span>
                  Mi Espacio
                </Link>
                <Link to="/sesiones" className={`nav-link ${isActive('/sesiones')}`}>
                  <span className="nav-icon">📋</span>
                  Sesiones
                </Link>
                {user?.isAdmin && (
                  <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
                    <span className="nav-icon">🛡️</span>
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="header-actions">
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display:'flex', alignItems:'center', gap:'0.5rem',
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'8px', padding:'0.45rem 0.85rem',
                color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'0.82rem',
                transition:'all 0.2s'
              }}
              title="Buscar ejercicios (Ctrl+K)"
            >
              🔍 <span style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>
                <kbd style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'4px',padding:'0.1rem 0.35rem',fontSize:'0.7rem'}}>⌘K</kbd>
              </span>
            </button>
            {isAuthenticated ? (
              <>
                <span style={{ color: 'white', fontWeight: 500 }}>Hola, {user?.username}</span>
                <button onClick={logout} className="nav-button">Salir</button>
                <Link to="/perfil" className="profile-btn-premium">
                  <div className="avatar-placeholder">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-button">Entrar</Link>
                <Link to="/register" className="cta-button" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <main className="content-main">
        <div className="contenido">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
