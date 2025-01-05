"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isHeadSetter: boolean;  // Add this
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
    const [isHeadSetter, setIsHeadSetter] = useState(false);
    const router = useRouter();
    
// Add this function
const checkRole = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) throw error;
        setIsHeadSetter(data?.role === 'head_setter');
    } catch (error) {
        console.error('Error checking role:', error);
        setIsHeadSetter(false);
    }
};

// Then modify your handleSession function to use this:
const handleSession = async (newSession: Session | null) => {
    if (!newSession) {
        setSession(null);
        setUser(null);
        setIsHeadSetter(false);
        return;
    }

    try {
        // First try to update any existing session
        const { error: updateError } = await supabase
            .from('active_sessions')
            .upsert({
                user_id: newSession.user.id,
                last_seen: new Date().toISOString()
            }, {
                onConflict: 'user_id',
                ignoreDuplicates: false
            });

        if (updateError) {
            console.error('Error updating session:', updateError);
            // If error isn't just a duplicate, try to clear and create new
            await supabase
                .from('active_sessions')
                .delete()
                .eq('user_id', newSession.user.id);

            const { error: insertError } = await supabase
                .from('active_sessions')
                .insert({
                    user_id: newSession.user.id,
                    last_seen: new Date().toISOString()
                });

            if (insertError) {
                console.error('Error creating new session:', insertError);
                return;
            }
        }

        setSession(newSession);
        setUser(newSession.user);
        await checkRole(newSession.user.id);  // Add this
    } catch (error) {
        console.error('Session handling error:', error);
    }
};

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push('/auth/login');
            }
            handleSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (_event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    router.replace('/auth/login');
                } else if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
                    await handleSession(session);
                    router.replace('/');
                }
            }
        );

        // Ping to keep session alive
        const pingInterval = setInterval(async () => {
            if (user?.id) {
                await supabase
                    .from('active_sessions')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('user_id', user.id);
            }
        }, 30000);

        return () => {
            subscription.unsubscribe();
            clearInterval(pingInterval);
        };
    }, [router, user?.id]);

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data?.session) {
                await handleSession(data.session);
                router.push('/');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

const signOut = async () => {
    try {
        if (user?.id) {
            await supabase
                .from('active_sessions')
                .delete()
                .eq('user_id', user.id);
        }
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Error during sign out:', error);
    }
};

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            isHeadSetter,
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