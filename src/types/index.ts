export interface User {
   id: string;
   username: string;
   createdAt: Date;
   updatedAt: Date;
   settings?: Record<string, unknown>;
   isAdmin: boolean;
}

export interface Habit {
   id: string;
   userId: string;
   name: string;
   category: HabitCategory;
   color: string;
   icon: string;
   isCustom: boolean;
   createdAt: Date;
   updatedAt: Date;
   startDate: Date;
   isActive: boolean;
   description?: string;
}

export interface HabitEntry {
   id: string;
   habitId: string;
   userId: string;
   date: string; // YYYY-MM-DD format
   completed: boolean;
   timestamp: Date;
   notes?: string;
}

export interface DailyData {
   date: string;
   habits: Record<string, boolean>;
}

export interface HabitStats {
   habitId: string;
   currentStreak: number;
   longestStreak: number;
   totalDays: number;
   successRate: number;
   lastCompleted?: Date;
}

export type HabitCategory =
   | "smoking"
   | "drinking"
   | "adult-content"
   | "social-media"
   | "junk-food"
   | "custom";

export interface Quote {
   id: string;
   text: string;
   author: string;
   category: HabitCategory;
   isActive: boolean;
   createdAt: Date;
   updatedAt: Date;
   createdBy?: string;
   version: number;
}

export interface HealthTip {
   id: string;
   title: string;
   content: string;
   category: HabitCategory;
   isActive: boolean;
   createdAt: Date;
   updatedAt: Date;
   createdBy?: string;
   version: number;
}

export interface AppState {
   habits: Habit[];
   entries: HabitEntry[];
   selectedDate: Date;
   showAddHabit: boolean;
   showStats: boolean;
   selectedHabit?: Habit;
}
