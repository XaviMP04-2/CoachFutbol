import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="app-container">
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

      <main className="content-main">
        <div className="contenido">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
