// hooks/usePermissions.ts
import { useAuth } from '@/providers/auth-provider';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function usePermissions() {
    const { isHeadSetter } = useAuth();
    return { isHeadSetter, loading: false };
}