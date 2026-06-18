import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import API_URL from '../config';
import type { Exercise } from '../types';
import './MySpace.css';

interface Folder {
  _id: string;
  name: string;
}

const MySpace = () => {
  const { token, favorites } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favoriteExercises, setFavoriteExercises] = useState<Exercise[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'favorites' | string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'difficulty'>('date');
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    if (!folderPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setFolderPickerOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [folderPickerOpen]);

  useEffect(() => {
    if (token && favorites.length >= 0) {
      fetch(`${API_URL}/api/auth/favorites`, { headers: { 'x-auth-token': token || '' } })
        .then(res => res.ok ? res.json() : [])
        .then((data: Exercise[]) => setFavoriteExercises(data))
        .catch(err => console.error('Error syncing favorites:', err));
    }
  }, [token, favorites]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exRes, folderRes, favRes] = await Promise.all([
        fetch(`${API_URL}/api/ejercicios/my-space`, { headers: { 'x-auth-token': token || '' } }),
        fetch(`${API_URL}/api/folders`, { headers: { 'x-auth-token': token || '' } }),
        fetch(`${API_URL}/api/auth/favorites`, { headers: { 'x-auth-token': token || '' } })
      ]);

      if (!exRes.ok || !folderRes.ok) throw new Error('Error al cargar datos');

      const exData: Exercise[] = await exRes.json();
      const folderData: Folder[] = await folderRes.json();
      const favData: Exercise[] = favRes.ok ? await favRes.json() : [];

      setExercises(exData);
      setFolders(folderData);
      setFavoriteExercises(favData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ name: newFolderName })
      });
      if (res.ok) {
        setNewFolderName('');
        setShowCreateFolder(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const setExerciseFolders = async (exerciseId: string, folderIds: string[]) => {
    setExercises(prev => prev.map(ex =>
      ex._id === exerciseId ? { ...ex, folderIds } : ex
    ));
    try {
      await fetch(`${API_URL}/api/ejercicios/${exerciseId}/folders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ folderIds })
      });
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!window.confirm('¿Eliminar esta carpeta? Los ejercicios no se borrarán.')) return;
    try {
      await fetch(`${API_URL}/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });
      if (selectedTab === folderId) setSelectedTab('all');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditFolder = (folder: Folder) => {
    setEditingFolderId(folder._id);
    setEditingFolderName(folder.name);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const saveEditFolder = async (folderId: string) => {
    if (!editingFolderName.trim()) { setEditingFolderId(null); return; }
    try {
      await fetch(`${API_URL}/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ name: editingFolderName.trim() })
      });
      setEditingFolderId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExerciseFolder = (exercise: Exercise, folderId: string) => {
    const current = exercise.folderIds || [];
    const next = current.includes(folderId)
      ? current.filter(id => id !== folderId)
      : [...current, folderId];
    setExerciseFolders(exercise._id, next);
  };

  const getDisplayedExercises = (): Exercise[] => {
    if (selectedTab === 'favorites') return favoriteExercises;
    if (selectedTab === 'all') return exercises;
    return exercises.filter(ex => ex.folderIds?.includes(selectedTab));
  };

  const DIFFICULTY_ORDER: Record<string, number> = { 'FÁCIL': 0, 'MEDIO': 1, 'DIFÍCIL': 2 };

  const getDifficulty = (ex: Exercise) =>
    ex.tags?.find(t => t in DIFFICULTY_ORDER) ?? '';

  const displayedExercises = getDisplayedExercises()
    .filter(ex => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ex.title?.toLowerCase().includes(q) ||
        ex.tags?.some(t => t.toLowerCase().includes(q)) ||
        ex.description?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'difficulty') {
        const da = DIFFICULTY_ORDER[getDifficulty(a)] ?? 99;
        const db = DIFFICULTY_ORDER[getDifficulty(b)] ?? 99;
        return da - db;
      }
      // date: newest first (use _id as proxy if no createdAt)
      return b._id.localeCompare(a._id);
    });

  const getTabTitle = () => {
    if (selectedTab === 'favorites') return 'Mis Favoritos';
    if (selectedTab === 'all') return 'Todos los Ejercicios';
    return folders.find(f => f._id === selectedTab)?.name || 'Carpeta';
  };

  if (loading) return <div className="standard-page-container myspace-loading">Cargando...</div>;
  if (error) return <div className="standard-page-container myspace-error">{error}</div>;

  return (
    <div className="standard-page-container myspace-page">

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="myspace-hero">
        <div className="myspace-hero-left">
          <p className="myspace-hero-label">Tu espacio personal</p>
          <h1 className="myspace-title">Mi Espacio</h1>
        </div>

        <div className="myspace-hero-center">
          <div className="myspace-stat-card">
            <span className="myspace-stat-icon">📋</span>
            <span className="myspace-stat-value">{exercises.length}</span>
            <span className="myspace-stat-label">ejercicios</span>
          </div>
          <div className="myspace-stat-card">
            <span className="myspace-stat-icon">❤️</span>
            <span className="myspace-stat-value">{favoriteExercises.length}</span>
            <span className="myspace-stat-label">favoritos</span>
          </div>
          <div className="myspace-stat-card">
            <span className="myspace-stat-icon">🗂️</span>
            <span className="myspace-stat-value">{folders.length}</span>
            <span className="myspace-stat-label">carpetas</span>
          </div>
        </div>

        <div className="myspace-hero-right">
          <Link to="/crear" className="myspace-create-btn">
            + Crear Ejercicio
          </Link>
        </div>
      </div>

      {/* ── Layout ─────────────────────────────────────────── */}
      <div className="myspace-layout">

        {/* Sidebar */}
        <aside className="myspace-sidebar">
          <nav className="myspace-sidebar-nav">

            <div
              className={`myspace-sidebar-item${selectedTab === 'all' ? ' active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              <span className="myspace-sidebar-icon">📁</span>
              <span className="myspace-sidebar-label">Mis Ejercicios</span>
              <span className="myspace-sidebar-count">{exercises.length}</span>
            </div>

            <div
              className={`myspace-sidebar-item fav${selectedTab === 'favorites' ? ' active' : ''}`}
              onClick={() => setSelectedTab('favorites')}
            >
              <span className="myspace-sidebar-icon">❤️</span>
              <span className="myspace-sidebar-label">Favoritos</span>
              <span className="myspace-sidebar-count">{favoriteExercises.length}</span>
            </div>

            {folders.length > 0 && (
              <>
                <div className="myspace-sidebar-section-label">Carpetas</div>
                {folders.map(folder => (
                  <div key={folder._id} className="myspace-folder-row">
                    {editingFolderId === folder._id ? (
                      <form
                        className="myspace-folder-inline-edit"
                        onSubmit={e => { e.preventDefault(); saveEditFolder(folder._id); }}
                      >
                        <input
                          ref={editInputRef}
                          className="myspace-folder-edit-input"
                          value={editingFolderName}
                          onChange={e => setEditingFolderName(e.target.value)}
                          onBlur={() => saveEditFolder(folder._id)}
                          onKeyDown={e => e.key === 'Escape' && setEditingFolderId(null)}
                        />
                      </form>
                    ) : (
                      <div
                        className={`myspace-sidebar-item folder${selectedTab === folder._id ? ' active' : ''}`}
                        onClick={() => setSelectedTab(folder._id)}
                      >
                        <span className="myspace-sidebar-icon">📂</span>
                        <span className="myspace-sidebar-label">{folder.name}</span>
                        <span className="myspace-sidebar-count">
                          {exercises.filter(ex => ex.folderIds?.includes(folder._id)).length}
                        </span>
                        <span className="myspace-folder-actions">
                          <button
                            className="myspace-folder-action-btn"
                            title="Renombrar"
                            onClick={e => { e.stopPropagation(); startEditFolder(folder); }}
                          >✏️</button>
                          <button
                            className="myspace-folder-action-btn delete"
                            title="Eliminar carpeta"
                            onClick={e => { e.stopPropagation(); deleteFolder(folder._id); }}
                          >🗑️</button>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </nav>

          <div className="myspace-sidebar-footer">
            {showCreateFolder ? (
              <form onSubmit={createFolder} className="myspace-folder-form">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nombre de la carpeta"
                  className="myspace-folder-input"
                  autoFocus
                />
                <div className="myspace-folder-form-btns">
                  <button type="submit" className="myspace-folder-confirm-btn">Crear</button>
                  <button
                    type="button"
                    className="myspace-folder-cancel-btn"
                    onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="myspace-new-folder-btn"
                onClick={() => setShowCreateFolder(true)}
              >
                <span className="myspace-new-folder-plus">+</span>
                Nueva Carpeta
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="myspace-content">
          <div className="myspace-content-header">
            <div className="myspace-content-header-left">
              {selectedTab === 'favorites' && <span className="myspace-tab-icon">❤️</span>}
              {selectedTab === 'all' && <span className="myspace-tab-icon">📁</span>}
              {selectedTab !== 'all' && selectedTab !== 'favorites' && <span className="myspace-tab-icon">📂</span>}
              <h2 className="myspace-content-title">{getTabTitle()}</h2>
            </div>
            <span className="myspace-content-count">{displayedExercises.length} ejercicio{displayedExercises.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="myspace-filter-bar">
            <div className="myspace-search-wrap">
              <span className="myspace-search-icon">🔍</span>
              <input
                type="text"
                className="myspace-search-input"
                placeholder="Buscar por nombre, etiqueta..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="myspace-search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
            <select
              className="myspace-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'name' | 'difficulty')}
            >
              <option value="date">Más recientes</option>
              <option value="name">Nombre A–Z</option>
              <option value="difficulty">Dificultad</option>
            </select>
          </div>

          {displayedExercises.length === 0 ? (
            <div className="myspace-empty">
              {searchQuery ? (
                <>
                  <div className="myspace-empty-icon">🔍</div>
                  <h3 className="myspace-empty-title">Sin resultados</h3>
                  <p className="myspace-empty-desc">Ningún ejercicio coincide con "{searchQuery}".</p>
                  <button className="myspace-empty-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSearchQuery('')}>Limpiar búsqueda</button>
                </>
              ) : (
                <>
                  <div className="myspace-empty-icon">
                    {selectedTab === 'favorites' ? '❤️' : selectedTab === 'all' ? '📋' : '📂'}
                  </div>
                  <h3 className="myspace-empty-title">
                    {selectedTab === 'favorites' ? 'Sin favoritos aún' : selectedTab === 'all' ? 'Sin ejercicios aún' : 'Carpeta vacía'}
                  </h3>
                  <p className="myspace-empty-desc">
                    {selectedTab === 'favorites'
                      ? 'Añade ejercicios a favoritos haciendo clic en el corazón.'
                      : selectedTab === 'all'
                        ? 'Crea tu primer ejercicio para empezar.'
                        : 'Añade ejercicios a esta carpeta desde "Mis Ejercicios".'}
                  </p>
                  {selectedTab === 'all' && (
                    <Link to="/crear" className="myspace-create-btn" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                      + Crear Ejercicio
                    </Link>
                  )}
                  {selectedTab === 'favorites' && (
                    <Link to="/ejercicios" className="myspace-empty-link">Explorar ejercicios →</Link>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="myspace-grid">
              {displayedExercises.map((ex) => (
                <div key={ex._id} className="myspace-card-wrapper">
                  <ExerciseCard
                    exercise={ex}
                    onFavoriteChange={selectedTab === 'favorites' ? () => {
                      setFavoriteExercises(prev => prev.filter(f => f._id !== ex._id));
                    } : undefined}
                  />

                  {selectedTab !== 'favorites' && folders.length > 0 && (
                    <div
                      className="myspace-folder-picker"
                      ref={folderPickerOpen === ex._id ? pickerRef : null}
                    >
                      <button
                        className="myspace-folder-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderPickerOpen(folderPickerOpen === ex._id ? null : ex._id);
                        }}
                      >
                        <span>📂 Carpetas</span>
                        {(ex.folderIds?.length ?? 0) > 0 && (
                          <span className="myspace-folder-btn-badge">{ex.folderIds!.length}</span>
                        )}
                      </button>

                      {folderPickerOpen === ex._id && (
                        <div className="myspace-folder-picker-dropdown">
                          <div className="myspace-folder-picker-title">Añadir a carpetas</div>
                          {folders.map(f => (
                            <label key={f._id} className="myspace-folder-picker-item">
                              <input
                                type="checkbox"
                                checked={ex.folderIds?.includes(f._id) ?? false}
                                onChange={() => toggleExerciseFolder(ex, f._id)}
                              />
                              <span>📂 {f.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MySpace;
