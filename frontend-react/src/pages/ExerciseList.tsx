import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../types';
import ExerciseCard from '../components/ExerciseCard';
import GrumpySearch from '../components/GrumpySearch';
import './ExerciseList.css';
import SkeletonCard from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

type SortOption = 'date' | 'name' | 'difficulty' | 'players';

const DIFF_ORDER: Record<string, number> = { 'Fácil': 0, 'Media': 1, 'Difícil': 2 };

const TIPO_OPTIONS = [
  { value: 'técnico',  label: 'Técnico',  color: '#5227FF' },
  { value: 'táctico',  label: 'Táctico',  color: '#0ea5e9' },
  { value: 'físico',   label: 'Físico',   color: '#16a34a' },
];

const DIFF_OPTIONS = [
  { value: 'Fácil',   label: 'Fácil',   color: '#16a34a' },
  { value: 'Media',   label: 'Media',   color: '#f59e0b' },
  { value: 'Difícil', label: 'Difícil', color: '#dc2626' },
];

const ExerciseList: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [playersFilter, setPlayersFilter] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [availableObjectives, setAvailableObjectives] = useState<{ name: string }[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/ejercicios`)
      .then(res => { if (!res.ok) throw new Error('Error fetching exercises'); return res.json(); })
      .then(data => { setExercises(data); setFilteredExercises(data); setLoading(false); })
      .catch(err => { console.error(err); setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/objectives`)
      .then(res => res.json())
      .then(data => setAvailableObjectives(data))
      .catch(err => console.error('Error loading objectives:', err));
  }, []);

  // Filter logic
  useEffect(() => {
    const filtered = exercises.filter(e => {
      const matchSearch = e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.autor && e.autor.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType       = !typeFilter       || e.tipo === typeFilter;
      const matchDifficulty = !difficultyFilter || e.dificultad === difficultyFilter;
      const matchAge        = !ageFilter        || (e.edadRecomendada && e.edadRecomendada.toLowerCase().includes(ageFilter.toLowerCase()));
      const matchPlayers    = !playersFilter    || (e.numeroJugadores >= parseInt(playersFilter));
      const matchObjective  = !objectiveFilter  || (e.objetivos && e.objetivos.includes(objectiveFilter));
      const matchTag        = !tagFilter        || (e.tags && e.tags.includes(tagFilter));
      return matchSearch && matchType && matchDifficulty && matchAge && matchPlayers && matchObjective && matchTag;
    });
    setFilteredExercises(filtered);
  }, [searchTerm, typeFilter, difficultyFilter, ageFilter, playersFilter, objectiveFilter, tagFilter, exercises]);

  // Sort
  const sortedExercises = [...filteredExercises].sort((a, b) => {
    if (sortBy === 'name')       return a.titulo.localeCompare(b.titulo);
    if (sortBy === 'difficulty') return (DIFF_ORDER[a.dificultad] ?? 99) - (DIFF_ORDER[b.dificultad] ?? 99);
    if (sortBy === 'players')    return (a.numeroJugadores || 0) - (b.numeroJugadores || 0);
    return b._id.localeCompare(a._id); // date: newest first
  });

  // "/" shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') searchRef.current?.blur();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const clearFilters = () => {
    setSearchTerm(''); setTypeFilter(''); setDifficultyFilter('');
    setAgeFilter(''); setPlayersFilter(''); setObjectiveFilter(''); setTagFilter('');
  };

  const allTags = Array.from(new Set(exercises.flatMap(e => e.tags ?? []))).sort();
  const activeFilterCount = [typeFilter, difficultyFilter, ageFilter, playersFilter, objectiveFilter, tagFilter].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || searchTerm;

  // ── Shared sidebar filter content ──────────────────────────
  const SidebarFilters = () => (
    <>
      {/* Tipo — pills */}
      <div className="filter-item">
        <label>Tipo de Ejercicio</label>
        <div className="filter-pills">
          {TIPO_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-pill${typeFilter === opt.value ? ' active' : ''}`}
              style={{ '--pill-color': opt.color } as React.CSSProperties}
              onClick={() => setTypeFilter(typeFilter === opt.value ? '' : opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dificultad — pills */}
      <div className="filter-item">
        <label>Dificultad</label>
        <div className="filter-pills">
          {DIFF_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-pill${difficultyFilter === opt.value ? ' active' : ''}`}
              style={{ '--pill-color': opt.color } as React.CSSProperties}
              onClick={() => setDifficultyFilter(difficultyFilter === opt.value ? '' : opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Edad */}
      <div className="filter-item">
        <label htmlFor="filtro-edad">Edad Recomendada</label>
        <input type="text" id="filtro-edad" className="filter-input" placeholder="ej: U14" value={ageFilter} onChange={e => setAgeFilter(e.target.value)} />
      </div>

      {/* Jugadores */}
      <div className="filter-item">
        <label htmlFor="filtro-jugadores">Mínimo Jugadores</label>
        <input type="number" id="filtro-jugadores" className="filter-input" placeholder="ej: 6" value={playersFilter} onChange={e => setPlayersFilter(e.target.value)} />
      </div>

      {/* Objetivo */}
      <div className="filter-item">
        <label htmlFor="filtro-objetivo">Objetivo</label>
        <select id="filtro-objetivo" className="filter-select" value={objectiveFilter} onChange={e => setObjectiveFilter(e.target.value)}>
          <option value="">Todos los objetivos</option>
          {availableObjectives.map(obj => <option key={obj.name} value={obj.name}>{obj.name}</option>)}
        </select>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="filter-item">
          <label>Etiquetas</label>
          <div className="filter-tags-wrap">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`filter-tag-pill${tagFilter === tag ? ' active' : ''}`}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (loading) return (
    <div className="page-exercise-list">
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
    <div className="page-exercise-list" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ fontSize: '1.5rem', color: '#e74c3c' }}>Error: {error}</div>
    </div>
  );

  return (
    <div className="page-exercise-list">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="exercises-page-header">
        <div className="exercises-page-header-left">
          <p className="exercises-page-label">Biblioteca pública</p>
          <h1 className="exercises-page-title">Ejercicios</h1>
        </div>
        {isAuthenticated && (
          <Link to="/crear" className="exercises-create-btn">+ Crear Ejercicio</Link>
        )}
      </div>

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
            <SidebarFilters />
            <div className="filter-drawer-footer">
              <button className="btn-clear" onClick={() => { clearFilters(); setShowFilterDrawer(false); }}>Limpiar filtros</button>
              <button className="filter-drawer-apply-btn" onClick={() => setShowFilterDrawer(false)}>Ver resultados</button>
            </div>
          </div>
        </>
      )}

      <div className="layout-container">
        {/* Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>Filtros</h2>
            {activeFilterCount > 0 && (
              <button className="btn-clear" onClick={clearFilters}>Limpiar todo</button>
            )}
          </div>
          <SidebarFilters />
        </aside>

        {/* Main content */}
        <main className="exercises-content">
          {/* Search */}
          <div className="search-container">
            <GrumpySearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder='Buscar ejercicios por título, autor... (presiona "Ctrl + K" para buscar)'
            />
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="active-filters-bar">
              {searchTerm && (
                <span className="active-filter-chip">
                  🔍 "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}>×</button>
                </span>
              )}
              {typeFilter && (
                <span className="active-filter-chip" style={{ '--chip-color': TIPO_OPTIONS.find(o => o.value === typeFilter)?.color } as React.CSSProperties}>
                  {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                  <button onClick={() => setTypeFilter('')}>×</button>
                </span>
              )}
              {difficultyFilter && (
                <span className="active-filter-chip" style={{ '--chip-color': DIFF_OPTIONS.find(o => o.value === difficultyFilter)?.color } as React.CSSProperties}>
                  {difficultyFilter}
                  <button onClick={() => setDifficultyFilter('')}>×</button>
                </span>
              )}
              {ageFilter && (
                <span className="active-filter-chip">
                  Edad: {ageFilter}
                  <button onClick={() => setAgeFilter('')}>×</button>
                </span>
              )}
              {playersFilter && (
                <span className="active-filter-chip">
                  {playersFilter}+ jugadores
                  <button onClick={() => setPlayersFilter('')}>×</button>
                </span>
              )}
              {objectiveFilter && (
                <span className="active-filter-chip">
                  {objectiveFilter}
                  <button onClick={() => setObjectiveFilter('')}>×</button>
                </span>
              )}
              {tagFilter && (
                <span className="active-filter-chip">
                  #{tagFilter}
                  <button onClick={() => setTagFilter('')}>×</button>
                </span>
              )}
              {(activeFilterCount > 1 || (activeFilterCount > 0 && searchTerm)) && (
                <button className="clear-all-chips-btn" onClick={clearFilters}>Limpiar todo</button>
              )}
            </div>
          )}

          {/* Results bar */}
          <div className="exercises-results-bar">
            <span className="exercises-count">
              <strong>{sortedExercises.length}</strong>
              {' '}ejercicio{sortedExercises.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' encontrados' : ' en total'}
            </span>
            <select
              className="exercises-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <option value="date">Más recientes</option>
              <option value="name">Nombre A–Z</option>
              <option value="difficulty">Dificultad</option>
              <option value="players">Jugadores</option>
            </select>
          </div>

          {/* Grid */}
          <section className="exercises-grid">
            {sortedExercises.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>Sin resultados</h3>
                <p>Prueba ajustando los filtros o la búsqueda.</p>
                {hasActiveFilters && (
                  <button className="no-results-clear-btn" onClick={clearFilters}>Limpiar filtros</button>
                )}
              </div>
            ) : (
              sortedExercises.map(exercise => (
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
