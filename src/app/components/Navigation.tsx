'use client';

// components/Navigation.tsx
import React from 'react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../providers/auth-provider';

const Navigation: React.FC = () => {
    const { user, signOut } = useAuth();

    return (
        <nav className="bg-slate-800 p-4 flex justify-between items-center">
            <div className="text-slate-200">
                {user?.email && (
                    <span>Signed in as: {user.email}</span>
                )}
            </div>
            <Button
                onClick={signOut}
                variant="outline"
                className="bg-slate-700 text-slate-200 hover:bg-slate-600"
            >
                Sign Out
            </Button>
        </nav>
    );
};

export default Navigation;