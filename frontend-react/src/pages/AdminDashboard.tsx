import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import API_URL from '../config';

const Title = styled.h1`
  color: white;
  margin-bottom: 2rem;
`;

const ExerciseGrid = styled.div`
  display: grid;
  gap: 2rem;
`;

const ExerciseCard = styled.div`
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-light);
`;

const CardHeader = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
`;

const CardImage = styled.div`
  width: 300px;
  height: 200px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #1a1a2e;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CardInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CardTitle = styled.h3`
  color: white;
  font-size: 1.5rem;
  margin: 0;
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Badge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  
  &.type { background: rgba(52, 152, 219, 0.3); color: #3498db; }
  &.difficulty { background: rgba(155, 89, 182, 0.3); color: #9b59b6; }
  &.players { background: rgba(46, 204, 113, 0.3); color: #2ecc71; }
`;

const Description = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  max-height: 100px;
  overflow-y: auto;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: var(--text-secondary);
  
  span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--border-light);
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  
  &.approve {
    background: linear-gradient(45deg, #2ecc71, #27ae60);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
    }
  }
  
  &.reject {
    background: linear-gradient(45deg, #e74c3c, #c0392b);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
    }
  }
`;

const ExpandButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ExpandedDetails = styled.div`
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid var(--border-light);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  
  .detail-item {
    label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    
    p {
      color: white;
      margin: 0;
    }
  }
`;

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [pendingExercises, setPendingExercises] = useState([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) {
      // navigate('/'); 
    }
    fetchPending();
  }, [user]);

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ejercicios/admin/pending`, {
        headers: { 'x-auth-token': token || '' }
      });
      if (!res.ok) throw new Error('Error al cargar pendientes');
      const data = await res.json();
      setPendingExercises(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ejercicios/admin/approve/${id}`, {
        method: 'PUT',
        headers: { 'x-auth-token': token || '' }
      });
      
      if (res.ok) {
        alert('✅ Ejercicio aprobado correctamente');
        fetchPending();
      } else {
        alert('❌ Error al aprobar el ejercicio');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error de conexión');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo del rechazo (opcional):');
    if (reason === null) return; // User cancelled
    
    try {
      const res = await fetch(`${API_URL}/api/ejercicios/admin/reject/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token || '' 
        },
        body: JSON.stringify({ reason })
      });
      
      if (res.ok) {
        alert('Ejercicio rechazado');
        fetchPending();
      } else {
        alert('❌ Error al rechazar');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error de conexión');
    }
  };

  return (
    <div className="standard-page-container">
      <Title>Panel de Administración</Title>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>
        Ejercicios Pendientes de Aprobación ({pendingExercises.length})
      </h3>
      
      {pendingExercises.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          background: 'var(--bg-card)', 
          borderRadius: 'var(--radius-lg)',
          color: '#bdc3c7' 
        }}>
          <span style={{ fontSize: '3rem' }}>✅</span>
          <p>No hay ejercicios pendientes de aprobación.</p>
        </div>
      ) : (
        <ExerciseGrid>
          {pendingExercises.map((ex: any) => (
            <ExerciseCard key={ex._id}>
              <CardHeader>
                <CardImage>
                  {ex.archivoUrl ? (
                    <img src={ex.archivoUrl} alt={ex.titulo} />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '3rem'
                    }}>
                      ⚽
                    </div>
                  )}
                </CardImage>
                
                <CardInfo>
                  <CardTitle>{ex.titulo}</CardTitle>
                  
                  <CardMeta>
                    <Badge className="type">{ex.tipo}</Badge>
                    <Badge className="difficulty">{ex.dificultad}</Badge>
                    <Badge className="players">👥 {ex.numeroJugadores}+ jugadores</Badge>
                  </CardMeta>
                  
                  <Description>{ex.descripcion || 'Sin descripción'}</Description>
                  
                  <DetailRow>
                    <span>👤 {ex.autor}</span>
                    <span>📅 {new Date(ex.createdAt).toLocaleDateString('es-ES')}</span>
                    {ex.duracion && <span>⏱️ {ex.duracion}</span>}
                    {ex.edadRecomendada && <span>🎯 {ex.edadRecomendada}</span>}
                  </DetailRow>
                  
                  <ExpandButton onClick={() => setExpandedId(expandedId === ex._id ? null : ex._id)}>
                    {expandedId === ex._id ? '▲ Menos detalles' : '▼ Más detalles'}
                  </ExpandButton>
                </CardInfo>
              </CardHeader>
              
              {expandedId === ex._id && (
                <ExpandedDetails>
                  <div className="detail-item">
                    <label>Objetivos</label>
                    <p>{ex.objetivos?.join(', ') || 'No especificados'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Material</label>
                    <p>{ex.material?.join(', ') || 'No especificado'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Duración</label>
                    <p>{ex.duracion || 'No especificada'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Edad Recomendada</label>
                    <p>{ex.edadRecomendada || 'No especificada'}</p>
                  </div>
                </ExpandedDetails>
              )}
              
              <CardActions>
                <Button className="approve" onClick={() => handleApprove(ex._id)}>
                  ✓ Aprobar y Publicar
                </Button>
                <Button className="reject" onClick={() => handleReject(ex._id)}>
                  ✗ Rechazar
                </Button>
              </CardActions>
            </ExerciseCard>
          ))}
        </ExerciseGrid>
      )}
    </div>
  );
};

export default AdminDashboard;
