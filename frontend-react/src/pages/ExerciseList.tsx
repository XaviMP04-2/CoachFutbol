import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../types';
import ExerciseCard from '../components/ExerciseCard';
import GrumpySearch from '../components/GrumpySearch';
import './ExerciseList.css';
import API_URL from '../config';

const ExerciseList: React.FC = () => {

  const [showHero, setShowHero] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [playersFilter, setPlayersFilter] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/ejercicios`)
      .then(res => {
        if (!res.ok) throw new Error('Error fetching exercises');
        return res.json();
      })
      .then(data => {
        setExercises(data);
        setFilteredExercises(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const filtered = exercises.filter(e => {
      const matchSearch = e.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = !typeFilter || e.tipo === typeFilter;
      const matchDifficulty = !difficultyFilter || e.dificultad === difficultyFilter;
      const matchAge = !ageFilter || (e.edadRecomendada && e.edadRecomendada.toLowerCase().includes(ageFilter.toLowerCase()));
      const matchPlayers = !playersFilter || (e.numeroJugadores >= parseInt(playersFilter));
      
      return matchSearch && matchType && matchDifficulty && matchAge && matchPlayers;
    });
    setFilteredExercises(filtered);
  }, [searchTerm, typeFilter, difficultyFilter, ageFilter, playersFilter, exercises]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setDifficultyFilter('');
    setAgeFilter('');
    setPlayersFilter('');
  };

  if (loading) return (
    <div className="page-exercise-list" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: '1.5rem', color: '#bdc3c7' }}>Cargando ejercicios...</div>
    </div>
  );

  if (error) return (
    <div className="page-exercise-list" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: '1.5rem', color: '#e74c3c' }}>Error: {error}</div>
    </div>
  );



  // ... (existing effects)

  return (
    <div className="page-exercise-list">
      {/* Hero Section */}
      {showHero && (
        <section className="hero-section">
          <button className="close-hero-btn" onClick={() => setShowHero(false)} title="Cerrar">
            ✕
          </button>
          <div className="hero-content">
            <h1>Biblioteca de Ejercicios</h1>
            <p>Gestiona, crea y organiza tus sesiones de entrenamiento de fútbol con herramientas profesionales.</p>
            <Link to="/crear" className="cta-button-hero">
              + Crear Nuevo Ejercicio
            </Link>
          </div>
        </section>
      )}

      <div className="layout-container">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>Filtros</h2>
            <button className="btn-clear" onClick={clearFilters}>Limpiar todo</button>
          </div>
          
          <div className="filter-item">
            <label htmlFor="filtro-tipo">Tipo de Ejercicio</label>
            <select 
                id="filtro-tipo" 
                className="filter-select"
                value={typeFilter} 
                onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="técnico">Técnico</option>
              <option value="táctico">Táctico</option>
              <option value="físico">Físico</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filtro-dificultad">Dificultad</label>
            <select 
                id="filtro-dificultad" 
                className="filter-select"
                value={difficultyFilter} 
                onChange={e => setDifficultyFilter(e.target.value)}
            >
              <option value="">Todas las dificultades</option>
              <option value="Fácil">Fácil</option>
              <option value="Media">Media</option>
              <option value="Difícil">Difícil</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filtro-edad">Edad Recomendada</label>
            <input
              type="text"
              id="filtro-edad"
              className="filter-input"
              placeholder="ej: U14"
              value={ageFilter}
              onChange={e => setAgeFilter(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filtro-jugadores">Mínimo Jugadores</label>
            <input
              type="number"
              id="filtro-jugadores"
              className="filter-input"
              placeholder="ej: 6"
              value={playersFilter}
              onChange={e => setPlayersFilter(e.target.value)}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="exercises-content">
          {/* Search Bar */}
          <div className="search-container">
            <GrumpySearch 
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar ejercicios por título..."
            />
          </div>

          {/* Grid */}
          <section className="exercises-grid">
            {filteredExercises.length === 0 ? (
              <div className="no-results">
                <h3>No se encontraron ejercicios</h3>
                <p>Intenta ajustar los filtros o tu búsqueda.</p>
              </div>
            ) : (
              filteredExercises.map(exercise => (
                <ExerciseCard key={exercise._id} exercise={exercise} />
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ExerciseList;
