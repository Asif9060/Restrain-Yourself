'use client';

import React from 'react';
import { Plus, TrendingUp, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
    todayStats: {
        completed: number;
        total: number;
        percentage: number;
    };
    onAddHabit: () => void;
    onOpenAdmin?: () => void;
    showTodayStats: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    todayStats,
    onAddHabit,
    onOpenAdmin,
    showTodayStats
}) => {
    const { user, signOut } = useAuth();
    return (
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 mobile-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Restrain Yourself</h1>
                            <p className="text-sm text-gray-600">Habit Tracker</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Today's Progress */}
                        {showTodayStats && (
                            <div className="hidden sm:flex md:flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 mobile-progress-hidden">
                                <div className="text-sm">
                                    <span className="text-gray-600">Today: </span>
                                    <span className="font-semibold text-gray-800">
                                        {todayStats.completed}/{todayStats.total}
                                    </span>
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${todayStats.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {/* Admin Button */}
                            {user?.isAdmin && onOpenAdmin && (
                                <button
                                    onClick={onOpenAdmin}
                                    className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors mobile-btn mobile-touch-target"
                                    title="Admin Panel"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="hidden md:inline">Admin</span>
                                </button>
                            )}

                            <button
                                onClick={onAddHabit}
                                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mobile-btn mobile-touch-target"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Habit</span>
                            </button>

                            {/* User Menu */}
                            <div className="relative group mobile-user-menu">
                                <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors mobile-btn mobile-touch-target">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold">
                                            {user?.username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                                        {user?.username}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 mobile-user-dropdown">
                                    <div className="p-3 border-b">
                                        <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                        <p className="text-xs text-gray-500">
                                            Member since {user?.createdAt.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={signOut}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mobile-touch-target"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
