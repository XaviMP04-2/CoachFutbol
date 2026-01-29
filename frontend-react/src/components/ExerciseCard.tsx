import React from 'react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../types';
import { useAuth } from '../context/AuthContext';
import './ExerciseCard.css';

interface ExerciseCardProps {
  exercise: Exercise;
  onFavoriteChange?: () => void; // Optional callback when favorite status changes
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onFavoriteChange }) => {
  const { isAuthenticated, isFavorite, toggleFavorite } = useAuth();
  const exerciseIsFavorite = isFavorite(exercise._id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    await toggleFavorite(exercise._id);
    // Notify parent if callback provided
    if (onFavoriteChange) {
      onFavoriteChange();
    }
  };

  return (
    <Link to={`/ejercicio/${exercise._id}`} className="exercise-card-link">
      <div className="exercise-card-premium">
        <div className="card-image-container">
          {exercise.archivoUrl ? (
            <img src={exercise.archivoUrl} alt={exercise.titulo} className="card-img" />
          ) : (
            <div className="card-placeholder">
              <span style={{ fontSize: '3rem' }}>⚽</span>
            </div>
          )}
          <div className="card-badges-overlay">
            <span className={`badge-pill badge-${exercise.tipo}`}>{exercise.tipo}</span>
            <span className={`badge-pill badge-difficulty`}>{exercise.dificultad}</span>
          </div>
          
          {/* Favorite button */}
          {isAuthenticated && (
            <button 
              className={`favorite-btn ${exerciseIsFavorite ? 'is-favorite' : ''}`}
              onClick={handleFavoriteClick}
              title={exerciseIsFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              {exerciseIsFavorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>
        
        <div className="card-details">
          <h3 className="card-title">{exercise.titulo}</h3>
          
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-icon">👥</span>
              <span>{exercise.numeroJugadores}+ Jug.</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <span>{exercise.duracion || 'N/A'}</span>
            </div>
          </div>
          
          <p className="card-desc">
            {exercise.descripcion 
              ? (exercise.descripcion.length > 80 ? exercise.descripcion.substring(0, 80) + '...' : exercise.descripcion)
              : 'Sin descripción disponible.'}
          </p>
          
          <div className="card-footer">
            <span className="view-more">Ver Detalles &rarr;</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ExerciseCard;
