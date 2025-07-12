'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { predefinedHabits } from '@/data';
import { Habit, HabitCategory } from '@/types';

interface AddHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    existingHabits: Habit[];
    isLoading?: boolean;
    error?: string;
}

const categoryColors: Record<HabitCategory, string> = {
    'smoking': '#ef4444',
    'drinking': '#f59e0b',
    'adult-content': '#8b5cf6',
    'social-media': '#06b6d4',
    'junk-food': '#10b981',
    'custom': '#6b7280'
};

const availableIcons = [
    'Target', 'Heart', 'Star', 'Trophy', 'Shield', 'Zap', 'Flame', 'Leaf',
    'Sun', 'Moon', 'Coffee', 'Book', 'Music', 'Camera', 'Gamepad2', 'Dumbbell'
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
    isOpen,
    onClose,
    onAddHabit,
    existingHabits,
    isLoading = false,
    error
}) => {
    const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');
    const [customHabit, setCustomHabit] = useState({
        name: '',
        description: '',
        category: 'custom' as HabitCategory,
        icon: 'Target',
        color: categoryColors.custom
    });
    const [localError, setLocalError] = useState<string>('');

    // Filter out already added predefined habits
    const availablePredefinedHabits = predefinedHabits.filter(habit =>
        !existingHabits.some(existing => existing.name === habit.name)
    );

    const handleAddPredefined = (habit: typeof predefinedHabits[0]) => {
        onAddHabit({
            ...habit,
            isCustom: false,
            startDate: new Date(),
            isActive: true,
        });
        onClose();
    };

    const handleAddCustom = () => {
        if (!customHabit.name.trim()) return;

        onAddHabit({
            name: customHabit.name.trim(),
            description: customHabit.description.trim(),
            category: customHabit.category,
            icon: customHabit.icon,
            color: customHabit.color,
            isCustom: true,
            startDate: new Date(),
            isActive: true,
        });

        // Reset form
        setCustomHabit({
            name: '',
            description: '',
            category: 'custom',
            icon: 'Target',
            color: categoryColors.custom
        });

        onClose();
    };

    const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="fixed inset-0 bg-transparent backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -50 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                            scale: { type: "spring", damping: 20, stiffness: 300 }
                        }}
                        className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mobile-modal mobile-scroll-area"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center justify-between mb-6 mobile-modal-header"
                        >
                            <h2 className="text-2xl font-bold text-gray-800">Add New Habit</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-touch-target"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </motion.div>

                        {/* Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ delay: 0.15 }}
                            className="flex mb-6 bg-gray-100 rounded-lg p-1"
                        >
                            <button
                                onClick={() => setActiveTab('predefined')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors mobile-touch-target ${activeTab === 'predefined'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                <span className="hidden sm:inline">Predefined Habits</span>
                                <span className="sm:hidden">Predefined</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('custom')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors mobile-touch-target ${activeTab === 'custom'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Custom Habit
                            </button>
                        </motion.div>

                        {/* Predefined Habits Tab */}
                        {activeTab === 'predefined' && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-3 mobile-modal-content"
                            >
                                {availablePredefinedHabits.length === 0 ? (
                                    <div className="text-center py-8 mobile-empty-state">
                                        <p className="text-gray-600">All predefined habits have been added!</p>
                                        <p className="text-sm text-gray-500 mt-2">Try creating a custom habit instead.</p>
                                    </div>
                                ) : (
                                    availablePredefinedHabits.map((habit, index) => {
                                        const IconComponent = iconMap[habit.icon] || LucideIcons.Circle;
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mobile-habit-card"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center mobile-habit-icon"
                                                        style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                                                    >
                                                        <IconComponent className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-800 mobile-habit-card-title">{habit.name}</h3>
                                                        <p className="text-sm text-gray-600 mobile-habit-card-description">{habit.description}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddPredefined(habit)}
                                                    disabled={isLoading}
                                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 mobile-btn mobile-touch-target"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </motion.div>
                        )}

                        {/* Custom Habit Tab */}
                        {activeTab === 'custom' && (
                            <div className="space-y-4 mobile-modal-content">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Habit Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={customHabit.name}
                                        onChange={(e) => setCustomHabit(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-form-input"
                                        placeholder="Enter habit name"
                                        maxLength={50}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={customHabit.description}
                                        onChange={(e) => setCustomHabit(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-form-textarea"
                                        placeholder="Describe your habit"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={customHabit.category}
                                        onChange={(e) => {
                                            const category = e.target.value as HabitCategory;
                                            setCustomHabit(prev => ({
                                                ...prev,
                                                category,
                                                color: categoryColors[category]
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-form-select"
                                    >
                                        <option value="custom">Custom</option>
                                        <option value="smoking">Smoking</option>
                                        <option value="drinking">Drinking</option>
                                        <option value="adult-content">Adult Content</option>
                                        <option value="social-media">Social Media</option>
                                        <option value="junk-food">Junk Food</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Icon
                                    </label>
                                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                        {availableIcons.map((iconName) => {
                                            const IconComponent = iconMap[iconName] || LucideIcons.Circle;
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setCustomHabit(prev => ({ ...prev, icon: iconName }))}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors mobile-touch-target ${customHabit.icon === iconName
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <IconComponent className="w-5 h-5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Color
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.values(categoryColors).map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setCustomHabit(prev => ({ ...prev, color }))}
                                                className={`w-8 h-8 rounded-full transition-transform mobile-touch-target ${customHabit.color === color ? 'scale-110 ring-2 ring-gray-300' : ''
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddCustom}
                                    disabled={!customHabit.name.trim() || isLoading}
                                    className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mobile-touch-target"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Plus className="w-5 h-5" />
                                    )}
                                    {isLoading ? 'Creating...' : 'Create Habit'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
