// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profil {
  id: string;
  name: string;
  avatar_url: string | null;
  wohnort: string | null;
  kinder_anzahl: number | null;
  kinder_alter: string[] | null;
  bio: string | null;
}

interface AuthCtx {
  session: Session | null;
  user: SupabaseUser | null;
  profil: Profil | null;
  laden: boolean;
  signIn:  (email: string, passwort: string) => Promise<string | null>;
  signUp:  (email: string, passwort: string, name: string, anzeigename?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  profilAktualisieren: (daten: Partial<Profil>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<SupabaseUser | null>(null);
  const [profil, setProfil]     = useState<Profil | null>(null);
  const [laden, setLaden]       = useState(true);

  const ladeProfil = async (id: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    if (data) setProfil(data as Profil);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) ladeProfil(session.user.id);
      setLaden(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) ladeProfil(session.user.id);
      else setProfil(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, passwort: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
    return error?.message ?? null;
  };

  const signUp = async (email: string, passwort: string, name: string, anzeigename?: string) => {
    const { error } = await supabase.auth.signUp({
      email, password: passwort, options: { data: { name, anzeigename: anzeigename || name.split(' ')[0] } },
    });
    return error?.message ?? null;
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const profilAktualisieren = async (daten: Partial<Profil>) => {
    if (!user) return;
    await supabase.from('users').update(daten).eq('id', user.id);
    setProfil(prev => prev ? { ...prev, ...daten } : null);
  };

  return (
    <Ctx.Provider value={{ session, user, profil, laden, signIn, signUp, signOut, profilAktualisieren }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth außerhalb AuthProvider');
  return ctx;
};
