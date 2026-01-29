import React, { useState, useEffect } from 'react';
import CanvasEditor from '../components/CanvasEditor';
import ObjectiveSelector from '../components/ObjectiveSelector';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { CanvasElement } from '../types';
import API_URL from '../config';

const CreateExercise: React.FC = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth();
  const [showCanvas, setShowCanvas] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>(''); // URL from Cloudinary
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'técnico',
    dificultad: 'Fácil',
    edadRecomendada: '',
    objetivos: [] as string[],
    duracion: '',
    material: '',
    numeroJugadores: 1,
    autor: '', 
    archivoUrl: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.username) {
      setFormData(prev => ({ ...prev, autor: user.username || '' }));
    }
  }, [isAuthenticated, navigate, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Upload image to Cloudinary
  const uploadToCloudinary = async (base64Image: string): Promise<string> => {
    setIsUploading(true);
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ image: base64Image })
      });

      if (!res.ok) {
        throw new Error('Error uploading image');
      }

      const data = await res.json();
      return data.url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCanvas = async (dataUrl: string) => {
    setPreviewImage(dataUrl); // Show preview immediately (still Base64 for preview)
    setShowCanvas(false);
    
    // Upload to Cloudinary in background
    try {
      const url = await uploadToCloudinary(dataUrl);
      setCloudinaryUrl(url);
      setFormData(prev => ({ ...prev, archivoUrl: url }));
    } catch (err) {
      console.error('Error uploading to Cloudinary:', err);
      // Fallback to Base64 if Cloudinary fails
      setFormData(prev => ({ ...prev, archivoUrl: dataUrl }));
      alert('⚠️ No se pudo subir a CDN, usando imagen local (puede ser más lento)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Wait for upload if still in progress
    if (isUploading) {
      alert('Espera, la imagen se está subiendo...');
      return;
    }
    
    const payload = {
      ...formData,
      objetivos: formData.objetivos,
      material: formData.material.split(',').map(s => s.trim()),
      numeroJugadores: Number(formData.numeroJugadores),
      autor: formData.autor || user?.username || 'Coach',
      isPublic
    };

    try {
      const res = await fetch(`${API_URL}/api/ejercicios`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isPublic ? 'Ejercicio enviado para aprobación.' : 'Ejercicio guardado en Mi Espacio.');
        navigate(isPublic ? '/ejercicios' : '/my-space');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo guardar'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de red o servidor');
    }
  };

  return (
    <main className="content-main" style={{ padding: '1.5rem' }}>
      <section className="contenido">
        <div className="crear-layout">
          {/* FORMULARIO */}
          <form id="form-ejercicio" className="formulario" autoComplete="off" onSubmit={handleSubmit}>
            <h4 className="form-group-title">Información básica</h4>

            <label htmlFor="titulo">Título:</label>
            <input type="text" id="titulo" name="titulo" required value={formData.titulo} onChange={handleChange} />

            <label htmlFor="descripcion">Descripción:</label>
            <textarea id="descripcion" name="descripcion" rows={3} required value={formData.descripcion} onChange={handleChange}></textarea>

            <h4 className="form-group-title">Clasificación</h4>

            <label htmlFor="tipo">Tipo de ejercicio:</label>
            <select id="tipo" name="tipo" required value={formData.tipo} onChange={handleChange}>
              <option value="técnico">Técnico</option>
              <option value="táctico">Táctico</option>
              <option value="físico">Físico</option>
            </select>

            <label htmlFor="dificultad">Dificultad:</label>
            <select id="dificultad" name="dificultad" value={formData.dificultad} onChange={handleChange}>
              <option value="Fácil">Fácil</option>
              <option value="Media">Media</option>
              <option value="Difícil">Difícil</option>
            </select>

            <label htmlFor="edadRecomendada">Edad recomendada:</label>
            <input type="text" id="edadRecomendada" name="edadRecomendada" placeholder="ej: U14, 13, U16" value={formData.edadRecomendada} onChange={handleChange} />

            <h4 className="form-group-title">Detalles</h4>

            <label>Objetivos:</label>
            <ObjectiveSelector 
              selectedObjectives={formData.objetivos}
              onChange={(newObjectives) => setFormData(prev => ({ ...prev, objetivos: newObjectives }))}
            />

            <label htmlFor="duracion">Duración:</label>
            <input type="text" id="duracion" name="duracion" placeholder="ej: 15 min" value={formData.duracion} onChange={handleChange} />

            <label htmlFor="material">Material necesario:</label>
            <input type="text" id="material" name="material" placeholder="ej: conos, balones, picas" value={formData.material} onChange={handleChange} />

            <label htmlFor="numeroJugadores">Número de jugadores:</label>
            <input type="number" id="numeroJugadores" name="numeroJugadores" min="1" step="1" value={formData.numeroJugadores} onChange={handleChange} />

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="isPublic" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
                style={{ width: 'auto' }}
              />
              <label htmlFor="isPublic" style={{ marginBottom: 0, cursor: 'pointer' }}>
                Solicitar publicación (requiere aprobación)
              </label>
            </div>

            <button type="submit" disabled={isUploading}>
              {isUploading ? '⏳ Subiendo imagen...' : 'Guardar ejercicio'}
            </button>
          </form>

          {/* TARJETA DE PREVISUALIZACIÓN */}
          <aside className="preview-card">
            <div className="preview-card__header">
              <h3>Previsualización</h3>
              {isUploading && (
                <span style={{ fontSize: '0.8rem', color: '#3498db' }}>
                  ⏳ Subiendo a CDN...
                </span>
              )}
              {cloudinaryUrl && !isUploading && (
                <span style={{ fontSize: '0.8rem', color: '#2ecc71' }}>
                  ✓ En CDN
                </span>
              )}
            </div>

            <div className="miniatura-campo" onClick={() => setShowCanvas(true)}>
              {previewImage ? (
                <img src={previewImage} alt="Previsualización" style={{ width: '100%', height: 'auto' }} />
              ) : (
                <p>Haz clic para editar la pizarra</p>
              )}
            </div>

            <p className="preview-hint">
              La previsualización se actualiza al guardar desde la pizarra.
            </p>
          </aside>
        </div>

        {/* MODAL PIZARRA */}
        {showCanvas && (
           <CanvasEditor 
             initialElements={elements} 
             onSave={handleSaveCanvas} 
             onClose={() => setShowCanvas(false)} 
             onUpdateElements={setElements}
           />
        )}
      </section>
    </main>
  );
};

export default CreateExercise;
