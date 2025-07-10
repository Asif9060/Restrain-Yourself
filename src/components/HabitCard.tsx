'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Habit, HabitEntry } from '@/types';
import { formatDate } from '@/utils';

interface HabitCardProps {
  habit: Habit;
  selectedDate: Date;
  entries: HabitEntry[];
  onToggle: (habitId: string, completed: boolean) => void;
  onViewStats: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  selectedDate,
  entries,
  onToggle,
  onViewStats,
}) => {
  const dateString = formatDate(selectedDate);
  const entry = entries.find(e => e.habitId === habit.id && e.date === dateString);
  const isCompleted = entry?.completed || false;

  // Get the icon component from Lucide
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = iconMap[habit.icon] || LucideIcons.Circle;

  const handleToggle = () => {
    onToggle(habit.id, !isCompleted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
          >
            <IconComponent className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{habit.name}</h3>
            {habit.description && (
              <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewStats(habit)}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
        >
          View Stats
        </motion.button>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleToggle}
        className={`
          w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 text-base
          ${isCompleted 
            ? 'bg-green-500 text-white shadow-lg' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        {isCompleted ? '✓ Completed Today' : 'Mark as Complete'}
      </motion.button>
    </motion.div>
  );
};
