'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Single user mock object
const MOCK_USER: User = {
  id: 'single-user-mode',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'user@gigpro.local',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // No-op or auto-redirect
  const signIn = async (email: string, password: string) => {
    // Simulate successful login
    setUser(MOCK_USER);
    router.push('/');
  };

  const signOut = async () => {
    // In single user mode, signOut effectively does nothing or redirects
    // We can keep the user "logged in" conceptually
    router.push('/');
  };

  const getToken = async () => {
    // Return a dummy token
    return 'mock-token-single-user';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};