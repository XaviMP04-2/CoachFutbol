import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Comment } from '../types';
import API_URL from '../config';

interface Props {
  exerciseId: string;
}

const CommentSection: React.FC<Props> = ({ exerciseId }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/comments/${exerciseId}`)
      .then(r => r.json())
      .then(data => { setComments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [exerciseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/comments/${exerciseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const newComment: Comment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setText('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    await fetch(`${API_URL}/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token || '' }
    });
    setComments(prev => prev.filter(c => c._id !== commentId));
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">Comentarios ({comments.length})</h3>

      {isAuthenticated && (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            className="comment-input"
            placeholder="Escribe un comentario..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
          />
          <button type="submit" className="comment-submit" disabled={submitting || !text.trim()}>
            {submitting ? 'Enviando...' : 'Comentar'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="comment-loading">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="comment-empty">Sin comentarios todavia. Sé el primero en comentar.</p>
      ) : (
        <div className="comment-list">
          {comments.map(c => (
            <div key={c._id} className="comment-item">
              <div className="comment-header">
                <span className="comment-username">{c.username}</span>
                <span className="comment-date">{formatDate(c.createdAt)}</span>
                {user?.username === c.username && (
                  <button className="comment-delete" onClick={() => handleDelete(c._id)} title="Eliminar">✕</button>
                )}
              </div>
              <p className="comment-text">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
