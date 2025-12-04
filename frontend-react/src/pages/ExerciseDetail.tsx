import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Exercise } from '../types';
import API_URL from '../config';

const ExerciseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/ejercicios/${id}`)
      .then(res => res.json())
      .then(data => {
        setExercise(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="contenido">Cargando...</div>;
  if (!exercise) return <div className="contenido">Ejercicio no encontrado</div>;

  return (
    <main className="content-main" style={{ padding: '1.5rem' }}>
      <div className="contenido">
        <Link to="/ejercicios" style={{ display: 'inline-block', marginBottom: '1rem', color: '#2ecc71', textDecoration: 'none' }}>&larr; Volver a la lista</Link>
        
        <h1 style={{ color: '#ecf0f1', marginBottom: '1.5rem' }}>{exercise.titulo}</h1>
        
        {exercise.archivoUrl && (
            <div style={{ marginBottom: '2rem', textAlign: 'center', background: '#2c3e50', padding: '1rem', borderRadius: '10px' }}>
                <img 
                    src={exercise.archivoUrl} 
                    alt="Imagen del ejercicio" 
                    style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '5px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} 
                />
            </div>
        )}

        <div style={{ background: '#2c3e50', padding: '2rem', borderRadius: '10px', color: '#bdc3c7' }}>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#ecf0f1' }}>Tipo:</strong> {exercise.tipo}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#ecf0f1' }}>Descripción:</strong> {exercise.descripcion}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#ecf0f1' }}>Objetivos:</strong> {exercise.objetivos?.join(', ')}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#ecf0f1' }}>Edad recomendada:</strong> {exercise.edadRecomendada}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#ecf0f1' }}>Dificultad:</strong> {exercise.dificultad}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#ecf0f1' }}>Duración:</strong> {exercise.duracion}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#ecf0f1' }}>Material:</strong> {exercise.material?.join(', ')}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#ecf0f1' }}>Número de jugadores:</strong> {exercise.numeroJugadores}</p>
        </div>
      </div>
    </main>
  );
};

export default ExerciseDetail;
