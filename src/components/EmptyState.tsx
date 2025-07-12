'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
    onAddHabit: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddHabit }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center mobile-empty-state"
        >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No habits yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start building better habits by adding your first one. Choose from our predefined habits or create your own custom habit.
            </p>
            <button
                onClick={onAddHabit}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2 mobile-touch-target mobile-tap-highlight"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Your First Habit</span>
                <span className="sm:hidden">Add Habit</span>
            </button>
        </motion.div>
    );
};
