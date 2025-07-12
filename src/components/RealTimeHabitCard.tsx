'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Habit, HabitEntry } from '@/types';
import { formatDate } from '@/utils';

interface RealTimeHabitCardProps {
    habit: Habit;
    selectedDate: Date;
    entries: HabitEntry[];
    onToggle: (habitId: string, completed: boolean) => void;
    onViewStats: (habit: Habit) => void;
    onRemove: (habitId: string) => void;

    // Real-time state
    isLoading?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    isOptimistic?: boolean;
    isOnline?: boolean;
    onRetry?: (habitId: string) => void;
    onClearError?: (habitId: string) => void;
}

export const RealTimeHabitCard: React.FC<RealTimeHabitCardProps> = ({
    habit,
    selectedDate,
    entries,
    onToggle,
    onViewStats,
    onRemove,
    isLoading = false,
    hasError = false,
    errorMessage,
    isOptimistic = false,
    isOnline = true,
    onRetry,
    onClearError,
}) => {
    const dateString = formatDate(selectedDate);
    const entry = entries.find(e => e.habitId === habit.id && e.date === dateString);
    const isCompleted = entry?.completed || false;
    const isTemporary = entry?.id.startsWith('temp-') || false;

    // Get the icon component from Lucide
    const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const IconComponent = iconMap[habit.icon] || LucideIcons.Circle;

    const handleToggle = () => {
        if (isLoading) return; // Prevent multiple clicks during loading

        if (hasError && onClearError) {
            onClearError(habit.id);
        }

        onToggle(habit.id, !isCompleted);
    };

    const handleRetry = () => {
        if (onRetry) {
            onRetry(habit.id);
        }
    };

    // Determine button state and styling
    const getButtonState = () => {
        if (hasError) {
            return {
                className: 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200',
                text: '⚠️ Failed to Save',
                disabled: false
            };
        }

        if (isLoading) {
            return {
                className: 'bg-blue-100 text-blue-700 border-2 border-blue-300 cursor-wait',
                text: '⏳ Saving...',
                disabled: true
            };
        }

        if (isCompleted) {
            const baseClass = 'bg-green-500 text-white shadow-lg hover:bg-green-600';
            const optimisticClass = isTemporary ? 'opacity-75 animate-pulse' : '';
            return {
                className: `${baseClass} ${optimisticClass}`,
                text: isTemporary ? '✓ Saving...' : '✓ Completed Today',
                disabled: false
            };
        }

        return {
            className: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            text: 'Mark as Complete',
            disabled: false
        };
    };

    const buttonState = getButtonState();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300 relative gpu-accelerate mobile-habit-card ${!isOnline ? 'ring-2 ring-orange-200' : ''
                }`}
        >
            {/* Offline indicator */}
            {!isOnline && (
                <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <LucideIcons.WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Offline</span>
                </div>
            )}

            {/* Optimistic update indicator */}
            {isOptimistic && (
                <div className="absolute top-2 left-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="hidden sm:inline">Syncing</span>
                </div>
            )}

            <div className="flex items-center justify-between mb-4 gap-3 mobile-habit-card-header">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 mobile-habit-icon ${isLoading ? 'animate-pulse' : ''
                            }`}
                        style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                    >
                        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate mobile-habit-card-title">{habit.name}</h3>
                        {habit.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 mobile-habit-card-description">{habit.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 mobile-action-buttons">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onViewStats(habit)}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors mobile-action-btn mobile-touch-target"
                    >
                        <span className="hidden sm:inline">View Stats</span>
                        <span className="sm:hidden">📊</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: isLoading ? 1 : 1.05 }}
                        whileTap={{ scale: isLoading ? 1 : 0.95 }}
                        onClick={() => !isLoading && onRemove(habit.id)}
                        disabled={isLoading}
                        className={`p-2 rounded-lg transition-colors font-bold mobile-touch-target ${isLoading
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                            }`}
                        title={isLoading ? "Processing..." : "Remove habit"}
                    >
                        {isLoading ? '⏳' : '×'}
                    </motion.button>
                </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
                {hasError && errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg mobile-slide-up"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LucideIcons.AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-red-700">{errorMessage}</span>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="text-xs text-red-600 hover:text-red-800 underline mobile-touch-target"
                            >
                                Retry
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main action button */}
            <motion.button
                whileHover={!buttonState.disabled ? { scale: 1.02 } : {}}
                whileTap={!buttonState.disabled ? { scale: 0.98 } : {}}
                onClick={handleToggle}
                disabled={buttonState.disabled}
                className={`
          w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 text-base mobile-toggle-btn mobile-touch-target mobile-tap-highlight mobile-focus-ring
          ${buttonState.className}
          ${buttonState.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <div className="flex items-center justify-center gap-2">
                    {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    {buttonState.text}
                </div>
            </motion.button>

            {/* Progress indicator for real-time sync */}
            {(isLoading || isTemporary) && (
                <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                        />
                    </div>
                </div>
            )}

            {/* Last sync indicator */}
            {entry && !isTemporary && (
                <div className="mt-3 text-xs text-gray-500 text-center">
                    <span className="hidden sm:inline">Last synced: {new Date(entry.timestamp).toLocaleTimeString()}</span>
                    <span className="sm:hidden">Synced: {new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
            )}
        </motion.div>
    );
};
