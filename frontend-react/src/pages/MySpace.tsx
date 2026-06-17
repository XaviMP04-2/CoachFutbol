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
  const pickerRef = useRef<HTMLDivElement | null>(null);

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

  const displayedExercises = getDisplayedExercises();

  const getTabTitle = () => {
    if (selectedTab === 'favorites') return '❤️ Mis Favoritos';
    if (selectedTab === 'all') return 'Todos los Ejercicios';
    return folders.find(f => f._id === selectedTab)?.name || 'Carpeta';
  };

  if (loading) return <div className="standard-page-container">Cargando...</div>;
  if (error) return <div className="standard-page-container myspace-error">{error}</div>;

  return (
    <div className="standard-page-container">
      <div className="myspace-header">
        <h1 className="myspace-title">Mi Espacio</h1>
        <div className="myspace-header-actions">
          <button onClick={() => setShowCreateFolder(!showCreateFolder)} className="nav-button">
            + Nueva Carpeta
          </button>
          <Link to="/crear" className="myspace-create-btn">Crear Ejercicio</Link>
        </div>
      </div>

      {showCreateFolder && (
        <div className="myspace-folder-form">
          <form onSubmit={createFolder}>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nombre de la carpeta"
              className="myspace-folder-input"
            />
            <button type="submit" className="nav-button myspace-folder-submit">Crear</button>
          </form>
        </div>
      )}

      <div className="myspace-layout">
        <div className="myspace-sidebar">
          <div
            className={`myspace-sidebar-item${selectedTab === 'all' ? ' active' : ''}`}
            onClick={() => setSelectedTab('all')}
          >
            📁 Mis Ejercicios ({exercises.length})
          </div>

          <div
            className={`myspace-sidebar-item special${selectedTab === 'favorites' ? ' active' : ''}`}
            onClick={() => setSelectedTab('favorites')}
          >
            <span>❤️ Favoritos</span>
            <span className="myspace-sidebar-badge">{favoriteExercises.length}</span>
          </div>

          <div className="myspace-sidebar-divider" />

          {folders.map(folder => (
            <div
              key={folder._id}
              className={`myspace-sidebar-item${selectedTab === folder._id ? ' active' : ''}`}
              onClick={() => setSelectedTab(folder._id)}
            >
              <span>📂 {folder.name}</span>
              <span className="myspace-sidebar-count">
                {exercises.filter(ex => ex.folderIds?.includes(folder._id)).length}
              </span>
            </div>
          ))}
        </div>

        <div className="myspace-content">
          <h2 className="myspace-content-title">{getTabTitle()}</h2>

          {displayedExercises.length === 0 ? (
            <div className="myspace-empty">
              <h3>{selectedTab === 'favorites' ? 'Sin favoritos' : 'Sin ejercicios'}</h3>
              <p>
                {selectedTab === 'favorites'
                  ? 'Añade ejercicios a favoritos haciendo clic en el corazon.'
                  : selectedTab === 'all'
                    ? 'Crea tu primer ejercicio para empezar.'
                    : 'Añade ejercicios a esta carpeta desde "Todos los Ejercicios".'}
              </p>
              {selectedTab === 'favorites' && (
                <Link to="/ejercicios" className="myspace-empty-link">Explorar ejercicios →</Link>
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
        </div>
      </div>
    </div>
  );
};

export default MySpace;
