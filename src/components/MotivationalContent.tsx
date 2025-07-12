'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Quote, RefreshCw, Lightbulb } from 'lucide-react';
import { ContentService } from '@/services/ContentService';
import { Quote as QuoteType, HealthTip, Habit } from '@/types';

interface MotivationalContentProps {
    habits: Habit[];
}

export const MotivationalContent: React.FC<MotivationalContentProps> = ({ habits }) => {
    const [currentQuote, setCurrentQuote] = useState<QuoteType | null>(null);
    const [currentTip, setCurrentTip] = useState<HealthTip | null>(null);
    const [loading, setLoading] = useState(false);

    const loadContent = useCallback(async () => {
        setLoading(true);
        try {
            // Get a random habit category to show content for
            if (habits.length > 0) {
                const randomHabit = habits[Math.floor(Math.random() * habits.length)];
                const quote = await ContentService.getRandomQuote(randomHabit.category);
                setCurrentQuote(quote);

                // Only show health tips for non-custom categories
                if (randomHabit.category !== 'custom') {
                    const tip = await ContentService.getRandomHealthTip(randomHabit.category);
                    setCurrentTip(tip);
                }
            } else {
                const quote = await ContentService.getRandomQuote();
                setCurrentQuote(quote);
            }
        } catch (error) {
            console.error('Error loading motivational content:', error);
        } finally {
            setLoading(false);
        }
    }, [habits]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    const refreshContent = async () => {
        await loadContent();
    };

    if (loading) {
        return (
            <div className="space-y-6 mobile-motivational">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mobile-motivational-item">
                    <div className="animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-200 rounded-full"></div>
                            <div className="h-4 bg-blue-200 rounded w-32"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-blue-200 rounded w-full"></div>
                            <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                        </div>
                        <div className="h-3 bg-blue-200 rounded w-24 mt-3"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 mobile-motivational">
            {/* Daily Quote */}
            {currentQuote && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mobile-motivational-item"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <Quote className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mobile-motivational h3">Daily Inspiration</h3>
                        </div>
                        <button
                            onClick={refreshContent}
                            disabled={loading}
                            className="p-2 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50 mobile-touch-target"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <blockquote className="text-gray-700 text-base italic mb-3">
                        &ldquo;{currentQuote.text}&rdquo;
                    </blockquote>
                    <p className="text-gray-600 font-medium">— {currentQuote.author}</p>
                </motion.div>
            )}

            {/* Health Tip */}
            {currentTip && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 mobile-motivational-item"
                >
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">{currentTip.title}</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">{currentTip.content}</p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                    {currentTip.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* No Habits Message */}
            {habits.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 text-center mobile-empty-state"
                >
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Quote className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to Restrain Yourself!</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Start your journey by adding your first habit. Track your progress, stay motivated, and build better habits one day at a time.
                    </p>
                    <div className="bg-white/50 rounded-lg p-4">
                        <p className="text-gray-700 text-sm italic">
                            &ldquo;The secret of getting ahead is getting started.&rdquo;
                        </p>
                        <p className="text-gray-600 text-sm mt-2">— Mark Twain</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
