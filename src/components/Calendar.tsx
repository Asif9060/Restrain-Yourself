'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { format, isSameMonth, isToday } from 'date-fns';
import { generateCalendarDays, getDayStatus, formatDate, isDateSelectable, isDateInFuture, isDateTooOld, getDateValidationMessage } from '@/utils';
import { Habit, HabitEntry } from '@/types';

interface CalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    habits: Habit[];
    entries: HabitEntry[];
    currentMonth: Date;
    onMonthChange: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
    selectedDate,
    onDateSelect,
    habits,
    entries,
    currentMonth,
    onMonthChange,
}) => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const days = generateCalendarDays(currentMonth);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const goToPreviousMonth = () => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() - 1);
        onMonthChange(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + 1);
        onMonthChange(newDate);
    };

    const handleDateClick = (day: Date) => {
        // Clear any existing error message
        setErrorMessage(null);

        // Check if the date is selectable
        if (!isDateSelectable(day)) {
            const validationMessage = getDateValidationMessage(day);
            setErrorMessage(validationMessage);

            // Auto-clear error message after 3 seconds
            setTimeout(() => {
                setErrorMessage(null);
            }, 3000);

            return;
        }

        // Date is valid, proceed with selection
        onDateSelect(day);
    };

    const getDayClasses = (day: Date) => {
        const baseClasses = 'w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200';
        const isCurrentMonth = isSameMonth(day, currentMonth);
        const isSelected = formatDate(day) === formatDate(selectedDate);
        const isTodayDate = isToday(day);
        const status = getDayStatus(entries, day, habits);
        const isSelectable = isDateSelectable(day);
        const isFuture = isDateInFuture(day);
        const isTooOld = isDateTooOld(day);

        let classes = baseClasses;

        // Add cursor and interaction styles based on selectability
        if (!isSelectable) {
            classes += ' cursor-not-allowed opacity-50';
        } else {
            classes += ' cursor-pointer hover:scale-105';
        }

        if (!isCurrentMonth) {
            classes += ' text-gray-400';
            if (!isSelectable) {
                classes += ' bg-gray-50';
            }
        } else if (isSelected) {
            classes += ' bg-blue-500 text-white shadow-lg';
        } else if (isTodayDate) {
            classes += ' bg-blue-100 text-blue-700 font-bold';
        } else if (!isSelectable) {
            // Style for disabled dates
            if (isFuture) {
                classes += ' text-gray-400 bg-gray-50 border border-gray-200';
            } else if (isTooOld) {
                classes += ' text-gray-400 bg-gray-50 border border-gray-200';
            }
        } else {
            classes += ' text-gray-700 hover:bg-gray-100';
        }

        // Add status indicators only for current month dates (regardless of selectability)
        if (isCurrentMonth && !isSelected && !isFuture) {
            switch (status) {
                case 'success':
                    classes += ' bg-green-100 text-green-700 border-2 border-green-300';
                    break;
                case 'partial':
                    classes += ' bg-yellow-100 text-yellow-700 border-2 border-yellow-300';
                    break;
                case 'failure':
                    classes += ' bg-red-100 text-red-700 border-2 border-red-300';
                    break;
            }
        }

        return classes;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mobile-calendar">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-touch-target"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </motion.button>

                <h2 className="text-xl font-bold text-gray-800">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToNextMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-touch-target"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </motion.button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 mobile-calendar-weekday"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    const isSelectable = isDateSelectable(day);
                    return (
                        <motion.div
                            key={index}
                            whileHover={isSelectable ? { scale: 1.05 } : {}}
                            whileTap={isSelectable ? { scale: 0.95 } : {}}
                            onClick={() => handleDateClick(day)}
                            className={`${getDayClasses(day)} mobile-calendar-day mobile-touch-target mobile-tap-highlight`}
                            title={
                                !isSelectable
                                    ? getDateValidationMessage(day) || "This date cannot be selected"
                                    : undefined
                            }
                        >
                            {format(day, 'd')}
                        </motion.div>
                    );
                })}
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 mobile-slide-up"
                    >
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-700">{errorMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Legend */}
            <div className="mt-6 space-y-3">
                <div className="mobile-calendar-legend">
                    <div className="mobile-calendar-legend-item">
                        <div className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded"></div>
                        <span className="text-gray-600">All completed</span>
                    </div>
                    <div className="mobile-calendar-legend-item">
                        <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                        <span className="text-gray-600">Partial</span>
                    </div>
                    <div className="mobile-calendar-legend-item">
                        <div className="w-3 h-3 bg-red-100 border-2 border-red-300 rounded"></div>
                        <span className="text-gray-600">None completed</span>
                    </div>
                    <div className="mobile-calendar-legend-item">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span className="text-gray-600">Today</span>
                    </div>
                </div>
                <div className="mobile-calendar-legend">
                    <div className="mobile-calendar-legend-item col-span-2">
                        <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded opacity-50"></div>
                        <span className="text-gray-500">Cannot select</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
