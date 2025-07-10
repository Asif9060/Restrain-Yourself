"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Habit, HabitEntry, HabitStats } from "@/types";
import { formatDate } from "@/utils";

export const useSupabaseHabitTracker = () => {
   const { user } = useAuth();
   const [habits, setHabits] = useState<Habit[]>([]);
   const [entries, setEntries] = useState<HabitEntry[]>([]);
   const [selectedDate, setSelectedDate] = useState(new Date());
   const [currentMonth, setCurrentMonth] = useState(new Date());
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const loadHabits = useCallback(async () => {
      if (!user) return;

      const { data, error: habitsError } = await supabase
         .from("habits")
         .select("*")
         .eq("user_id", user.id)
         .eq("is_active", true)
         .order("created_at", { ascending: false });

      if (habitsError) {
         console.error("Error loading habits:", habitsError);
         setError("Failed to load habits");
         return;
      }

      const transformedHabits: Habit[] = data.map((habit) => ({
         id: habit.id,
         userId: habit.user_id,
         name: habit.name,
         category: habit.category as Habit["category"],
         color: habit.color,
         icon: habit.icon,
         isCustom: habit.is_custom,
         createdAt: new Date(habit.created_at),
         updatedAt: new Date(habit.updated_at),
         startDate: new Date(habit.start_date),
         isActive: habit.is_active,
         description: habit.description || undefined,
      }));

      setHabits(transformedHabits);
   }, [user]);

   const loadEntries = useCallback(async () => {
      if (!user) return;

      const { data, error: entriesError } = await supabase
         .from("habit_entries")
         .select("*")
         .eq("user_id", user.id)
         .order("date", { ascending: false });

      if (entriesError) {
         console.error("Error loading entries:", entriesError);
         setError("Failed to load entries");
         return;
      }

      const transformedEntries: HabitEntry[] = data.map((entry) => ({
         id: entry.id,
         habitId: entry.habit_id,
         userId: entry.user_id,
         date: entry.date,
         completed: entry.completed,
         timestamp: new Date(entry.timestamp),
         notes: entry.notes || undefined,
      }));

      setEntries(transformedEntries);
   }, [user]);

   const loadUserData = useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
         await Promise.all([loadHabits(), loadEntries()]);
      } catch (err) {
         setError("Failed to load user data");
         console.error("Error loading user data:", err);
      } finally {
         setLoading(false);
      }
   }, [loadHabits, loadEntries]);

   // Load user's habits and entries
   useEffect(() => {
      if (user) {
         loadUserData();

         // Set up real-time subscription for habits
         const habitsSubscription = supabase
            .channel("habits-changes")
            .on(
               "postgres_changes",
               {
                  event: "*",
                  schema: "public",
                  table: "habits",
                  filter: `user_id=eq.${user.id}`,
               },
               () => {
                  loadHabits();
               }
            )
            .subscribe();

         // Set up real-time subscription for habit entries
         const entriesSubscription = supabase
            .channel("entries-changes")
            .on(
               "postgres_changes",
               {
                  event: "*",
                  schema: "public",
                  table: "habit_entries",
                  filter: `user_id=eq.${user.id}`,
               },
               () => {
                  loadEntries();
               }
            )
            .subscribe();

         return () => {
            habitsSubscription.unsubscribe();
            entriesSubscription.unsubscribe();
         };
      } else {
         // Clear data when user is not authenticated
         setHabits([]);
         setEntries([]);
      }
   }, [user, loadHabits, loadEntries, loadUserData]);

   const addHabit = async (
      habitData: Omit<Habit, "id" | "userId" | "createdAt" | "updatedAt">
   ) => {
      if (!user) {
         setError("User not authenticated");
         return;
      }

      setLoading(true);
      setError(null);

      try {
         const { error: insertError } = await supabase
            .from("habits")
            .insert({
               user_id: user.id,
               name: habitData.name,
               category: habitData.category,
               color: habitData.color,
               icon: habitData.icon,
               is_custom: habitData.isCustom,
               description: habitData.description,
               start_date: formatDate(habitData.startDate),
               is_active: habitData.isActive,
            })
            .select()
            .single();

         if (insertError) {
            setError("Failed to add habit");
            console.error("Error adding habit:", insertError);
            return;
         }

         // Real-time subscription will handle updating the local state
      } catch (err) {
         setError("Failed to add habit");
         console.error("Error adding habit:", err);
      } finally {
         setLoading(false);
      }
   };

   const removeHabit = async (habitId: string) => {
      if (!user) {
         setError("User not authenticated");
         return;
      }

      setLoading(true);
      setError(null);

      try {
         // Soft delete by setting is_active to false
         const { error: updateError } = await supabase
            .from("habits")
            .update({ is_active: false })
            .eq("id", habitId)
            .eq("user_id", user.id);

         if (updateError) {
            setError("Failed to remove habit");
            console.error("Error removing habit:", updateError);
            return;
         }

         // Real-time subscription will handle updating the local state
      } catch (err) {
         setError("Failed to remove habit");
         console.error("Error removing habit:", err);
      } finally {
         setLoading(false);
      }
   };

   const toggleHabitEntry = async (
      habitId: string,
      completed: boolean,
      notes?: string
   ) => {
      if (!user) {
         setError("User not authenticated");
         return;
      }

      const dateString = formatDate(selectedDate);
      const existingEntry = entries.find(
         (entry) => entry.habitId === habitId && entry.date === dateString
      );

      setError(null);

      try {
         if (existingEntry) {
            // Update existing entry
            const { error: updateError } = await supabase
               .from("habit_entries")
               .update({
                  completed,
                  timestamp: new Date().toISOString(),
                  notes: notes || null,
               })
               .eq("id", existingEntry.id)
               .eq("user_id", user.id);

            if (updateError) {
               setError("Failed to update habit entry");
               console.error("Error updating habit entry:", updateError);
               return;
            }
         } else {
            // Create new entry
            const { error: insertError } = await supabase.from("habit_entries").insert({
               habit_id: habitId,
               user_id: user.id,
               date: dateString,
               completed,
               timestamp: new Date().toISOString(),
               notes: notes || null,
            });

            if (insertError) {
               setError("Failed to create habit entry");
               console.error("Error creating habit entry:", insertError);
               return;
            }
         }

         // Real-time subscription will handle updating the local state
      } catch (err) {
         setError("Failed to update habit entry");
         console.error("Error updating habit entry:", err);
      }
   };

   const getHabitEntry = useCallback(
      (habitId: string, date: Date = selectedDate): HabitEntry | undefined => {
         const dateString = formatDate(date);
         return entries.find(
            (entry) => entry.habitId === habitId && entry.date === dateString
         );
      },
      [entries, selectedDate]
   );

   const getTodayStats = useCallback(() => {
      const today = formatDate(new Date());
      const todayEntries = entries.filter((entry) => entry.date === today);
      const completedToday = todayEntries.filter((entry) => entry.completed).length;
      const totalHabits = habits.length;

      return {
         completed: completedToday,
         total: totalHabits,
         percentage: totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0,
      };
   }, [entries, habits]);

   const getHabitStats = useCallback(
      (habitId: string): HabitStats => {
         const habitEntries = entries
            .filter((entry) => entry.habitId === habitId)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

         const completedEntries = habitEntries.filter((entry) => entry.completed);
         const totalDays = habitEntries.length;
         const successRate =
            totalDays > 0 ? (completedEntries.length / totalDays) * 100 : 0;

         // Calculate current streak
         let currentStreak = 0;
         const today = new Date();
         const checkDate = new Date(today);

         while (true) {
            const dateString = formatDate(checkDate);
            const entry = habitEntries.find((e) => e.date === dateString);

            if (!entry || !entry.completed) break;

            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
         }

         // Calculate longest streak
         let longestStreak = 0;
         let tempStreak = 0;

         for (const entry of habitEntries) {
            if (entry.completed) {
               tempStreak++;
               longestStreak = Math.max(longestStreak, tempStreak);
            } else {
               tempStreak = 0;
            }
         }

         const lastCompleted =
            completedEntries.length > 0
               ? new Date(completedEntries[completedEntries.length - 1].date)
               : undefined;

         return {
            habitId,
            currentStreak,
            longestStreak,
            totalDays,
            successRate,
            lastCompleted,
         };
      },
      [entries]
   );

   return {
      habits,
      entries,
      selectedDate,
      currentMonth,
      loading,
      error,
      setSelectedDate,
      setCurrentMonth,
      addHabit,
      removeHabit,
      toggleHabitEntry,
      getHabitEntry,
      getTodayStats,
      getHabitStats,
      refreshData: loadUserData,
   };
};
