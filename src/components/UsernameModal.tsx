'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UsernameModalProps {
    isOpen: boolean;
}

export function UsernameModal({ isOpen }: UsernameModalProps) {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { createUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        if (username.trim().length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }

        if (username.trim().length > 20) {
            setError('Username must be less than 20 characters long');
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
            setError('Username can only contain letters, numbers, hyphens, and underscores');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await createUser(username.trim());
            // User creation and session creation is handled by createUser
        } catch (error) {
            console.error('Error creating user:', error);
            setError(error instanceof Error ? error.message : 'Failed to create user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        setError(''); // Clear error when user types
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Welcome to Restrain Yourself
                            </h2>
                            <p className="text-gray-600">
                                Choose a username to get started on your journey
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={handleInputChange}
                                    placeholder="Enter your username"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                {error && (
                                    <p className="text-red-500 text-sm mt-2">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                                <p>• Must be 3-20 characters long</p>
                                <p>• Can only contain letters, numbers, hyphens, and underscores</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !username.trim() || username.trim().length < 3}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating Profile...
                                    </>
                                ) : (
                                    'Create Profile'
                                )}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
