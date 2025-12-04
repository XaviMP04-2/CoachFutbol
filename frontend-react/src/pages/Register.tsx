import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import API_URL from '../config';

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
`;

const RegisterCard = styled.div`
  background: var(--bg-card);
  padding: 3rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(to right, #fff, #a5a5a5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: white;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(82, 39, 255, 0.2);
  }
`;

const Button = styled.button`
  padding: 1rem;
  background: linear-gradient(45deg, var(--accent-primary), var(--accent-secondary));
  border: none;
  border-radius: var(--radius-full);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(82, 39, 255, 0.4);
  }
`;

const ErrorMsg = styled.div`
  color: #ff6b6b;
  text-align: center;
  font-size: 0.9rem;
  background: rgba(255, 107, 107, 0.1);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;

  a {
    color: var(--accent-secondary);
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Error al registrarse');
      }

      login(data.token);
      navigate('/my-space');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <Title>Crear Cuenta</Title>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Nombre de Usuario</Label>
            <Input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </InputGroup>
          <InputGroup>
            <Label>Email</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </InputGroup>
          <InputGroup>
            <Label>Contraseña</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </InputGroup>
          <InputGroup>
            <Label>Confirmar Contraseña</Label>
            <Input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </InputGroup>
          <Button type="submit">Registrarse</Button>
        </Form>
        <FooterText>
          ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
        </FooterText>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;
