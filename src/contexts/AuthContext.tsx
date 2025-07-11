'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    createUser: (username: string) => Promise<void>;
    loginUser: (username: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session management constants
const SESSION_STORAGE_KEY = 'restrain_user_session';
const SESSION_EXPIRY_KEY = 'restrain_session_expiry';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const createSession = (userData: User) => {
        const expiryTime = Date.now() + SESSION_DURATION;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
        setUser(userData);
    };

    const extendSession = (userData: User) => {
        const expiryTime = Date.now() + SESSION_DURATION;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
    };

    const clearSession = () => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
        setUser(null);
    };

    const initializeSession = useCallback(async () => {
        try {
            const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
            const sessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);

            // Check if session exists and is not expired
            if (sessionData && sessionExpiry) {
                const expiryTime = parseInt(sessionExpiry, 10);
                const currentTime = Date.now();

                if (currentTime < expiryTime) {
                    const userData = JSON.parse(sessionData);

                    // Verify user still exists in database
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', userData.id)
                        .single();

                    if (data && !error) {
                        const userProfile: User = {
                            id: data.id,
                            username: data.username,
                            createdAt: new Date(data.created_at),
                            updatedAt: new Date(data.updated_at),
                            settings: data.settings as Record<string, unknown> || {},
                            isAdmin: data.is_admin,
                        };

                        setUser(userProfile);
                        // Extend session
                        extendSession(userProfile);
                    } else {
                        // User no longer exists, clear session
                        clearSession();
                    }
                } else {
                    // Session expired
                    clearSession();
                }
            }
        } catch (error) {
            console.error('Error initializing session:', error);
            clearSession();
        } finally {
            setLoading(false);
        }
    }, []);

    // Check for existing session on mount
    useEffect(() => {
        initializeSession();
    }, [initializeSession]);

    const createUser = async (username: string) => {
        setLoading(true);

        try {
            // Generate unique user ID
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create user in database
            const { data, error } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    username: username.trim().toLowerCase(),
                    is_admin: false,
                    settings: {},
                })
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create user: ${error.message}`);
            }

            // Create user profile object
            const userProfile: User = {
                id: data.id,
                username: data.username,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
                settings: data.settings as Record<string, unknown> || {},
                isAdmin: data.is_admin,
            };

            // Create persistent session
            createSession(userProfile);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginUser = async (username: string) => {
        setLoading(true);

        try {
            // Check if user exists in database
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username.trim().toLowerCase())
                .single();

            if (error || !data) {
                throw new Error('Username not found. Please check your username or create a new account.');
            }

            // Create user profile object
            const userProfile: User = {
                id: data.id,
                username: data.username,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
                settings: data.settings as Record<string, unknown> || {},
                isAdmin: data.is_admin,
            };

            // Create persistent session
            createSession(userProfile);
        } catch (error) {
            console.error('Error logging in user:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        clearSession();
    };

    const refreshSession = async () => {
        if (user) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data && !error) {
                    const userProfile: User = {
                        id: data.id,
                        username: data.username,
                        createdAt: new Date(data.created_at),
                        updatedAt: new Date(data.updated_at),
                        settings: data.settings as Record<string, unknown> || {},
                        isAdmin: data.is_admin,
                    };

                    extendSession(userProfile);
                    setUser(userProfile);
                } else {
                    clearSession();
                }
            } catch (error) {
                console.error('Error refreshing session:', error);
                clearSession();
            }
        }
    };

    const value = {
        user,
        loading,
        createUser,
        loginUser,
        signOut,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
