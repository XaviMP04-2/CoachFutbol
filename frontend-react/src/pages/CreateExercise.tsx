import React, { useState, useEffect, useRef } from 'react';
import CanvasEditor from '../components/CanvasEditor';
import ObjectiveSelector from '../components/ObjectiveSelector';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { CanvasElement } from '../types';
import API_URL from '../config';
import { useToast } from '../context/ToastContext';
import { launchConfetti } from '../utils/confetti';
import { drawFieldCanvas } from '../components/canvas/drawField';
import './CreateExercise.css';

const TIPO_COLORS: Record<string, string> = {
  'técnico': '#5227FF',
  'táctico': '#0ea5e9',
  'físico':  '#16a34a',
};

const DIFICULTAD_COLORS: Record<string, string> = {
  'Fácil':   '#16a34a',
  'Media':   '#f59e0b',
  'Difícil': '#dc2626',
};

const CreateExercise: React.FC = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [showCanvas, setShowCanvas] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>('');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [isPublic, setIsPublic] = useState(true);
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const fieldCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.username) {
      setFormData(prev => ({ ...prev, autor: user.username || '' }));
    }
  }, [isAuthenticated, navigate, user]);

  // Draw field in canvas placeholder — wait for layout via rAF
  useEffect(() => {
    if (previewImage) return;
    let raf: number;
    const draw = () => {
      const canvas = fieldCanvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const w = (parent?.clientWidth ?? canvas.clientWidth) || 280;
      // Use the CanvasEditor's exact aspect ratio (1219/765) for consistent rendering
      const h = Math.round(w * (765 / 1219));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFieldCanvas(ctx, w, h, 'grass', 'full');
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [previewImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadToCloudinary = async (base64Image: string): Promise<string> => {
    setIsUploading(true);
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ image: base64Image })
      });
      if (!res.ok) throw new Error('Error uploading image');
      const data = await res.json();
      return data.url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCanvas = async (dataUrl: string) => {
    setPreviewImage(dataUrl);
    setShowCanvas(false);
    try {
      const url = await uploadToCloudinary(dataUrl);
      setCloudinaryUrl(url);
      setFormData(prev => ({ ...prev, archivoUrl: url }));
    } catch (err) {
      console.error('Error uploading to Cloudinary:', err);
      setFormData(prev => ({ ...prev, archivoUrl: dataUrl }));
      showToast('No se pudo subir a CDN, usando imagen local', 'warning');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      showToast('Espera, la imagen se está subiendo...', 'info');
      return;
    }
    const payload = {
      ...formData,
      objetivos: formData.objetivos,
      material: formData.material.split(',').map(s => s.trim()),
      numeroJugadores: Number(formData.numeroJugadores),
      autor: formData.autor || user?.username || 'Coach',
      tags,
      isPublic
    };
    try {
      const res = await fetch(`${API_URL}/api/ejercicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        launchConfetti();
        showToast(isPublic ? 'Ejercicio enviado para aprobación ✨' : 'Ejercicio guardado en Mi Espacio 🚀');
        navigate(isPublic ? '/ejercicios' : '/my-space');
      } else {
        const err = await res.json();
        showToast(err.error || 'No se pudo guardar', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error de red o servidor', 'error');
    }
  };

  return (
    <main className="content-main crear-page">
      <section className="contenido">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="crear-hero">
          <div>
            <p className="crear-hero-label">Nuevo ejercicio</p>
            <h1 className="crear-hero-title">Crear Ejercicio</h1>
          </div>
        </div>

        <div className="crear-layout-new">

          {/* ── Left: Form ──────────────────────────────────── */}
          <form className="crear-form-col" onSubmit={handleSubmit} autoComplete="off">

            {/* Section 1 */}
            <div className="crear-section-card">
              <div className="crear-section-header">
                <span className="crear-section-icon">📝</span>
                <h3 className="crear-section-title">Información básica</h3>
              </div>
              <div className="crear-field">
                <label htmlFor="titulo">Título</label>
                <input
                  type="text" id="titulo" name="titulo" required
                  placeholder="ej: Rondo 4 vs 2"
                  value={formData.titulo} onChange={handleChange}
                />
              </div>
              <div className="crear-field">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion" name="descripcion" rows={3} required
                  placeholder="Describe el objetivo y desarrollo del ejercicio..."
                  value={formData.descripcion} onChange={handleChange}
                />
              </div>
            </div>

            {/* Section 2 */}
            <div className="crear-section-card">
              <div className="crear-section-header">
                <span className="crear-section-icon">🏷️</span>
                <h3 className="crear-section-title">Clasificación</h3>
              </div>
              <div className="crear-fields-row">
                <div className="crear-field">
                  <label htmlFor="tipo">Tipo de ejercicio</label>
                  <select id="tipo" name="tipo" required value={formData.tipo} onChange={handleChange}>
                    <option value="técnico">Técnico</option>
                    <option value="táctico">Táctico</option>
                    <option value="físico">Físico</option>
                  </select>
                </div>
                <div className="crear-field">
                  <label htmlFor="dificultad">Dificultad</label>
                  <select id="dificultad" name="dificultad" value={formData.dificultad} onChange={handleChange}>
                    <option value="Fácil">Fácil</option>
                    <option value="Media">Media</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
                <div className="crear-field">
                  <label htmlFor="edadRecomendada">Edad recomendada</label>
                  <input
                    type="text" id="edadRecomendada" name="edadRecomendada"
                    placeholder="ej: U14, U16"
                    value={formData.edadRecomendada} onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="crear-section-card">
              <div className="crear-section-header">
                <span className="crear-section-icon">📋</span>
                <h3 className="crear-section-title">Detalles</h3>
              </div>

              <div className="crear-field">
                <label>Objetivos</label>
                <ObjectiveSelector
                  selectedObjectives={formData.objetivos}
                  onChange={(newObjectives) => setFormData(prev => ({ ...prev, objetivos: newObjectives }))}
                />
              </div>

              <div className="crear-fields-row">
                <div className="crear-field">
                  <label htmlFor="duracion">Duración</label>
                  <input type="text" id="duracion" name="duracion" placeholder="ej: 15 min" value={formData.duracion} onChange={handleChange} />
                </div>
                <div className="crear-field">
                  <label htmlFor="material">Material</label>
                  <input type="text" id="material" name="material" placeholder="ej: conos, balones" value={formData.material} onChange={handleChange} />
                </div>
                <div className="crear-field">
                  <label htmlFor="numeroJugadores">Nº jugadores</label>
                  <input type="number" id="numeroJugadores" name="numeroJugadores" min="1" value={formData.numeroJugadores} onChange={handleChange} />
                </div>
              </div>

              <div className="crear-field">
                <label>Etiquetas</label>
                {tags.length > 0 && (
                  <div className="form-tags-list">
                    {tags.map(t => (
                      <span key={t} className="form-tag-pill">
                        #{t}
                        <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} className="form-tag-remove">✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Escribe una etiqueta y pulsa Enter o coma"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault();
                      const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
                      if (!tags.includes(t)) setTags(prev => [...prev, t]);
                      setTagInput('');
                    }
                  }}
                />
              </div>
            </div>

            {/* Section 4: Submit + Toggle */}
            <div className="crear-section-card crear-submit-card">
              {/* Toggle publicación */}
              <div className="crear-publish-row">
                <div className="crear-publish-text">
                  <span className="crear-publish-label">Solicitar publicación</span>
                  <span className="crear-publish-hint">Requiere aprobación del administrador para aparecer en la biblioteca pública</span>
                </div>
                <label className="crear-toggle">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                  />
                  <span className="crear-toggle-track">
                    <span className="crear-toggle-thumb" />
                  </span>
                </label>
              </div>

              <button type="submit" className="crear-submit-btn" disabled={isUploading}>
                {isUploading ? '⏳ Subiendo imagen...' : '✨ Guardar ejercicio'}
              </button>
            </div>
          </form>

          {/* ── Right: Preview ──────────────────────────────── */}
          <aside className="crear-preview-col">

            {/* Canvas / Pizarra */}
            <div className="crear-section-card">
              <div className="crear-section-header">
                <span className="crear-section-icon">🎨</span>
                <h3 className="crear-section-title">Pizarra táctica</h3>
                {isUploading && <span className="crear-cdn-badge uploading">Subiendo…</span>}
                {cloudinaryUrl && !isUploading && <span className="crear-cdn-badge done">✓ CDN</span>}
              </div>

              <div
                className={`crear-field-canvas${previewImage ? ' has-image' : ''}`}
                onClick={() => setShowCanvas(true)}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Previsualización" />
                ) : (
                  <>
                    <canvas ref={fieldCanvasRef} className="crear-field-bg" />
                    <div className="crear-canvas-overlay">
                      <div className="crear-canvas-cta">
                        <span className="crear-canvas-cta-icon">✏️</span>
                        <span>Abrir Pizarra</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {previewImage && (
                <button
                  type="button"
                  className="crear-edit-canvas-btn"
                  onClick={() => setShowCanvas(true)}
                >
                  ✏️ Editar pizarra
                </button>
              )}
            </div>

            {/* Live card preview */}
            <div className="crear-section-card">
              <div className="crear-section-header">
                <span className="crear-section-icon">👁️</span>
                <h3 className="crear-section-title">Vista previa</h3>
              </div>

              <div className="crear-live-card">
                {/* Card image */}
                <div className="crear-live-card-image">
                  {previewImage ? (
                    <img src={previewImage} alt="preview" />
                  ) : (
                    <div className="crear-live-card-image-placeholder">Sin imagen</div>
                  )}
                </div>

                {/* Card content */}
                <div className="crear-live-card-body">
                  <div className="crear-live-card-badges">
                    <span
                      className="crear-live-badge"
                      style={{ background: `${TIPO_COLORS[formData.tipo] || '#5227FF'}22`, color: TIPO_COLORS[formData.tipo] || '#5227FF', borderColor: `${TIPO_COLORS[formData.tipo] || '#5227FF'}44` }}
                    >
                      {formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1)}
                    </span>
                    <span
                      className="crear-live-badge"
                      style={{ background: `${DIFICULTAD_COLORS[formData.dificultad] || '#16a34a'}22`, color: DIFICULTAD_COLORS[formData.dificultad] || '#16a34a', borderColor: `${DIFICULTAD_COLORS[formData.dificultad] || '#16a34a'}44` }}
                    >
                      {formData.dificultad}
                    </span>
                  </div>

                  <h4 className="crear-live-card-title">
                    {formData.titulo || <span className="crear-live-placeholder">Título del ejercicio</span>}
                  </h4>

                  <p className="crear-live-card-desc">
                    {formData.descripcion
                      ? formData.descripcion.slice(0, 80) + (formData.descripcion.length > 80 ? '…' : '')
                      : <span className="crear-live-placeholder">Descripción...</span>
                    }
                  </p>

                  <div className="crear-live-card-meta">
                    {formData.numeroJugadores > 0 && (
                      <span>👥 {formData.numeroJugadores} jugadores</span>
                    )}
                    {formData.duracion && <span>⏱ {formData.duracion}</span>}
                    {formData.edadRecomendada && <span>🎂 {formData.edadRecomendada}</span>}
                  </div>

                  {tags.length > 0 && (
                    <div className="crear-live-card-tags">
                      {tags.slice(0, 4).map(t => (
                        <span key={t} className="crear-live-card-tag">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {showCanvas && (
        <CanvasEditor
          initialElements={elements}
          onSave={handleSaveCanvas}
          onClose={() => setShowCanvas(false)}
          onUpdateElements={setElements}
        />
      )}
    </main>
  );
};

export default CreateExercise;
