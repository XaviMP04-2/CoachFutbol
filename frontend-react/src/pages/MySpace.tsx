import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import ExerciseCard from '../components/ExerciseCard';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

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

const MySpace = () => {
  const { user, token } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // null = "Mis Ejercicios" (All)
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
      const [exRes, folderRes] = await Promise.all([
        fetch('http://localhost:5501/api/ejercicios/my-space', { headers: { 'x-auth-token': token || '' } }),
        fetch('http://localhost:5501/api/folders', { headers: { 'x-auth-token': token || '' } })
      ]);

      if (!exRes.ok || !folderRes.ok) throw new Error('Error al cargar datos');

      const exData = await exRes.json();
      const folderData = await folderRes.json();

      setExercises(exData);
      setFolders(folderData);
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
      const res = await fetch('http://localhost:5501/api/folders', {
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
      await fetch(`http://localhost:5501/api/ejercicios/${exerciseId}/move`, {
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

  // Filter exercises based on selection
  // If selectedFolder is null -> Show ALL ("Mis Ejercicios")
  // If selectedFolder is set -> Show only those in that folder
  const displayedExercises = selectedFolder 
    ? exercises.filter(ex => ex.folderId === selectedFolder)
    : exercises;

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
        {/* Sidebar Folders */}
        <div style={{ width: '250px', flexShrink: 0 }}>
          <div 
            onClick={() => setSelectedFolder(null)}
            style={{ 
              padding: '1rem', 
              cursor: 'pointer', 
              background: selectedFolder === null ? 'var(--accent-primary)' : 'transparent',
              borderRadius: '8px',
              marginBottom: '0.5rem',
              color: 'white',
              fontWeight: 500
            }}
          >
            📁 Mis Ejercicios (Todos)
          </div>
          
          {folders.map(folder => (
            <div 
              key={folder._id}
              onClick={() => setSelectedFolder(folder._id)}
              style={{ 
                padding: '1rem', 
                cursor: 'pointer', 
                background: selectedFolder === folder._id ? 'rgba(82, 39, 255, 0.3)' : 'transparent',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>📂 {folder.name}</span>
              {/* Drop target could go here */}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'white' }}>
            {selectedFolder ? folders.find(f => f._id === selectedFolder)?.name : 'Todos los Ejercicios'}
          </h2>

          {displayedExercises.length === 0 ? (
            <EmptyState>
              <h3>Carpeta vacía</h3>
              <p>No hay ejercicios en esta carpeta.</p>
            </EmptyState>
          ) : (
            <Grid>
              {displayedExercises.map((ex: any) => (
                <div key={ex._id} style={{ position: 'relative' }}>
                  <ExerciseCard exercise={ex} />
                  {/* Quick Move Dropdown (Simple version) */}
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
                    onClick={(e) => e.stopPropagation()} // Prevent card click
                  >
                    <option value="root">Mis Ejercicios</option>
                    {folders.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
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
