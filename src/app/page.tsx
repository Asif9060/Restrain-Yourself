
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, Wifi, WifiOff } from 'lucide-react';
import { format, isToday } from 'date-fns';

import { Calendar } from '@/components/Calendar';
import { RealTimeHabitCard } from '@/components/RealTimeHabitCard';
import { AddHabitModal } from '@/components/AddHabitModal';
import { StatsModal } from '@/components/StatsModal';
import { MotivationalContent } from '@/components/MotivationalContent';
import { Header } from '@/components/Header';
import { DateInfo } from '@/components/DateInfo';
import { EmptyState } from '@/components/EmptyState';
import { UsernameModal } from '@/components/UsernameModal';
import { AdminContentManager } from '@/components/AdminContentManager';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeHabitTracker } from '@/hooks/useRealTimeHabitTracker';
import { Habit } from '@/types';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const {
    habits,
    entries,
    selectedDate,
    currentMonth,
    loadingStates,
    errors,
    isOnline,
    optimisticUpdates,
    offlineQueue,
    setSelectedDate,
    setCurrentMonth,
    addHabit,
    toggleHabitEntry,
    getTodayStats,
    clearError,
  } = useRealTimeHabitTracker();

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const todayStats = getTodayStats();
  const isSelectedDateToday = isToday(selectedDate);

  const handleViewStats = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowStats(true);
  };

  const handleCloseStats = () => {
    setShowStats(false);
    setSelectedHabit(null);
  };

  const handleRetryToggle = (habitId: string) => {
    // Find the last entry for this habit and retry the toggle
    const lastEntry = entries.find(e => e.habitId === habitId);
    if (lastEntry) {
      toggleHabitEntry(habitId, !lastEntry.completed);
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show username modal if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <UsernameModal isOpen={true} />
      </div>
    );
  }

  return (
    <div className="prevent-layout-shift bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-sm text-center z-50">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            You&apos;re offline. Changes will sync when connection is restored.
            {offlineQueue > 0 && <span>({offlineQueue} pending)</span>}
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        todayStats={todayStats}
        onAddHabit={() => setShowAddHabit(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        showTodayStats={isSelectedDateToday && habits.length > 0}
      />

      {/* Main Content */}
      <main className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${!isOnline ? 'pt-16' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-5rem)]">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-1 flex flex-col">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              habits={habits}
              entries={entries}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />

            {/* Date Info below Calendar */}
            <div className="mt-4">
              <DateInfo selectedDate={selectedDate} todayStats={todayStats} />
            </div>
          </div>

          {/* Middle Column - Habits (Larger) */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isSelectedDateToday ? `Today's Habits` : `Habits for ${format(selectedDate, 'MMM do')}`}
              </h2>

              <div className="flex items-center gap-3">
                {habits.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BarChart3 className="w-4 h-4" />
                    <span>{habits.length} habit{habits.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Connection status */}
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isOnline
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                  }`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            {/* Habits Container - Full Height */}
            <div className="flex-1 overflow-y-auto habits-scroll">
              {habits.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <EmptyState onAddHabit={() => setShowAddHabit(true)} />
                </div>
              ) : (
                <div className="space-y-4">
                  {habits.map((habit: Habit, index: number) => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <RealTimeHabitCard
                        habit={habit}
                        selectedDate={selectedDate}
                        entries={entries}
                        onToggle={toggleHabitEntry}
                        onViewStats={handleViewStats}
                        isLoading={loadingStates[`toggle-${habit.id}`] || false}
                        hasError={!!errors[`toggle-${habit.id}`]}
                        errorMessage={errors[`toggle-${habit.id}`]}
                        isOptimistic={optimisticUpdates.some(u => u.data.habitId === habit.id)}
                        isOnline={isOnline}
                        onRetry={handleRetryToggle}
                        onClearError={clearError}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Motivational Content */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="flex-1 overflow-y-auto habits-scroll">
              <MotivationalContent habits={habits} />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddHabitModal
        isOpen={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        onAddHabit={addHabit}
        existingHabits={habits}
      />

      <StatsModal
        habit={showStats ? selectedHabit : null}
        entries={entries}
        onClose={handleCloseStats}
      />

      {/* Error Display for general errors */}
      {Object.keys(errors).filter(key => !key.startsWith('toggle-')).map(key => (
        <div key={key} className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{errors[key]}</p>
            <button
              onClick={() => clearError(key)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* Admin Panel */}
      {showAdmin && (
        <AdminContentManager
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}
