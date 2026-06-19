import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CommandPalette from './CommandPalette';
import ScrollToTop from './ScrollToTop';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Spotlight cursor effect
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Ctrl+K
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

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location]);

  // Prevent body scroll when mobile nav open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

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

          {/* Desktop nav */}
          <nav className="main-nav">
            <Link to="/ejercicios" className={`nav-link ${isActive('/ejercicios')}`}>
              <span className="nav-icon">⚽</span>Ejercicios
            </Link>
            <Link to="/pizarra" className={`nav-link ${isActive('/pizarra')}`}>
              <span className="nav-icon">🎯</span>Pizarra
            </Link>
            <Link to="/crear" className={`nav-link ${isActive('/crear')}`}>
              <span className="nav-icon">✨</span>Crear
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                  <span className="nav-icon">🏠</span>Inicio
                </Link>
                <Link to="/my-space" className={`nav-link ${isActive('/my-space')}`}>
                  <span className="nav-icon">🚀</span>Mi Espacio
                </Link>
                <Link to="/sesiones" className={`nav-link ${isActive('/sesiones')}`}>
                  <span className="nav-icon">📋</span>Sesiones
                </Link>
                {user?.isAdmin && (
                  <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
                    <span className="nav-icon">🛡️</span>Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Desktop auth */}
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <span className="header-user-greeting">Hola, {user?.username}</span>
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
                <Link to="/register" className="cta-button">Registrarse</Link>
              </>
            )}
          </div>

          {/* Mobile: profile/avatar + hamburger */}
          <div className="mobile-header-right">
            {isAuthenticated && (
              <Link to="/perfil" className="profile-btn-premium">
                <div className="avatar-placeholder">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              </Link>
            )}
            <button
              className={`mobile-hamburger${mobileNavOpen ? ' open' : ''}`}
              onClick={() => setMobileNavOpen(o => !o)}
              aria-label="Menú"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Mobile nav panel */}
      <div className={`mobile-nav-panel${mobileNavOpen ? ' open' : ''}`}>
        <div className="mobile-nav-links">
          <Link to="/ejercicios" className={`mobile-nav-link ${isActive('/ejercicios')}`}>
            <span>⚽</span>Ejercicios
          </Link>
          <Link to="/pizarra" className={`mobile-nav-link ${isActive('/pizarra')}`}>
            <span>🎯</span>Pizarra
          </Link>
          <Link to="/crear" className={`mobile-nav-link ${isActive('/crear')}`}>
            <span>✨</span>Crear
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={`mobile-nav-link ${isActive('/dashboard')}`}>
                <span>🏠</span>Inicio
              </Link>
              <Link to="/my-space" className={`mobile-nav-link ${isActive('/my-space')}`}>
                <span>🚀</span>Mi Espacio
              </Link>
              <Link to="/sesiones" className={`mobile-nav-link ${isActive('/sesiones')}`}>
                <span>📋</span>Sesiones
              </Link>
              {user?.isAdmin && (
                <Link to="/admin" className={`mobile-nav-link ${isActive('/admin')}`}>
                  <span>🛡️</span>Admin
                </Link>
              )}
              <div className="mobile-nav-divider" />
              <div className="mobile-nav-user">
                <span className="mobile-nav-username">@{user?.username}</span>
                <button onClick={() => { logout(); setMobileNavOpen(false); }} className="mobile-nav-logout">
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mobile-nav-divider" />
              <Link to="/login" className="mobile-nav-link">
                <span>🔑</span>Entrar
              </Link>
              <Link to="/register" className="mobile-nav-cta">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>

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
