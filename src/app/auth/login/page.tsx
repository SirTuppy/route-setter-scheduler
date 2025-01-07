// app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Let the AuthProvider handle all the logic
            await signIn(email, password);
            console.log('Sign in completed');
        } catch (error: any) {
            console.error('Login error details:', error);
            setError(error.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-slate-100">
                        Sign In
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400
                                focus:border-blue-500 focus:ring-blue-500
                                [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(241,245,249)]
                                [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgb(51,65,85)_inset]"
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400
                                focus:border-blue-500 focus:ring-blue-500
                                [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(241,245,249)]
                                [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgb(51,65,85)_inset]"
                            />
                        </div>
                        {error && (
                            <div className="text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}