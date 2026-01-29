import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Exercise } from '../types';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import { jsPDF } from 'jspdf';

const ExerciseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isFavorite, toggleFavorite } = useAuth();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportPDF = async () => {
    if (!exercise) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      const footerY = pageHeight - 10;
      let y = margin;

      // Helper function to check if we need a new page
      const checkNewPage = (neededSpace: number) => {
        if (y + neededSpace > footerY - 10) {
          addFooter();
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Helper function to add footer
      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `CoachFutbol - ${new Date().toLocaleDateString('es-ES')}`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );
      };

      // ========== HEADER ==========
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Accent stripe
      doc.setFillColor(46, 204, 113);
      doc.rect(0, 40, pageWidth, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('CoachFutbol', margin, 22);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(189, 195, 199);
      doc.text('Ficha de Ejercicio', margin, 32);
      
      y = 52;

      // ========== TITLE ==========
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(exercise.titulo, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 9 + 8;

      // ========== IMAGE ==========
      if (exercise.archivoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const imgWidth = contentWidth;
              const imgHeight = (img.height / img.width) * imgWidth;
              const maxHeight = 90;
              const finalHeight = Math.min(imgHeight, maxHeight);
              const finalWidth = (finalHeight / imgHeight) * imgWidth;
              
              // Center the image
              const imgX = margin + (contentWidth - finalWidth) / 2;
              
              // Border/shadow effect
              doc.setFillColor(240, 240, 240);
              doc.roundedRect(imgX - 2, y - 2, finalWidth + 4, finalHeight + 4, 3, 3, 'F');
              
              doc.addImage(img, 'PNG', imgX, y, finalWidth, finalHeight);
              y += finalHeight + 12;
              resolve();
            };
            img.onerror = () => resolve(); // Continue even if image fails
            img.src = exercise.archivoUrl!;
          });
        } catch (err) {
          console.log('Could not load image for PDF');
        }
      }

      // ========== DETAILS BOX ==========
      checkNewPage(50);
      
      // Box background
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
      
      const boxY = y + 8;
      const col1X = margin + 8;
      const col2X = margin + contentWidth / 2 + 5;
      
      doc.setFontSize(10);
      
      // Left column
      const leftDetails = [
        { label: 'Tipo', value: exercise.tipo || '-', icon: '📋' },
        { label: 'Dificultad', value: exercise.dificultad || '-', icon: '⭐' },
        { label: 'Duración', value: exercise.duracion || '-', icon: '⏱️' },
      ];
      
      leftDetails.forEach((detail, i) => {
        const detailY = boxY + (i * 12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text(`${detail.label}:`, col1X, detailY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(44, 62, 80);
        doc.text(detail.value, col1X + 28, detailY);
      });
      
      // Right column
      const rightDetails = [
        { label: 'Jugadores', value: exercise.numeroJugadores ? `${exercise.numeroJugadores}+` : '-', icon: '👥' },
        { label: 'Edad', value: exercise.edadRecomendada || '-', icon: '🎯' },
        { label: 'Autor', value: exercise.autor || '-', icon: '✍️' },
      ];
      
      rightDetails.forEach((detail, i) => {
        const detailY = boxY + (i * 12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text(`${detail.label}:`, col2X, detailY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(44, 62, 80);
        doc.text(detail.value, col2X + 28, detailY);
      });
      
      y += 55;

      // ========== OBJECTIVES ==========
      if (exercise.objetivos && exercise.objetivos.length > 0) {
        checkNewPage(25);
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 204, 113);
        doc.text('Objetivos', margin, y);
        y += 7;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        // Display objectives in rows of 3
        const objPerRow = 3;
        const objWidth = contentWidth / objPerRow;
        
        for (let i = 0; i < exercise.objetivos.length; i += objPerRow) {
          checkNewPage(8);
          const rowObjs = exercise.objetivos.slice(i, i + objPerRow);
          rowObjs.forEach((obj, j) => {
            const objX = margin + (j * objWidth);
            doc.text(`• ${obj}`, objX, y);
          });
          y += 6;
        }
        y += 6;
      }

      // ========== MATERIAL ==========
      if (exercise.material && exercise.material.length > 0) {
        checkNewPage(20);
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 152, 219);
        doc.text('Material necesario', margin, y);
        y += 7;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        const materialText = exercise.material.join(' • ');
        const materialLines = doc.splitTextToSize(materialText, contentWidth);
        doc.text(materialLines, margin, y);
        y += materialLines.length * 5 + 8;
      }

      // ========== DESCRIPTION ==========
      if (exercise.descripcion) {
        checkNewPage(30);
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(155, 89, 182);
        doc.text('Descripción del ejercicio', margin, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        const descLines = doc.splitTextToSize(exercise.descripcion, contentWidth);
        
        // Add description with page breaks as needed
        for (const line of descLines) {
          if (checkNewPage(6)) {
            // After new page, we need to continue
          }
          doc.text(line, margin, y);
          y += 5;
        }
      }

      // ========== FOOTER ==========
      addFooter();

      // Save
      const filename = `${exercise.titulo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_')}.pdf`;
      doc.save(filename);

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exerciseIsFavorite = exercise ? isFavorite(exercise._id) : false;

  if (loading) return <div className="contenido">Cargando...</div>;
  if (!exercise) return <div className="contenido">Ejercicio no encontrado</div>;

  return (
    <main className="content-main" style={{ padding: '1.5rem' }}>
      <div className="contenido">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#2ecc71', 
              cursor: 'pointer',
              fontSize: '1rem',
              padding: 0
            }}
          >
            &larr; Volver
          </button>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isAuthenticated && (
              <button
                onClick={() => toggleFavorite(exercise._id)}
                style={{
                  background: exerciseIsFavorite ? 'linear-gradient(45deg, #e74c3c, #c0392b)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.25rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
              >
                {exerciseIsFavorite ? '❤️ Favorito' : '🤍 Añadir a favoritos'}
              </button>
            )}
            
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              style={{
                background: 'linear-gradient(45deg, #3498db, #2980b9)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.25rem',
                color: 'white',
                cursor: isExporting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                opacity: isExporting ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isExporting ? '⏳ Generando...' : '📄 Exportar PDF'}
            </button>
          </div>
        </div>
        
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
