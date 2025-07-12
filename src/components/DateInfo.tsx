'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { format, isToday } from 'date-fns';

interface DateInfoProps {
    selectedDate: Date;
    todayStats: {
        completed: number;
        total: number;
        percentage: number;
    };
}

export const DateInfo: React.FC<DateInfoProps> = ({ selectedDate, todayStats }) => {
    const isSelectedDateToday = isToday(selectedDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-5 mobile-date-info"
        >
            <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-500" />
                <h3 className="text-base font-semibold text-gray-800">
                    <span className="hidden sm:inline">{format(selectedDate, 'EEEE, MMM do')}</span>
                    <span className="sm:hidden">{format(selectedDate, 'MMM do')}</span>
                </h3>
            </div>

            {isSelectedDateToday ? (
                <div className="bg-blue-50 rounded-lg p-4 mobile-stats">
                    <p className="text-blue-700 font-medium mobile-stats-title">Today&apos;s Progress</p>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1 bg-blue-200 rounded-full h-3">
                            <div
                                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${todayStats.percentage}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-medium text-blue-700 mobile-stats-value">
                            {todayStats.completed}/{todayStats.total}
                        </span>
                    </div>
                    <p className="text-sm text-blue-600 mt-3">
                        {todayStats.percentage === 100 ?
                            '🎉 Perfect day! All habits completed!' :
                            `${Math.round(todayStats.percentage)}% complete - keep going!`
                        }
                    </p>
                </div>
            ) : (
                <div className="bg-gray-50 rounded-lg p-4 mobile-stats">
                    <p className="text-gray-600 text-sm">
                        {selectedDate > new Date() ?
                            'Future date - plan your habits!' :
                            'Past date - review your progress'
                        }
                    </p>
                </div>
            )}
        </motion.div>
    );
};
