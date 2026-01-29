//import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
            <Route path="/ejercicios" element={<ExerciseList />} />
            <Route path="/crear" element={<CreateExercise />} />
            <Route path="/ejercicio/:id" element={<ExerciseDetail />} />
            <Route path="/autor/:username" element={<AuthorProfile />} />
            <Route path="/pizarra" element={<TacticalBoard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/my-space" element={<MySpace />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
