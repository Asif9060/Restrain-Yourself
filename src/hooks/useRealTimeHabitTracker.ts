"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Habit, HabitEntry, HabitStats } from "@/types";
import { formatDate } from "@/utils";

// Types for real-time operations
interface ToggleData {
   habitId: string;
   completed: boolean;
   date: string;
   notes?: string;
}

interface OptimisticUpdate {
   id: string;
   type: "toggle" | "add" | "remove" | "add_habit" | "remove_habit";
   timestamp: Date;
   data: ToggleData | AddHabitData | RemoveHabitData;
   retryCount?: number;
}

interface AddHabitData {
   habitData: Omit<Habit, "id" | "userId" | "createdAt" | "updatedAt">;
   tempId: string;
}

interface RemoveHabitData {
   habitId: string;
}

interface LoadingState {
   [key: string]: boolean;
}

interface ErrorState {
   [key: string]: string;
}

interface CacheData {
   data: Habit[] | HabitEntry[];
   timestamp: number;
}

interface RawHabitData {
   id: string;
   user_id: string;
   name: string;
   category: string;
   color: string;
   icon: string;
   is_custom: boolean;
   description?: string | null;
   created_at: string;
   updated_at: string;
   start_date: string;
   is_active: boolean;
}

interface RawEntryData {
   id: string;
   habit_id: string;
   user_id: string;
   date: string;
   completed: boolean;
   timestamp: string;
   notes?: string | null;
}

const DEBOUNCE_DELAY = 300; // ms
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // ms

export const useRealTimeHabitTracker = () => {
   const { user } = useAuth();

   // Core state
   const [habits, setHabits] = useState<Habit[]>([]);
   const [entries, setEntries] = useState<HabitEntry[]>([]);
   const [selectedDate, setSelectedDate] = useState(new Date());
   const [currentMonth, setCurrentMonth] = useState(new Date());

   // Real-time state management
   const [globalLoading, setGlobalLoading] = useState(false);
   const [loadingStates, setLoadingStates] = useState<LoadingState>({});
   const [errors, setErrors] = useState<ErrorState>({});
   const [isOnline, setIsOnline] = useState(
      typeof window !== "undefined" ? window.navigator.onLine : true
   );

   // Optimistic updates and caching
   const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([]);
   const [offlineQueue, setOfflineQueue] = useState<OptimisticUpdate[]>([]);
   const pendingUpdatesRef = useRef(new Map<string, NodeJS.Timeout>());
   const retriesRef = useRef(new Map<string, number>());

   // Cache for responses
   const cacheRef = useRef(new Map<string, CacheData>());
   const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

   // Error handling
   const setError = useCallback((key: string, message: string) => {
      setErrors((prev) => ({ ...prev, [key]: message }));
      setTimeout(() => {
         setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[key];
            return newErrors;
         });
      }, 5000);
   }, []);

   const clearError = useCallback((key: string) => {
      setErrors((prev) => {
         const newErrors = { ...prev };
         delete newErrors[key];
         return newErrors;
      });
   }, []);

   // Loading state management
   const setLoading = useCallback((key: string, loading: boolean) => {
      setLoadingStates((prev) => ({ ...prev, [key]: loading }));
   }, []);

   // Cache management
   const getCachedData = useCallback(
      (key: string) => {
         const cached = cacheRef.current.get(key);
         if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
         }
         return null;
      },
      [CACHE_DURATION]
   );

   const setCachedData = useCallback((key: string, data: Habit[] | HabitEntry[]) => {
      cacheRef.current.set(key, { data, timestamp: Date.now() });
   }, []);

   // Data transformation utilities
   const transformHabitData = useCallback(
      (habit: RawHabitData): Habit => ({
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
         description: habit.description ?? undefined,
      }),
      []
   );

   const transformEntryData = useCallback(
      (entry: RawEntryData): HabitEntry => ({
         id: entry.id,
         habitId: entry.habit_id,
         userId: entry.user_id,
         date: entry.date,
         completed: entry.completed,
         timestamp: new Date(entry.timestamp),
         notes: entry.notes || undefined,
      }),
      []
   );

   // Execute actual database update
   const executeUpdate = useCallback(
      async (update: OptimisticUpdate): Promise<void> => {
         const { type, data } = update;

         try {
            if (type === "toggle") {
               const toggleData = data as ToggleData;
               const { habitId, completed, date, notes } = toggleData;
               const existingEntry = entries.find(
                  (entry) => entry.habitId === habitId && entry.date === date
               );

               if (existingEntry && !existingEntry.id.startsWith("temp-")) {
                  // Update existing entry
                  const { error } = await supabase
                     .from("habit_entries")
                     .update({
                        completed,
                        timestamp: new Date().toISOString(),
                        notes: notes || null,
                     })
                     .eq("id", existingEntry.id)
                     .eq("user_id", user!.id);

                  if (error) throw error;
               } else {
                  // Create new entry
                  const { error } = await supabase.from("habit_entries").insert({
                     habit_id: habitId,
                     user_id: user!.id,
                     date,
                     completed,
                     timestamp: new Date().toISOString(),
                     notes: notes || null,
                  });

                  if (error) throw error;
               }
            } else if (type === "add_habit") {
               const addData = data as AddHabitData;
               const { error } = await supabase.from("habits").insert({
                  user_id: user!.id,
                  name: addData.habitData.name,
                  category: addData.habitData.category,
                  color: addData.habitData.color,
                  icon: addData.habitData.icon,
                  is_custom: addData.habitData.isCustom,
                  description: addData.habitData.description || null,
                  start_date: addData.habitData.startDate.toISOString(),
                  is_active: addData.habitData.isActive,
               });

               if (error) throw error;
            } else if (type === "remove_habit") {
               const removeData = data as RemoveHabitData;
               const { error } = await supabase
                  .from("habits")
                  .update({ is_active: false })
                  .eq("id", removeData.habitId)
                  .eq("user_id", user!.id);

               if (error) throw error;
            }
         } catch (error) {
            console.error("Execute update failed:", error);
            throw error;
         }
      },
      [entries, user]
   );

   // Process offline queue when coming back online
   const processOfflineQueue = useCallback(async () => {
      if (!isOnline || offlineQueue.length === 0) return;

      const queueCopy = [...offlineQueue];
      setOfflineQueue([]);

      for (const update of queueCopy) {
         try {
            await executeUpdate(update);
         } catch (error) {
            console.error("Failed to process offline update:", error);
            // Re-add to queue if still offline
            if (!navigator.onLine) {
               setOfflineQueue((prev) => [...prev, update]);
            }
         }
      }
   }, [isOnline, offlineQueue, executeUpdate]);

   // Network status monitoring
   useEffect(() => {
      const handleOnline = () => {
         setIsOnline(true);
         processOfflineQueue();
      };

      const handleOffline = () => {
         setIsOnline(false);
      };

      if (typeof window !== "undefined") {
         window.addEventListener("online", handleOnline);
         window.addEventListener("offline", handleOffline);

         return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
         };
      }
   }, [processOfflineQueue]);

   // Data loading with caching
   const loadHabits = useCallback(
      async (useCache: boolean = true) => {
         if (!user) return;

         const cacheKey = `habits-${user.id}`;

         if (useCache) {
            const cached = getCachedData(cacheKey);
            if (cached) {
               setHabits(cached as Habit[]);
               return;
            }
         }

         try {
            const { data, error } = await supabase
               .from("habits")
               .select("*")
               .eq("user_id", user.id)
               .eq("is_active", true)
               .order("created_at", { ascending: false });

            if (error) throw error;

            const transformedHabits = data.map(transformHabitData);
            setHabits(transformedHabits);
            setCachedData(cacheKey, transformedHabits);
         } catch (error) {
            console.error("Error loading habits:", error);
            setError("habits", "Failed to load habits");
         }
      },
      [user, getCachedData, transformHabitData, setCachedData, setError]
   );

   const loadEntries = useCallback(
      async (useCache: boolean = true) => {
         if (!user) return;

         const cacheKey = `entries-${user.id}`;

         if (useCache) {
            const cached = getCachedData(cacheKey);
            if (cached) {
               setEntries(cached as HabitEntry[]);
               return;
            }
         }

         try {
            const { data, error } = await supabase
               .from("habit_entries")
               .select("*")
               .eq("user_id", user.id)
               .order("date", { ascending: false });

            if (error) throw error;

            const transformedEntries = data.map(transformEntryData);
            setEntries(transformedEntries);
            setCachedData(cacheKey, transformedEntries);
         } catch (error) {
            console.error("Error loading entries:", error);
            setError("entries", "Failed to load entries");
         }
      },
      [user, getCachedData, transformEntryData, setCachedData, setError]
   );

   // Optimistic updates
   const applyOptimisticUpdate = useCallback(
      (update: OptimisticUpdate) => {
         setOptimisticUpdates((prev) => [...prev, update]);

         if (update.type === "toggle") {
            const toggleData = update.data as ToggleData;
            const { habitId, completed, date } = toggleData;

            setEntries((prev) => {
               const existingIndex = prev.findIndex(
                  (entry) => entry.habitId === habitId && entry.date === date
               );

               if (existingIndex >= 0) {
                  // Update existing entry
                  const newEntries = [...prev];
                  newEntries[existingIndex] = {
                     ...newEntries[existingIndex],
                     completed,
                     timestamp: new Date(),
                  };
                  return newEntries;
               } else {
                  // Create new entry
                  const newEntry: HabitEntry = {
                     id: `temp-${Date.now()}`,
                     habitId,
                     userId: user!.id,
                     date,
                     completed,
                     timestamp: new Date(),
                  };
                  return [newEntry, ...prev];
               }
            });
         }
      },
      [user]
   );

   const revertOptimisticUpdate = useCallback(
      (updateId: string) => {
         setOptimisticUpdates((prev) => prev.filter((update) => update.id !== updateId));
         // Reload data to get the correct state
         loadEntries(false);
      },
      [loadEntries]
   );

   // Debounced update function
   const debouncedUpdate = useCallback(
      (update: OptimisticUpdate) => {
         let key: string;

         // Generate key based on update type
         if (update.type === "toggle") {
            const toggleData = update.data as ToggleData;
            key = `${update.type}-${toggleData.habitId}-${toggleData.date}`;
         } else if (update.type === "add_habit") {
            const addData = update.data as AddHabitData;
            key = `${update.type}-${addData.tempId}`;
         } else if (update.type === "remove_habit") {
            const removeData = update.data as RemoveHabitData;
            key = `${update.type}-${removeData.habitId}`;
         } else {
            key = `${update.type}-${update.id}`;
         }

         // Clear existing timeout
         if (pendingUpdatesRef.current.has(key)) {
            clearTimeout(pendingUpdatesRef.current.get(key)!);
         }

         // Apply optimistic update immediately
         applyOptimisticUpdate(update);

         // Set new timeout for actual update
         const timeoutId = setTimeout(async () => {
            if (!isOnline) {
               setOfflineQueue((prev) => [...prev, update]);
               return;
            }

            try {
               await executeUpdate(update);
               // Remove from optimistic updates on success
               setOptimisticUpdates((prev) => prev.filter((u) => u.id !== update.id));
               // Clear cache to force refresh
               const cacheKey = `entries-${user!.id}`;
               cacheRef.current.delete(cacheKey);
            } catch (error) {
               console.error("Update failed:", error);

               const retryCount = retriesRef.current.get(key) || 0;

               if (retryCount < MAX_RETRY_ATTEMPTS) {
                  retriesRef.current.set(key, retryCount + 1);

                  // Retry after delay
                  setTimeout(() => {
                     debouncedUpdate({
                        ...update,
                        retryCount: retryCount + 1,
                     });
                  }, RETRY_DELAY * (retryCount + 1));
               } else {
                  // Max retries reached, revert optimistic update
                  revertOptimisticUpdate(update.id);

                  // Set error based on update type
                  if (update.type === "toggle") {
                     const toggleData = update.data as ToggleData;
                     setError(`toggle-${toggleData.habitId}`, "Failed to save changes");
                  } else if (update.type === "add_habit") {
                     setError("addHabit", "Failed to add habit");
                  } else if (update.type === "remove_habit") {
                     const removeData = update.data as RemoveHabitData;
                     setError(
                        `removeHabit-${removeData.habitId}`,
                        "Failed to remove habit"
                     );
                  }

                  retriesRef.current.delete(key);
               }
            } finally {
               pendingUpdatesRef.current.delete(key);

               // Set loading state based on update type
               if (update.type === "toggle") {
                  const toggleData = update.data as ToggleData;
                  setLoading(`toggle-${toggleData.habitId}`, false);
               } else if (update.type === "add_habit") {
                  setLoading("addHabit", false);
               } else if (update.type === "remove_habit") {
                  const removeData = update.data as RemoveHabitData;
                  setLoading(`removeHabit-${removeData.habitId}`, false);
               }
            }
         }, DEBOUNCE_DELAY);

         pendingUpdatesRef.current.set(key, timeoutId);
      },
      [
         isOnline,
         applyOptimisticUpdate,
         user,
         executeUpdate,
         revertOptimisticUpdate,
         setError,
         setLoading,
      ]
   );

   // Enhanced toggle function with real-time updates
   const toggleHabitEntry = useCallback(
      async (habitId: string, completed: boolean, notes?: string) => {
         if (!user) {
            setError("toggle", "User not authenticated");
            return;
         }

         const dateString = formatDate(selectedDate);
         const updateId = `${habitId}-${dateString}-${Date.now()}`;

         setLoading(`toggle-${habitId}`, true);
         clearError(`toggle-${habitId}`);

         const update: OptimisticUpdate = {
            id: updateId,
            type: "toggle",
            timestamp: new Date(),
            data: { habitId, completed, date: dateString, notes },
            retryCount: 0,
         };

         debouncedUpdate(update);
      },
      [user, selectedDate, debouncedUpdate, setLoading, clearError, setError]
   );

   // Real-time subscriptions setup
   useEffect(() => {
      if (!user) {
         setHabits([]);
         setEntries([]);
         return;
      }

      // Initial data load
      const loadData = async () => {
         setGlobalLoading(true);
         try {
            await Promise.all([loadHabits(), loadEntries()]);
         } finally {
            setGlobalLoading(false);
         }
      };

      loadData();

      // Set up real-time subscriptions
      const habitsSubscription = supabase
         .channel(`habits-${user.id}`)
         .on(
            "postgres_changes",
            {
               event: "*",
               schema: "public",
               table: "habits",
               filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
               console.log("Habits real-time update:", payload);

               if (payload.eventType === "INSERT") {
                  const newHabit = transformHabitData(payload.new as RawHabitData);
                  setHabits((prev) => [newHabit, ...prev]);
               } else if (payload.eventType === "UPDATE") {
                  const updatedHabit = transformHabitData(payload.new as RawHabitData);
                  setHabits((prev) =>
                     prev.map((h) => (h.id === updatedHabit.id ? updatedHabit : h))
                  );
               } else if (payload.eventType === "DELETE") {
                  setHabits((prev) =>
                     prev.filter((h) => h.id !== (payload.old as RawHabitData).id)
                  );
               }

               // Update cache
               const cacheKey = `habits-${user.id}`;
               cacheRef.current.delete(cacheKey);
            }
         )
         .subscribe();

      const entriesSubscription = supabase
         .channel(`entries-${user.id}`)
         .on(
            "postgres_changes",
            {
               event: "*",
               schema: "public",
               table: "habit_entries",
               filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
               console.log("Entries real-time update:", payload);

               if (payload.eventType === "INSERT") {
                  const newEntry = transformEntryData(payload.new as RawEntryData);
                  setEntries((prev) => {
                     // Check if this is replacing an optimistic update
                     const tempEntryIndex = prev.findIndex(
                        (e) =>
                           e.habitId === newEntry.habitId &&
                           e.date === newEntry.date &&
                           e.id.startsWith("temp-")
                     );

                     if (tempEntryIndex >= 0) {
                        const newEntries = [...prev];
                        newEntries[tempEntryIndex] = newEntry;
                        return newEntries;
                     } else {
                        return [newEntry, ...prev];
                     }
                  });
               } else if (payload.eventType === "UPDATE") {
                  const updatedEntry = transformEntryData(payload.new as RawEntryData);
                  setEntries((prev) =>
                     prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
                  );
               } else if (payload.eventType === "DELETE") {
                  setEntries((prev) =>
                     prev.filter((e) => e.id !== (payload.old as RawEntryData).id)
                  );
               }

               // Update cache
               const cacheKey = `entries-${user.id}`;
               cacheRef.current.delete(cacheKey);
            }
         )
         .subscribe();

      // Capture the current pending updates ref for cleanup
      const pendingUpdates = pendingUpdatesRef.current;

      return () => {
         habitsSubscription.unsubscribe();
         entriesSubscription.unsubscribe();

         // Clear pending timeouts using captured ref
         pendingUpdates.forEach((timeout) => clearTimeout(timeout));
         pendingUpdates.clear();
      };
   }, [user, loadHabits, loadEntries, transformHabitData, transformEntryData]);

   // Enhanced utility functions
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
            .filter((entry) => entry.habitId === habitId && !entry.id.startsWith("temp-"))
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

   // Enhanced habit management functions
   const addHabit = useCallback(
      async (habitData: Omit<Habit, "id" | "userId" | "createdAt" | "updatedAt">) => {
         if (!user) {
            setError("addHabit", "User not authenticated");
            return;
         }

         setLoading("addHabit", true);
         clearError("addHabit");

         // Generate temporary ID for optimistic update
         const tempId = `temp-habit-${Date.now()}`;
         const now = new Date();

         // Create optimistic habit
         const optimisticHabit: Habit = {
            id: tempId,
            userId: user.id,
            name: habitData.name,
            category: habitData.category,
            color: habitData.color,
            icon: habitData.icon,
            isCustom: habitData.isCustom,
            description: habitData.description ? habitData.description : undefined,
            startDate: habitData.startDate,
            isActive: habitData.isActive,
            createdAt: now,
            updatedAt: now,
         };

         // Apply optimistic update immediately
         setHabits((prev) => [optimisticHabit, ...prev]);

         try {
            if (!isOnline) {
               // Add to offline queue
               const update: OptimisticUpdate = {
                  id: `add-habit-${tempId}`,
                  type: "add_habit",
                  data: { habitData, tempId },
                  timestamp: now,
               };
               setOfflineQueue((prev) => [...prev, update]);
               setLoading("addHabit", false);
               return;
            }

            const { data, error } = await supabase
               .from("habits")
               .insert({
                  user_id: user.id,
                  name: habitData.name,
                  category: habitData.category,
                  color: habitData.color,
                  icon: habitData.icon,
                  is_custom: habitData.isCustom,
                  description: habitData.description || null,
                  start_date: habitData.startDate.toISOString(),
                  is_active: habitData.isActive,
               })
               .select()
               .single();

            if (error) throw error;

            // Replace optimistic habit with real data
            setHabits((prev) =>
               prev.map((habit) =>
                  habit.id === tempId ? transformHabitData(data) : habit
               )
            );

            // Clear cache to force refresh
            const cacheKey = `habits-${user.id}`;
            cacheRef.current.delete(cacheKey);
         } catch (error) {
            console.error("Error adding habit:", error);

            // Revert optimistic update on error
            setHabits((prev) => prev.filter((habit) => habit.id !== tempId));
            setError("addHabit", "Failed to add habit");
            throw error;
         } finally {
            setLoading("addHabit", false);
         }
      },
      [user, setLoading, clearError, setError, isOnline, transformHabitData]
   );

   const removeHabit = useCallback(
      async (habitId: string) => {
         if (!user) {
            setError("removeHabit", "User not authenticated");
            return;
         }

         setLoading(`removeHabit-${habitId}`, true);
         clearError(`removeHabit-${habitId}`);

         // Store original habit for potential revert
         const originalHabit = habits.find((h) => h.id === habitId);
         if (!originalHabit) {
            setError(`removeHabit-${habitId}`, "Habit not found");
            setLoading(`removeHabit-${habitId}`, false);
            return;
         }

         // Apply optimistic update immediately - remove from UI
         setHabits((prev) => prev.filter((habit) => habit.id !== habitId));

         try {
            if (!isOnline) {
               // Add to offline queue
               const update: OptimisticUpdate = {
                  id: `remove-habit-${habitId}`,
                  type: "remove_habit",
                  data: { habitId },
                  timestamp: new Date(),
               };
               setOfflineQueue((prev) => [...prev, update]);
               setLoading(`removeHabit-${habitId}`, false);
               return;
            }

            const { error } = await supabase
               .from("habits")
               .update({ is_active: false })
               .eq("id", habitId)
               .eq("user_id", user.id);

            if (error) throw error;

            // Clear cache to force refresh
            const cacheKey = `habits-${user.id}`;
            cacheRef.current.delete(cacheKey);
         } catch (error) {
            console.error("Error removing habit:", error);

            // Revert optimistic update on error - restore the habit
            setHabits((prev) =>
               [originalHabit, ...prev].sort(
                  (a, b) =>
                     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
               )
            );
            setError(`removeHabit-${habitId}`, "Failed to remove habit");
            throw error;
         } finally {
            setLoading(`removeHabit-${habitId}`, false);
         }
      },
      [user, habits, setLoading, clearError, setError, isOnline]
   );

   const refreshData = useCallback(async () => {
      // Clear cache and reload
      cacheRef.current.clear();
      setGlobalLoading(true);
      try {
         await Promise.all([loadHabits(false), loadEntries(false)]);
      } finally {
         setGlobalLoading(false);
      }
   }, [loadHabits, loadEntries]);

   return {
      // Core data
      habits,
      entries,
      selectedDate,
      currentMonth,

      // Enhanced state
      loading: globalLoading,
      loadingStates,
      errors,
      isOnline,
      optimisticUpdates,
      offlineQueue: offlineQueue.length,

      // Enhanced functions
      setSelectedDate,
      setCurrentMonth,
      toggleHabitEntry,
      getHabitEntry,
      getTodayStats,
      getHabitStats,
      refreshData,

      // Placeholder functions
      addHabit,
      removeHabit,

      // Utility functions
      clearError,
   };
};
