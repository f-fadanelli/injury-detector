import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthContextType } from '../types';
import { apiRequest, setToken, clearToken, getToken } from '../services/apiClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ATHLETE_KEY = 'injurydetector_athlete';

interface LoginResponse {
  token: string;
  athlete: { id: string; name: string | null; email: string };
}

interface StoredAthlete {
  id: string;
  name: string | null;
  photo: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [athletePhoto, setAthletePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura a sessão do localStorage ao montar.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const token = getToken();
    const stored = localStorage.getItem(ATHLETE_KEY);
    if (token && stored) {
      try {
        const a: StoredAthlete = JSON.parse(stored);
        setIsAuthenticated(true);
        setAthleteId(a.id);
        setAthleteName(a.name);
        setAthletePhoto(a.photo);
      } catch {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      setToken(res.token);
      const athlete: StoredAthlete = {
        id: res.athlete.id,
        name: res.athlete.name,
        photo: null,
      };
      localStorage.setItem(ATHLETE_KEY, JSON.stringify(athlete));
      setIsAuthenticated(true);
      setAthleteId(athlete.id);
      setAthleteName(athlete.name);
      setAthletePhoto(null);
      return true;
    } catch {
      return false;
    }
  }

  function logout(): void {
    clearToken();
    localStorage.removeItem(ATHLETE_KEY);
    setIsAuthenticated(false);
    setAthleteId(null);
    setAthleteName(null);
    setAthletePhoto(null);
  }

  const value: AuthContextType = {
    isAuthenticated,
    athleteId,
    athleteName,
    athletePhoto,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
