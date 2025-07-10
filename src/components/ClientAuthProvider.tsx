'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import the AuthProvider to prevent SSR issues
const AuthProviderClient = dynamic(
    () => import('@/contexts/AuthContext').then((mod) => ({ default: mod.AuthProvider })),
    {
        ssr: false,
        loading: () => <div>Loading...</div>,
    }
);

interface ClientAuthProviderProps {
    children: ReactNode;
}

export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
    return <AuthProviderClient>{children}</AuthProviderClient>;
}
