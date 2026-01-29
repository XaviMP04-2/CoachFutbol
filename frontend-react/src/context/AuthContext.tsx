import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { jwtDecode } from "jwt-decode";
import API_URL from '../config';

interface User {
  id: string;
  username?: string;
  email?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  // Favorites
  favorites: string[];
  isFavorite: (exerciseId: string) => boolean;
  toggleFavorite: (exerciseId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Check expiry
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decoded.user);
        }
      } catch (err) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  // Fetch favorites when user logs in
  useEffect(() => {
    if (user && token) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user, token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setFavorites([]);
  };

  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/favorites/ids`, {
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        const ids = await res.json();
        setFavorites(ids.map((id: any) => id.toString()));
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const isFavorite = (exerciseId: string) => {
    return favorites.includes(exerciseId);
  };

  const toggleFavorite = async (exerciseId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/favorites/${exerciseId}`, {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isFavorite) {
          setFavorites(prev => [...prev, exerciseId]);
        } else {
          setFavorites(prev => prev.filter(id => id !== exerciseId));
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!user, 
      loading, 
      login, 
      logout,
      favorites,
      isFavorite,
      toggleFavorite,
      fetchFavorites
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
