import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../types';
import ExerciseCard from '../components/ExerciseCard';
import GrumpySearch from '../components/GrumpySearch';
import './ExerciseList.css';
import SkeletonCard from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const ExerciseList: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Track if user manually dismissed it
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('heroDismissed') === 'true';
  });

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
  const [objectiveFilter, setObjectiveFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [availableObjectives, setAvailableObjectives] = useState<{name: string}[]>([]);

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
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/objectives`)
      .then(res => res.json())
      .then(data => setAvailableObjectives(data))
      .catch(err => console.error('Error loading objectives:', err));
  }, []);

  // Calculate visibility based on state
  // Show if:
  // 1. Not dismissed AND
  // 2. (Not logged in OR (Logged in AND No created exercises))
  const hasCreatedExercises = exercises.some(e => e.autor === user?.username);
  const showHero = !isDismissed && (!isAuthenticated || !hasCreatedExercises);

  const handleCloseHero = () => {
    setIsDismissed(true);
    localStorage.setItem('heroDismissed', 'true');
  };

  useEffect(() => {
    const filtered = exercises.filter(e => {
      const matchSearch = e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.autor && e.autor.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = !typeFilter || e.tipo === typeFilter;
      const matchDifficulty = !difficultyFilter || e.dificultad === difficultyFilter;
      const matchAge = !ageFilter || (e.edadRecomendada && e.edadRecomendada.toLowerCase().includes(ageFilter.toLowerCase()));
      const matchPlayers = !playersFilter || (e.numeroJugadores >= parseInt(playersFilter));
      const matchObjective = !objectiveFilter || (e.objetivos && e.objetivos.includes(objectiveFilter));
      const matchTag = !tagFilter || (e.tags && e.tags.includes(tagFilter));

      return matchSearch && matchType && matchDifficulty && matchAge && matchPlayers && matchObjective && matchTag;
    });
    setFilteredExercises(filtered);
  }, [searchTerm, typeFilter, difficultyFilter, ageFilter, playersFilter, objectiveFilter, exercises]);


  // Press "/" to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setDifficultyFilter('');
    setAgeFilter('');
    setPlayersFilter('');
    setObjectiveFilter('');
    setTagFilter('');
  };

  const allTags = Array.from(new Set(exercises.flatMap(e => e.tags ?? []))).sort();

  const activeFilterCount = [typeFilter, difficultyFilter, ageFilter, playersFilter, objectiveFilter, tagFilter].filter(Boolean).length;

  if (loading) return (
    <div className="page-exercise-list">
      {/* Mobile filter toggle */}
      <button className="mobile-filter-toggle" onClick={() => setShowFilterDrawer(true)}>
        🎛 Filtros
        {activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}
      </button>

      {/* Mobile filter drawer */}
      {showFilterDrawer && (
        <>
          <div className="filter-drawer-overlay" onClick={() => setShowFilterDrawer(false)} />
          <div className="filter-drawer">
            <div className="filter-drawer-handle" />
            <div className="filter-drawer-header">
              <span className="filter-drawer-title">Filtros</span>
              <button className="filter-drawer-close" onClick={() => setShowFilterDrawer(false)}>✕</button>
            </div>
            {/* Reuse sidebar content */}
            <div className="filter-item">
              <label>Tipo de Ejercicio</label>
              <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Todos los tipos</option>
                <option value="técnico">Técnico</option>
                <option value="táctico">Táctico</option>
                <option value="físico">Físico</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Dificultad</label>
              <select className="filter-select" value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
                <option value="">Todas las dificultades</option>
                <option value="Fácil">Fácil</option>
                <option value="Media">Media</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Objetivo</label>
              <select className="filter-select" value={objectiveFilter} onChange={e => setObjectiveFilter(e.target.value)}>
                <option value="">Todos los objetivos</option>
                {availableObjectives.map(obj => (
                  <option key={obj.name} value={obj.name}>{obj.name}</option>
                ))}
              </select>
            </div>
            {allTags.length > 0 && (
              <div className="filter-item">
                <label>Etiquetas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {allTags.map(tag => (
                    <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                      style={{ background: tagFilter === tag ? 'rgba(243,156,18,0.25)' : 'rgba(243,156,18,0.08)', border: `1px solid ${tagFilter === tag ? '#f39c12' : 'rgba(243,156,18,0.3)'}`, borderRadius: '20px', padding: '0.2rem 0.55rem', fontSize: '0.78rem', color: '#f39c12', cursor: 'pointer', fontWeight: tagFilter === tag ? 700 : 400 }}>
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn-clear" onClick={() => { clearFilters(); setShowFilterDrawer(false); }} style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#ecf0f1', cursor: 'pointer' }}>
                Limpiar filtros
              </button>
              <button onClick={() => setShowFilterDrawer(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                Ver resultados
              </button>
            </div>
          </div>
        </>
      )}

      <div className="layout-container">
        <aside className="filters-sidebar" />
        <main className="exercises-content">
          <section className="exercises-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </section>
        </main>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-exercise-list" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: '1.5rem', color: '#e74c3c' }}>Error: {error}</div>
    </div>
  );



  return (
    <div className="page-exercise-list">
      {/* Hero Section */}
      {/* Only show when not loading to avoid flickering */}
      {!loading && !authLoading && showHero && (
        <section className="hero-section">
          <button className="close-hero-btn" onClick={handleCloseHero} title="Cerrar">
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

      {/* Mobile filter toggle */}
      <button className="mobile-filter-toggle" onClick={() => setShowFilterDrawer(true)}>
        🎛 Filtros
        {activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}
      </button>

      {/* Mobile filter drawer */}
      {showFilterDrawer && (
        <>
          <div className="filter-drawer-overlay" onClick={() => setShowFilterDrawer(false)} />
          <div className="filter-drawer">
            <div className="filter-drawer-handle" />
            <div className="filter-drawer-header">
              <span className="filter-drawer-title">Filtros</span>
              <button className="filter-drawer-close" onClick={() => setShowFilterDrawer(false)}>✕</button>
            </div>
            {/* Reuse sidebar content */}
            <div className="filter-item">
              <label>Tipo de Ejercicio</label>
              <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Todos los tipos</option>
                <option value="técnico">Técnico</option>
                <option value="táctico">Táctico</option>
                <option value="físico">Físico</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Dificultad</label>
              <select className="filter-select" value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
                <option value="">Todas las dificultades</option>
                <option value="Fácil">Fácil</option>
                <option value="Media">Media</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Objetivo</label>
              <select className="filter-select" value={objectiveFilter} onChange={e => setObjectiveFilter(e.target.value)}>
                <option value="">Todos los objetivos</option>
                {availableObjectives.map(obj => (
                  <option key={obj.name} value={obj.name}>{obj.name}</option>
                ))}
              </select>
            </div>
            {allTags.length > 0 && (
              <div className="filter-item">
                <label>Etiquetas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {allTags.map(tag => (
                    <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                      style={{ background: tagFilter === tag ? 'rgba(243,156,18,0.25)' : 'rgba(243,156,18,0.08)', border: `1px solid ${tagFilter === tag ? '#f39c12' : 'rgba(243,156,18,0.3)'}`, borderRadius: '20px', padding: '0.2rem 0.55rem', fontSize: '0.78rem', color: '#f39c12', cursor: 'pointer', fontWeight: tagFilter === tag ? 700 : 400 }}>
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn-clear" onClick={() => { clearFilters(); setShowFilterDrawer(false); }} style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#ecf0f1', cursor: 'pointer' }}>
                Limpiar filtros
              </button>
              <button onClick={() => setShowFilterDrawer(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                Ver resultados
              </button>
            </div>
          </div>
        </>
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

          <div className="filter-item">
            <label htmlFor="filtro-objetivo">Objetivo</label>
            <select 
                id="filtro-objetivo" 
                className="filter-select"
                value={objectiveFilter} 
                onChange={e => setObjectiveFilter(e.target.value)}
            >
              <option value="">Todos los objetivos</option>
              {availableObjectives.map(obj => (
                <option key={obj.name} value={obj.name}>{obj.name}</option>
              ))}
            </select>
          </div>
          {allTags.length > 0 && (
            <div className="filter-item">
              <label>Etiquetas</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                    style={{
                      background: tagFilter === tag ? 'rgba(243,156,18,0.25)' : 'rgba(243,156,18,0.08)',
                      border: `1px solid ${tagFilter === tag ? '#f39c12' : 'rgba(243,156,18,0.3)'}`,
                      borderRadius: '20px',
                      padding: '0.2rem 0.55rem',

                    fontSize: '0.78rem',
                      color: '#f39c12',
                      cursor: 'pointer',
                      fontWeight: tagFilter === tag ? 700 : 400
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="exercises-content">
          {/* Search Bar */}
          <div className="search-container">
            <div ref={searchRef as React.RefObject<HTMLDivElement>} tabIndex={-1} onFocus={() => { const inp = (searchRef.current as HTMLElement)?.querySelector('input'); inp?.focus(); }}>
            <GrumpySearch 
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder='Buscar ejercicios por título, autor... (presiona "/" para buscar)'
            />
            </div>
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
