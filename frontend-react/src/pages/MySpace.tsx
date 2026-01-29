import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import ExerciseCard from '../components/ExerciseCard';
import API_URL from '../config';
import type { Exercise } from '../types';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(to right, #fff, #a5a5a5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const CreateButton = styled(Link)`
  background: linear-gradient(45deg, var(--accent-primary), var(--accent-secondary));
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: var(--radius-full);
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(82, 39, 255, 0.4);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }
`;

const SidebarItem = styled.div<{ $active: boolean; $isSpecial?: boolean }>`
  padding: 1rem;
  cursor: pointer;
  background: ${props => props.$active ? (props.$isSpecial ? 'linear-gradient(45deg, #e74c3c, #c0392b)' : 'var(--accent-primary)') : 'transparent'};
  border-radius: 8px;
  margin-bottom: 0.5rem;
  color: ${props => props.$active ? 'white' : 'var(--text-secondary)'};
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? (props.$isSpecial ? 'linear-gradient(45deg, #e74c3c, #c0392b)' : 'var(--accent-primary)') : 'rgba(255,255,255,0.05)'};
  }
`;

const MySpace = () => {
  const { token } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [favoriteExercises, setFavoriteExercises] = useState<Exercise[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'favorites' | string>('all'); // 'all', 'favorites', or folder id
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exRes, folderRes, favRes] = await Promise.all([
        fetch(`${API_URL}/api/ejercicios/my-space`, { headers: { 'x-auth-token': token || '' } }),
        fetch(`${API_URL}/api/folders`, { headers: { 'x-auth-token': token || '' } }),
        fetch(`${API_URL}/api/auth/favorites`, { headers: { 'x-auth-token': token || '' } })
      ]);

      if (!exRes.ok || !folderRes.ok) throw new Error('Error al cargar datos');

      const exData = await exRes.json();
      const folderData = await folderRes.json();
      const favData = favRes.ok ? await favRes.json() : [];

      setExercises(exData);
      setFolders(folderData);
      setFavoriteExercises(favData);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
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
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token || '' 
        },
        body: JSON.stringify({ name: newFolderName })
      });
      
      if (res.ok) {
        setNewFolderName('');
        setShowCreateFolder(false);
        fetchData(); // Refresh
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moveExercise = async (exerciseId: string, folderId: string | null) => {
    try {
      await fetch(`${API_URL}/api/ejercicios/${exerciseId}/move`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token || '' 
        },
        body: JSON.stringify({ folderId })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Determine displayed exercises based on selected tab
  const getDisplayedExercises = () => {
    if (selectedTab === 'favorites') {
      return favoriteExercises;
    } else if (selectedTab === 'all') {
      return exercises;
    } else {
      return exercises.filter(ex => ex.folderId === selectedTab);
    }
  };

  const displayedExercises = getDisplayedExercises();

  const getTabTitle = () => {
    if (selectedTab === 'favorites') return '❤️ Mis Favoritos';
    if (selectedTab === 'all') return 'Todos los Ejercicios';
    return folders.find(f => f._id === selectedTab)?.name || 'Carpeta';
  };

  if (loading) return <div className="standard-page-container">Cargando...</div>;
  if (error) return <div className="standard-page-container" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="standard-page-container">
      <Header>
        <Title>Mi Espacio</Title>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowCreateFolder(!showCreateFolder)}
            className="nav-button"
          >
            + Nueva Carpeta
          </button>
          <CreateButton to="/crear">Crear Ejercicio</CreateButton>
        </div>
      </Header>

      {showCreateFolder && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
          <form onSubmit={createFolder} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nombre de la carpeta"
              style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <button type="submit" className="nav-button" style={{ background: 'var(--accent-primary)', border: 'none', color: 'white' }}>Crear</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', minHeight: '50vh' }}>
        {/* Sidebar */}
        <div style={{ width: '250px', flexShrink: 0 }}>
          {/* All Exercises */}
          <SidebarItem 
            $active={selectedTab === 'all'}
            onClick={() => setSelectedTab('all')}
          >
            📁 Mis Ejercicios ({exercises.length})
          </SidebarItem>
          
          {/* Favorites - Special */}
          <SidebarItem 
            $active={selectedTab === 'favorites'}
            $isSpecial={true}
            onClick={() => setSelectedTab('favorites')}
          >
            <span>❤️ Favoritos</span>
            <span style={{ 
              background: 'rgba(0,0,0,0.2)', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '0.8rem' 
            }}>
              {favoriteExercises.length}
            </span>
          </SidebarItem>
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>
          
          {/* Folders */}
          {folders.map(folder => (
            <SidebarItem 
              key={folder._id}
              $active={selectedTab === folder._id}
              onClick={() => setSelectedTab(folder._id)}
            >
              <span>📂 {folder.name}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                {exercises.filter(ex => ex.folderId === folder._id).length}
              </span>
            </SidebarItem>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'white' }}>
            {getTabTitle()}
          </h2>

          {displayedExercises.length === 0 ? (
            <EmptyState>
              <h3>{selectedTab === 'favorites' ? 'Sin favoritos' : 'Carpeta vacía'}</h3>
              <p>{selectedTab === 'favorites' 
                ? 'Añade ejercicios a favoritos haciendo clic en el corazón.' 
                : 'No hay ejercicios en esta carpeta.'}</p>
              {selectedTab === 'favorites' && (
                <Link to="/ejercicios" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                  Explorar ejercicios →
                </Link>
              )}
            </EmptyState>
          ) : (
            <Grid>
              {displayedExercises.map((ex: any) => (
                <div key={ex._id} style={{ position: 'relative' }}>
                  <ExerciseCard 
                    exercise={ex} 
                    onFavoriteChange={selectedTab === 'favorites' ? () => {
                      // Remove from local favorites list immediately
                      setFavoriteExercises(prev => prev.filter(f => f._id !== ex._id));
                    } : undefined}
                  />
                  {/* Move dropdown - only for own exercises, not favorites */}
                  {selectedTab !== 'favorites' && (
                    <select 
                      onChange={(e) => moveExercise(ex._id, e.target.value === 'root' ? null : e.target.value)}
                      value={ex.folderId || 'root'}
                      style={{ 
                        position: 'absolute', 
                        bottom: '10px', 
                        right: '10px', 
                        zIndex: 10,
                        padding: '2px',
                        fontSize: '0.8rem',
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="root">Mis Ejercicios</option>
                      {folders.map(f => (
                        <option key={f._id} value={f._id}>{f.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </Grid>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySpace;
