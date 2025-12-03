import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  color: white;
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  margin-right: 0.5rem;
  
  &.approve {
    background: #2ecc71;
    color: white;
  }
  
  &.reject {
    background: #e74c3c;
    color: white;
  }
`;

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [pendingExercises, setPendingExercises] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) {
      // navigate('/'); 
    }
    fetchPending();
  }, [user]);

  const fetchPending = async () => {
    try {
      const res = await fetch('http://localhost:5501/api/ejercicios/admin/pending', {
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
      const res = await fetch(`http://localhost:5501/api/ejercicios/admin/approve/${id}`, {
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

  return (
    <div className="standard-page-container">
      <Title>Panel de Administración</Title>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Ejercicios Pendientes de Aprobación</h3>
      {pendingExercises.length === 0 ? (
        <p style={{ color: '#bdc3c7' }}>No hay ejercicios pendientes.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Título</Th>
              <Th>Autor</Th>
              <Th>Fecha</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {pendingExercises.map((ex: any) => (
              <tr key={ex._id}>
                <Td>{ex.titulo}</Td>
                <Td>{ex.autor}</Td>
                <Td>{new Date(ex.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <Button className="approve" onClick={() => handleApprove(ex._id)}>Aprobar</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default AdminDashboard;
