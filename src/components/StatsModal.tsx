'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Habit, HabitEntry } from '@/types';
import { calculateHabitStats, formatDate } from '@/utils';

interface StatsModalProps {
    habit: Habit | null;
    entries: HabitEntry[];
    onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ habit, entries, onClose }) => {
    if (!habit) return null;

    const stats = calculateHabitStats(entries, habit.id);

    // Generate chart data for the last 30 days
    const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date()
    });

    const chartData = last30Days.map(date => {
        const dateString = formatDate(date);
        const entry = entries.find(e => e.habitId === habit.id && e.date === dateString);
        return {
            date: format(date, 'MMM dd'),
            completed: entry?.completed ? 1 : 0,
            dateString
        };
    });

    // Calculate success rate for recent periods
    const last7Days = entries.filter(e =>
        e.habitId === habit.id &&
        new Date(e.date) >= subDays(new Date(), 6)
    );
    const last30DaysEntries = entries.filter(e =>
        e.habitId === habit.id &&
        new Date(e.date) >= subDays(new Date(), 29)
    );

    const weekSuccessRate = last7Days.length > 0 ?
        (last7Days.filter(e => e.completed).length / last7Days.length) * 100 : 0;
    const monthSuccessRate = last30DaysEntries.length > 0 ?
        (last30DaysEntries.filter(e => e.completed).length / last30DaysEntries.length) * 100 : 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-transparent backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                            >
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{habit.name} Statistics</h2>
                                <p className="text-gray-600">{habit.description}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600">Current Streak</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-700">{stats.currentStreak}</p>
                            <p className="text-sm text-blue-600">days</p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Award className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-600">Best Streak</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700">{stats.longestStreak}</p>
                            <p className="text-sm text-green-600">days</p>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">Total Days</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-700">{stats.totalDays}</p>
                            <p className="text-sm text-purple-600">tracked</p>
                        </div>

                        <div className="bg-orange-50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Target className="w-5 h-5 text-orange-600" />
                                <span className="text-sm font-medium text-orange-600">Success Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-700">{stats.successRate.toFixed(1)}%</p>
                            <p className="text-sm text-orange-600">overall</p>
                        </div>
                    </div>

                    {/* Period Success Rates */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Last 7 Days</h3>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${weekSuccessRate}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{weekSuccessRate.toFixed(0)}%</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Last 30 Days</h3>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${monthSuccessRate}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{monthSuccessRate.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Chart */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">30-Day Progress</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={12}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        domain={[0, 1]}
                                        tickFormatter={(value) => value ? 'Yes' : 'No'}
                                        fontSize={12}
                                    />
                                    <Tooltip
                                        formatter={(value) => [value ? 'Completed' : 'Not Completed', 'Status']}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Area
                                        type="stepAfter"
                                        dataKey="completed"
                                        stroke={habit.color}
                                        fillOpacity={0.3}
                                        fill={habit.color}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Last Completed */}
                    {stats.lastCompleted && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Last Completed</h3>
                            <p className="text-gray-600">
                                {format(stats.lastCompleted, 'EEEE, MMMM do, yyyy')}
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
