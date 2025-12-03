import React from 'react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../types';
import './ExerciseCard.css'; // We'll create this small CSS file for the card specific styles

interface ExerciseCardProps {
  exercise: Exercise;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => {
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
