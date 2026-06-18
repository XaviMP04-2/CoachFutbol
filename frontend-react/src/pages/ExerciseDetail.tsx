import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Exercise, TrainingSession } from '../types';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import { useToast } from '../context/ToastContext';
import { jsPDF } from 'jspdf';
import CommentSection from '../components/CommentSection';
import '../components/CommentSection.css';
import './ExerciseDetail.css';

const ExerciseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isFavorite, toggleFavorite, token } = useAuth();
  const { showToast } = useToast();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [addingToSession, setAddingToSession] = useState<string | null>(null);
  const [addedSessions, setAddedSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API_URL}/api/ejercicios/${id}`)
      .then(res => res.json())
      .then(data => { setExercise(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetch(`${API_URL}/api/sessions`, { headers: { 'x-auth-token': token } })
        .then(r => r.ok ? r.json() : [])
        .then(data => setSessions(data))
        .catch(() => {});
    }
  }, [isAuthenticated, token]);

  const addToSession = async (sessionId: string) => {
    if (!id || addingToSession) return;
    setAddingToSession(sessionId);
    try {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ exerciseId: id })
      });
      if (res.ok) {
        setAddedSessions(prev => new Set([...prev, sessionId]));
        setTimeout(() => setShowSessionPicker(false), 800);
      }
    } finally {
      setAddingToSession(null);
    }
  };

  const handleExportPDF = async () => {
    if (!exercise) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; const pageHeight = 297; const margin = 15;
      const contentWidth = pageWidth - (margin * 2); const footerY = pageHeight - 10;
      let y = margin;
      const checkNewPage = (n: number) => { if (y + n > footerY - 10) { addFooter(); doc.addPage(); y = margin; return true; } return false; };
      const addFooter = () => { doc.setFontSize(8); doc.setTextColor(150,150,150); doc.text(`CoachFutbol - ${new Date().toLocaleDateString('es-ES')}`, pageWidth/2, footerY, { align: 'center' }); };
      doc.setFillColor(44,62,80); doc.rect(0,0,pageWidth,40,'F');
      doc.setFillColor(46,204,113); doc.rect(0,40,pageWidth,3,'F');
      doc.setTextColor(255,255,255); doc.setFontSize(26); doc.setFont('helvetica','bold'); doc.text('CoachFutbol', margin, 22);
      doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.setTextColor(189,195,199); doc.text('Ficha de Ejercicio', margin, 32);
      y = 52;
      doc.setTextColor(44,62,80); doc.setFontSize(22); doc.setFont('helvetica','bold');
      const titleLines = doc.splitTextToSize(exercise.titulo, contentWidth); doc.text(titleLines, margin, y); y += titleLines.length * 9 + 8;
      if (exercise.archivoUrl) {
        try {
          const img = new Image(); img.crossOrigin = 'Anonymous';
          await new Promise<void>(resolve => {
            img.onload = () => {
              const imgW = contentWidth; const imgH = (img.height/img.width)*imgW; const maxH = 90;
              const fH = Math.min(imgH, maxH); const fW = (fH/imgH)*imgW;
              const imgX = margin + (contentWidth-fW)/2;
              doc.setFillColor(240,240,240); doc.roundedRect(imgX-2, y-2, fW+4, fH+4, 3, 3, 'F');
              doc.addImage(img,'PNG',imgX,y,fW,fH); y += fH + 12; resolve();
            };
            img.onerror = () => resolve(); img.src = exercise.archivoUrl!;
          });
        } catch {}
      }
      checkNewPage(50);
      doc.setFillColor(248,249,250); doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
      const boxY = y+8; const col1X = margin+8; const col2X = margin+contentWidth/2+5;
      doc.setFontSize(10);
      [{label:'Tipo',value:exercise.tipo},{label:'Dificultad',value:exercise.dificultad},{label:'Duracion',value:exercise.duracion||'-'}].forEach((d,i)=>{
        doc.setFont('helvetica','bold'); doc.setTextColor(100,100,100); doc.text(`${d.label}:`, col1X, boxY+i*12);
        doc.setFont('helvetica','normal'); doc.setTextColor(44,62,80); doc.text(d.value||'-', col1X+28, boxY+i*12);
      });
      [{label:'Jugadores',value:exercise.numeroJugadores?`${exercise.numeroJugadores}+`:'-'},{label:'Edad',value:exercise.edadRecomendada||'-'},{label:'Autor',value:exercise.autor||'-'}].forEach((d,i)=>{
        doc.setFont('helvetica','bold'); doc.setTextColor(100,100,100); doc.text(`${d.label}:`, col2X, boxY+i*12);
        doc.setFont('helvetica','normal'); doc.setTextColor(44,62,80); doc.text(d.value, col2X+28, boxY+i*12);
      });
      y += 55;
      if (exercise.objetivos?.length) {
        checkNewPage(25); doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(46,204,113); doc.text('Objetivos', margin, y); y += 7;
        doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60);
        for (let i=0;i<exercise.objetivos.length;i+=3) { checkNewPage(8); exercise.objetivos.slice(i,i+3).forEach((o,j)=>doc.text(`• ${o}`, margin+j*(contentWidth/3), y)); y+=6; } y+=6;
      }
      if (exercise.material?.length) {
        checkNewPage(20); doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(52,152,219); doc.text('Material necesario', margin, y); y+=7;
        doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60);
        const ml = doc.splitTextToSize(exercise.material.join(' • '), contentWidth); doc.text(ml, margin, y); y += ml.length*5+8;
      }
      if (exercise.descripcion) {
        checkNewPage(30); doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(155,89,182); doc.text('Descripcion del ejercicio', margin, y); y+=8;
        doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60);
        for (const line of doc.splitTextToSize(exercise.descripcion, contentWidth)) { if (checkNewPage(6)){} doc.text(line, margin, y); y+=5; }
      }
      if (exercise.tags?.length) {
        checkNewPage(20); doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(243,156,18); doc.text('Etiquetas', margin, y); y+=7;
        doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60);
        doc.text(exercise.tags.map(t=>`#${t}`).join('  '), margin, y); y+=10;
      }
      addFooter();
      doc.save(`${exercise.titulo.replace(/[^a-zA-Z0-9]/g,'_')}.pdf`);
    } catch (err) { console.error(err); showToast('Error al generar el PDF', 'error'); }
    finally { setIsExporting(false); }
  };

  const exerciseIsFavorite = exercise ? isFavorite(exercise._id) : false;

  if (loading) return <div className="contenido">Cargando...</div>;
  if (!exercise) return <div className="contenido">Ejercicio no encontrado</div>;

  return (
    <main className="content-main exercise-detail-page" style={{ padding: '1.5rem' }}>
      <div className="contenido">
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <button onClick={() => navigate(-1)} className="detail-back-btn">
            ← Volver
          </button>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            {isAuthenticated && (
              <>
                <button onClick={() => toggleFavorite(exercise._id)} className={`detail-action-btn ${exerciseIsFavorite ? 'detail-action-btn--fav' : ''}`}>
                  {exerciseIsFavorite ? '❤️ Favorito' : '🤍 Favoritos'}
                </button>
                <div style={{ position:'relative' }}>
                  <button onClick={() => setShowSessionPicker(!showSessionPicker)} className="detail-action-btn detail-action-btn--session">
                    📋 Añadir a sesión
                  </button>
                  {showSessionPicker && (
                    <div className="session-picker-dropdown" style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#1e1e2e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'12px', padding:'0.5rem', zIndex:100, minWidth:'200px', boxShadow:'0 8px 30px rgba(0,0,0,0.5)' }}>
                      <div className="session-picker-label" style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', padding:'0.25rem 0.5rem 0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Mis sesiones</div>
                      {sessions.length === 0 ? (
                        <div style={{ padding:'0.75rem 0.5rem', color:'rgba(255,255,255,0.45)', fontSize:'0.85rem' }}>Sin sesiones creadas</div>
                      ) : sessions.map(s => (
                        <button key={s._id} onClick={() => addToSession(s._id)} disabled={addingToSession === s._id || addedSessions.has(s._id)} style={{ display:'block', width:'100%', textAlign:'left', padding:'0.5rem 0.75rem', background: addedSessions.has(s._id) ? 'rgba(46,204,113,0.15)' : 'transparent', border:'none', color: addedSessions.has(s._id) ? '#2ecc71' : 'white', cursor:'pointer', borderRadius:'6px', fontSize:'0.88rem' }}>
                          {addedSessions.has(s._id) ? '✓ ' : ''}{s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <button onClick={handleExportPDF} disabled={isExporting} className="detail-action-btn detail-action-btn--pdf" style={{ opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'wait' : 'pointer' }}>
              {isExporting ? '⏳ Generando...' : '📄 Exportar PDF'}
            </button>
          </div>
        </div>

        {/* Two-column layout: canvas left, info right */}
        <div className="exercise-detail-layout">
          {/* Left: canvas / image */}
          <div className="exercise-detail-canvas">
            {exercise.archivoUrl ? (
              <div className="detail-canvas-wrapper">
                <img src={exercise.archivoUrl} alt="Imagen del ejercicio" style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:'10px' }} />
              </div>
            ) : (
              <div className="detail-canvas-placeholder">
                <span style={{ fontSize:'3rem' }}>⚽</span>
                <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.9rem', marginTop:'0.5rem' }}>Sin diagrama</span>
              </div>
            )}
          </div>

          {/* Right: info */}
          <div className="exercise-detail-info">
            {/* Title + view count */}
            <div style={{ marginBottom:'1rem' }}>
              <h1 style={{ color:'#ecf0f1', margin:'0 0 0.4rem' }} className="exercise-detail-title">{exercise.titulo}</h1>
              {(exercise.viewCount ?? 0) > 0 && (
                <span className="view-count-text" style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                  👁 {exercise.viewCount} vistas
                </span>
              )}
            </div>

            {/* Tags */}
            {exercise.tags && exercise.tags.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1rem' }}>
                {exercise.tags.map(tag => (
                  <span key={tag} style={{ background:'rgba(243,156,18,0.15)', border:'1px solid rgba(243,156,18,0.35)', borderRadius:'20px', padding:'0.2rem 0.65rem', fontSize:'0.78rem', color:'#f39c12' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Descripción */}
            <p className="description-text" style={{ color:'rgba(255,255,255,0.75)', lineHeight:1.7, marginBottom:'1.25rem', fontSize:'0.95rem' }}>
              {exercise.descripcion}
            </p>

            {/* Metadata grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.6rem', marginBottom:'1rem' }}>
              {[
                { icon:'🏷️', label:'Tipo', value: exercise.tipo },
                { icon:'⚡', label:'Dificultad', value: exercise.dificultad },
                { icon:'🧒', label:'Edad', value: exercise.edadRecomendada || '-' },
                { icon:'⏱️', label:'Duración', value: exercise.duracion || '-' },
                { icon:'👥', label:'Jugadores', value: String(exercise.numeroJugadores) },
                { icon:'🧰', label:'Material', value: exercise.material?.join(', ') || '-' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="meta-card" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'10px', padding:'0.75rem' }}>
                  <div className="meta-card-label" style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.25rem' }}>
                    {icon} {label}
                  </div>
                  <div className="meta-card-value" style={{ color:'#ecf0f1', fontWeight:600, fontSize:'0.88rem' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Objetivos — full width within info col */}
            {exercise.objetivos && exercise.objetivos.length > 0 && (
              <div style={{ marginBottom:'0.75rem' }}>
                <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>🎯 Objetivos</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                  {exercise.objetivos.map(obj => (
                    <span key={obj} style={{ background:'rgba(46,204,113,0.12)', border:'1px solid rgba(46,204,113,0.25)', borderRadius:'6px', padding:'0.2rem 0.55rem', fontSize:'0.78rem', color:'#2ecc71' }}>{obj}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments — full width below layout */}
        {id && <CommentSection exerciseId={id} />}
      </div>
    </main>
  );
};

export default ExerciseDetail;
