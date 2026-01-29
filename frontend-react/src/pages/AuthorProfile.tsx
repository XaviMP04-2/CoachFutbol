import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExerciseCard from '../components/ExerciseCard';
import styled from 'styled-components';
import API_URL from '../config';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProfileHeader = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  
  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2ecc71);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  flex-shrink: 0;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const Username = styled.h1`
  color: white;
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
`;

const Bio = styled.p`
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
`;

const Stats = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
`;

const Stat = styled.div`
  text-align: center;
  
  .number {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
  }
  
  .label {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
`;

const FollowButton = styled.button<{ $isFollowing: boolean }>`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  background: ${props => props.$isFollowing 
    ? 'rgba(255,255,255,0.1)' 
    : 'linear-gradient(45deg, #3498db, #2980b9)'};
  color: white;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SectionTitle = styled.h2`
  color: white;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
`;

interface AuthorProfile {
  username: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  exerciseCount: number;
  createdAt: string;
}

const AuthorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { isAuthenticated, user, token } = useAuth();
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch profile
        const profileRes = await fetch(`${API_URL}/api/users/${username}`);
        if (!profileRes.ok) throw new Error('Usuario no encontrado');
        const profileData = await profileRes.json();
        setProfile(profileData);
        
        // Fetch exercises
        const exRes = await fetch(`${API_URL}/api/users/${username}/exercises`);
        const exData = await exRes.json();
        setExercises(exData);
        
        // Check if following (if logged in)
        if (token && user?.username !== username) {
          const followRes = await fetch(`${API_URL}/api/users/${username}/is-following`, {
            headers: { 'x-auth-token': token }
          });
          if (followRes.ok) {
            const followData = await followRes.json();
            setIsFollowing(followData.isFollowing);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, token, user]);

  const handleFollow = async () => {
    if (!token) return;
    setFollowLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/users/${username}/follow`, {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setProfile(prev => prev ? {
          ...prev,
          followersCount: data.followersCount
        } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Cargando perfil...
        </div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container>
        <EmptyState>
          <h3>Usuario no encontrado</h3>
          <p>El usuario "{username}" no existe.</p>
          <Link to="/ejercicios" style={{ color: 'var(--accent-primary)' }}>
            Volver a ejercicios
          </Link>
        </EmptyState>
      </Container>
    );
  }

  const isOwnProfile = user?.username === username;

  return (
    <Container>
      <ProfileHeader>
        <Avatar>
          {profile.username.charAt(0).toUpperCase()}
        </Avatar>
        
        <ProfileInfo>
          <Username>{profile.username}</Username>
          {profile.bio && <Bio>{profile.bio}</Bio>}
          
          <Stats>
            <Stat>
              <div className="number">{profile.exerciseCount}</div>
              <div className="label">Ejercicios</div>
            </Stat>
            <Stat>
              <div className="number">{profile.followersCount}</div>
              <div className="label">Seguidores</div>
            </Stat>
            <Stat>
              <div className="number">{profile.followingCount}</div>
              <div className="label">Siguiendo</div>
            </Stat>
          </Stats>
          
          {isAuthenticated && !isOwnProfile && (
            <FollowButton 
              $isFollowing={isFollowing}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? '...' : isFollowing ? '✓ Siguiendo' : '+ Seguir'}
            </FollowButton>
          )}
          
          {isOwnProfile && (
            <Link to="/my-space" style={{ 
              color: 'var(--accent-primary)', 
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}>
              Ir a Mi Espacio →
            </Link>
          )}
        </ProfileInfo>
      </ProfileHeader>

      <SectionTitle>
        📚 Ejercicios de {profile.username}
      </SectionTitle>
      
      {exercises.length === 0 ? (
        <EmptyState>
          <h3>Sin ejercicios públicos</h3>
          <p>Este usuario aún no tiene ejercicios publicados.</p>
        </EmptyState>
      ) : (
        <Grid>
          {exercises.map(exercise => (
            <ExerciseCard key={exercise._id} exercise={exercise} />
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default AuthorProfile;
