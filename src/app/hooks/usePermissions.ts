// hooks/usePermissions.ts
import { useAuth } from '@/providers/auth-provider';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function usePermissions() {
    const { user } = useAuth();
    const [isHeadSetter, setIsHeadSetter] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkRole() {
            if (!user?.id) {
                setIsHeadSetter(false);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                
                setIsHeadSetter(data?.role === 'head_setter');
            } catch (error) {
                console.error('Error checking user role:', error);
                setIsHeadSetter(false);
            } finally {
                setLoading(false);
            }
        }

        checkRole();
    }, [user]);

    return { isHeadSetter, loading };
}