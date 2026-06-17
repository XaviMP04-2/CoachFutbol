import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<IntroPage />} />
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
              <Route path="/crear" element={<CreateExercise />} />
              <Route path="/my-space" element={<MySpace />} />
            </Route>

            {/* Solo admin */}
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
