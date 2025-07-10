"use client";

import { useState, useEffect } from "react";
import { Habit, HabitEntry } from "@/types";
import { saveToStorage, loadFromStorage, formatDate } from "@/utils";

export const useHabitTracker = () => {
   const [habits, setHabits] = useState<Habit[]>([]);
   const [entries, setEntries] = useState<HabitEntry[]>([]);
   const [selectedDate, setSelectedDate] = useState(new Date());
   const [currentMonth, setCurrentMonth] = useState(new Date());

   // Load data from localStorage on mount
   useEffect(() => {
      const savedHabits = loadFromStorage<Habit[]>("habits", []);
      const savedEntries = loadFromStorage<HabitEntry[]>("entries", []);

      setHabits(savedHabits);
      setEntries(savedEntries);
   }, []);

   // Save data to localStorage whenever habits or entries change
   useEffect(() => {
      saveToStorage("habits", habits);
   }, [habits]);

   useEffect(() => {
      saveToStorage("entries", entries);
   }, [entries]);

   const addHabit = (habitData: Omit<Habit, "id" | "createdAt">) => {
      const newHabit: Habit = {
         ...habitData,
         id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         createdAt: new Date(),
      };

      setHabits((prev) => [...prev, newHabit]);
   };

   const removeHabit = (habitId: string) => {
      setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
      setEntries((prev) => prev.filter((entry) => entry.habitId !== habitId));
   };

   const toggleHabitEntry = (habitId: string, completed: boolean) => {
      const dateString = formatDate(selectedDate);
      const existingEntryIndex = entries.findIndex(
         (entry) => entry.habitId === habitId && entry.date === dateString
      );

      if (existingEntryIndex >= 0) {
         // Update existing entry
         setEntries((prev) =>
            prev.map((entry, index) =>
               index === existingEntryIndex
                  ? { ...entry, completed, timestamp: new Date() }
                  : entry
            )
         );
      } else {
         // Create new entry
         const newEntry: HabitEntry = {
            habitId,
            date: dateString,
            completed,
            timestamp: new Date(),
         };
         setEntries((prev) => [...prev, newEntry]);
      }
   };

   const getHabitEntry = (
      habitId: string,
      date: Date = selectedDate
   ): HabitEntry | undefined => {
      const dateString = formatDate(date);
      return entries.find(
         (entry) => entry.habitId === habitId && entry.date === dateString
      );
   };

   const getTodayStats = () => {
      const today = formatDate(new Date());
      const todayEntries = entries.filter((entry) => entry.date === today);
      const completedToday = todayEntries.filter((entry) => entry.completed).length;
      const totalHabits = habits.length;

      return {
         completed: completedToday,
         total: totalHabits,
         percentage: totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0,
      };
   };

   return {
      habits,
      entries,
      selectedDate,
      currentMonth,
      setSelectedDate,
      setCurrentMonth,
      addHabit,
      removeHabit,
      toggleHabitEntry,
      getHabitEntry,
      getTodayStats,
   };
};
