"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signIn: async () => {},
    signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Get initial session
                const { data: { session } } = await supabase.auth.getSession();
                console.log('Initial session check:', { session });
                
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            } catch (error) {
                console.error('Error checking session:', error);
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('Auth state changed:', { event: _event, session });
            setSession(session);
            setUser(session?.user ?? null);
            
            // Handle navigation based on session state
            if (!session && !window.location.pathname.startsWith('/auth/')) {
                router.push('/auth/login');
            } else if (session && window.location.pathname.startsWith('/auth/')) {
                router.push('/');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data?.session) {
                router.push('/');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signIn,
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};