import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ExerciseList from './pages/ExerciseList';
import CreateExercise from './pages/CreateExercise';
import ExerciseDetail from './pages/ExerciseDetail';
import IntroPage from './pages/Intro';
import Login from './pages/Login';
import Register from './pages/Register';
import MySpace from './pages/MySpace';
import AdminDashboard from './pages/AdminDashboard';
import AuthorProfile from './pages/AuthorProfile';
import TacticalBoard from './pages/TacticalBoard';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import PublicSession from './pages/PublicSession';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

// Redirige / al dashboard si está autenticado, si no muestra la landing
const HomeRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <IntroPage />;
};

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route element={<Layout />}>
              {/* Rutas publicas */}
              <Route path="/ejercicios" element={<ExerciseList />} />
              <Route path="/ejercicio/:id" element={<ExerciseDetail />} />
              <Route path="/autor/:username" element={<AuthorProfile />} />
              <Route path="/pizarra" element={<TacticalBoard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas privadas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/crear" element={<CreateExercise />} />
                <Route path="/my-space" element={<MySpace />} />
                <Route path="/sesiones" element={<Sessions />} />
                <Route path="/sesiones/:id" element={<SessionDetail />} />
                <Route path="/perfil" element={<Profile />} />
              </Route>

              {/* Solo admin */}
              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* Sesion publica (sin auth) */}
            <Route path="/sesion-publica/:token" element={<PublicSession />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
