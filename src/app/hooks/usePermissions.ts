// hooks/usePermissions.ts
import { useAuth } from '@/providers/auth-provider';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function usePermissions() {
    const { user } = useAuth();
    const [isHeadSetter, setIsHeadSetter] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false); // Add isAdmin state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkRole() {
            if (!user?.id) {
                setIsHeadSetter(false);
                setIsAdmin(false); // Initialize isAdmin to false as well
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
                setIsAdmin(data?.role === 'admin'); // Check for admin role and set isAdmin state

            } catch (error) {
                console.error('Error checking user role:', error);
                setIsHeadSetter(false);
                setIsAdmin(false); // Set isAdmin to false in case of error
            } finally {
                setLoading(false);
            }
        }

        checkRole();
    }, [user]);

    return { isHeadSetter, isAdmin, loading }; // Return isAdmin in the hook
}