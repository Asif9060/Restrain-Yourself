import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { Habit, HabitEntry, HabitStats } from "@/types";

export const formatDate = (date: Date): string => {
   return format(date, "yyyy-MM-dd");
};

export const parseDate = (dateString: string): Date => {
   return parseISO(dateString);
};

export const isDateToday = (date: Date): boolean => {
   return isToday(date);
};

export const isDatePast = (date: Date): boolean => {
   return isBefore(startOfDay(date), startOfDay(new Date()));
};

// Date validation for calendar selection
export const isDateSelectable = (date: Date): boolean => {
   const today = startOfDay(new Date());
   const yesterday = new Date(today);
   yesterday.setDate(yesterday.getDate() - 1);
   const checkDate = startOfDay(date);

   return (
      checkDate.getTime() === today.getTime() ||
      checkDate.getTime() === yesterday.getTime()
   );
};

export const isDateInFuture = (date: Date): boolean => {
   const today = startOfDay(new Date());
   const checkDate = startOfDay(date);

   return checkDate.getTime() > today.getTime();
};

export const isDateTooOld = (date: Date): boolean => {
   const today = startOfDay(new Date());
   const yesterday = new Date(today);
   yesterday.setDate(yesterday.getDate() - 1);
   const checkDate = startOfDay(date);

   return checkDate.getTime() < yesterday.getTime();
};

export const getDateValidationMessage = (date: Date): string | null => {
   if (isDateInFuture(date)) {
      return "Future dates cannot be selected. Please choose today or yesterday.";
   }
   if (isDateTooOld(date)) {
      return "This date is too old. Please choose today or yesterday.";
   }
   return null;
};

export const calculateStreak = (
   entries: HabitEntry[],
   habitId: string,
   fromDate: Date
): number => {
   const habitEntries = entries
      .filter((entry) => entry.habitId === habitId && entry.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

   if (habitEntries.length === 0) return 0;

   let streak = 0;
   const currentDate = new Date(startOfDay(fromDate));

   for (const entry of habitEntries) {
      const entryDate = startOfDay(parseDate(entry.date));

      if (entryDate.getTime() === currentDate.getTime()) {
         streak++;
         currentDate.setDate(currentDate.getDate() - 1);
      } else {
         break;
      }
   }

   return streak;
};

export const calculateHabitStats = (
   entries: HabitEntry[],
   habitId: string
): HabitStats => {
   const habitEntries = entries.filter((entry) => entry.habitId === habitId);
   const completedEntries = habitEntries.filter((entry) => entry.completed);

   const currentStreak = calculateStreak(entries, habitId, new Date());

   // Calculate longest streak
   let longestStreak = 0;
   let tempStreak = 0;
   const sortedEntries = habitEntries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
   );

   for (let i = 0; i < sortedEntries.length; i++) {
      if (sortedEntries[i].completed) {
         tempStreak++;
         longestStreak = Math.max(longestStreak, tempStreak);
      } else {
         tempStreak = 0;
      }
   }

   const successRate =
      habitEntries.length > 0 ? (completedEntries.length / habitEntries.length) * 100 : 0;
   const lastCompleted =
      completedEntries.length > 0
         ? new Date(Math.max(...completedEntries.map((e) => new Date(e.date).getTime())))
         : undefined;

   return {
      habitId,
      currentStreak,
      longestStreak,
      totalDays: habitEntries.length,
      successRate,
      lastCompleted,
   };
};

export const getDayStatus = (
   entries: HabitEntry[],
   date: Date,
   habits: Habit[]
): "success" | "partial" | "failure" | "none" => {
   const dateString = formatDate(date);
   const dayEntries = entries.filter((entry) => entry.date === dateString);

   if (dayEntries.length === 0) return "none";

   const completedCount = dayEntries.filter((entry) => entry.completed).length;
   const totalHabits = habits.length;

   if (completedCount === totalHabits) return "success";
   if (completedCount > 0) return "partial";
   return "failure";
};

export const generateCalendarDays = (date: Date): Date[] => {
   const year = date.getFullYear();
   const month = date.getMonth();
   const firstDay = new Date(year, month, 1);
   const startDate = new Date(firstDay);
   startDate.setDate(startDate.getDate() - firstDay.getDay());

   const days = [];
   const currentDate = new Date(startDate);

   for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
   }

   return days;
};

// Local storage utilities
export const saveToStorage = (key: string, data: unknown): void => {
   if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data));
   }
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
   if (typeof window !== "undefined") {
      const stored = localStorage.getItem(key);
      if (stored) {
         try {
            return JSON.parse(stored);
         } catch {
            return defaultValue;
         }
      }
   }
   return defaultValue;
};
