"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
                const { data: { session } } = await supabase.auth.getSession();
                console.log('Initial session:', session);
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('Auth state changed:', _event, session);
            setSession(session);
            setUser(session?.user ?? null);
            
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
            console.log('Attempting to sign in with email:', email);
            
            // First try direct auth without querying users table
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                console.error('Auth error:', authError);
                throw authError;
            }

            if (authData?.session) {
                console.log('Auth successful, fetching user role');
                
                // Now get the user's role
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('email', email.toLowerCase())
                    .single();

                if (userError) {
                    console.error('Error fetching user role:', userError);
                    throw userError;
                }

                // Update user metadata with role
                const { error: updateError } = await supabase.auth.updateUser({
                    data: { role: userData.role }
                });

                if (updateError) {
                    console.error('Error updating user metadata:', updateError);
                    throw updateError;
                }

                setSession(authData.session);
                setUser(authData.user);
                // If they're a regular setter, send them to my-schedule
                if (userData?.role === 'setter') {
                    router.push('/my-schedule');
                } else {
                    // Head setters go to main schedule
                    router.push('/');
                }
            }
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            setUser(null);
            setSession(null);
            router.push('/auth/login');
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
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