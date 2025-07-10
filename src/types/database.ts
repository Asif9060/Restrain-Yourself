export type Json =
   | string
   | number
   | boolean
   | null
   | { [key: string]: Json | undefined }
   | Json[];

export interface Database {
   public: {
      Tables: {
         users: {
            Row: {
               id: string;
               username: string;
               created_at: string;
               updated_at: string;
               settings: Json | null;
               is_admin: boolean;
            };
            Insert: {
               id?: string;
               username: string;
               created_at?: string;
               updated_at?: string;
               settings?: Json | null;
               is_admin?: boolean;
            };
            Update: {
               id?: string;
               username?: string;
               created_at?: string;
               updated_at?: string;
               settings?: Json | null;
               is_admin?: boolean;
            };
            Relationships: [];
         };
         habits: {
            Row: {
               id: string;
               user_id: string;
               name: string;
               category: string;
               color: string;
               icon: string;
               is_custom: boolean;
               description: string | null;
               created_at: string;
               updated_at: string;
               start_date: string;
               is_active: boolean;
            };
            Insert: {
               id?: string;
               user_id: string;
               name: string;
               category: string;
               color: string;
               icon: string;
               is_custom?: boolean;
               description?: string | null;
               created_at?: string;
               updated_at?: string;
               start_date?: string;
               is_active?: boolean;
            };
            Update: {
               id?: string;
               user_id?: string;
               name?: string;
               category?: string;
               color?: string;
               icon?: string;
               is_custom?: boolean;
               description?: string | null;
               created_at?: string;
               updated_at?: string;
               start_date?: string;
               is_active?: boolean;
            };
            Relationships: [
               {
                  foreignKeyName: "habits_user_id_fkey";
                  columns: ["user_id"];
                  referencedRelation: "users";
                  referencedColumns: ["id"];
               }
            ];
         };
         habit_entries: {
            Row: {
               id: string;
               habit_id: string;
               user_id: string;
               date: string;
               completed: boolean;
               timestamp: string;
               notes: string | null;
            };
            Insert: {
               id?: string;
               habit_id: string;
               user_id: string;
               date: string;
               completed: boolean;
               timestamp?: string;
               notes?: string | null;
            };
            Update: {
               id?: string;
               habit_id?: string;
               user_id?: string;
               date?: string;
               completed?: boolean;
               timestamp?: string;
               notes?: string | null;
            };
            Relationships: [
               {
                  foreignKeyName: "habit_entries_habit_id_fkey";
                  columns: ["habit_id"];
                  referencedRelation: "habits";
                  referencedColumns: ["id"];
               },
               {
                  foreignKeyName: "habit_entries_user_id_fkey";
                  columns: ["user_id"];
                  referencedRelation: "users";
                  referencedColumns: ["id"];
               }
            ];
         };
         motivational_quotes: {
            Row: {
               id: string;
               text: string;
               author: string;
               category: string;
               is_active: boolean;
               created_at: string;
               updated_at: string;
               created_by: string | null;
               version: number;
            };
            Insert: {
               id?: string;
               text: string;
               author: string;
               category: string;
               is_active?: boolean;
               created_at?: string;
               updated_at?: string;
               created_by?: string | null;
               version?: number;
            };
            Update: {
               id?: string;
               text?: string;
               author?: string;
               category?: string;
               is_active?: boolean;
               created_at?: string;
               updated_at?: string;
               created_by?: string | null;
               version?: number;
            };
            Relationships: [
               {
                  foreignKeyName: "motivational_quotes_created_by_fkey";
                  columns: ["created_by"];
                  referencedRelation: "users";
                  referencedColumns: ["id"];
               }
            ];
         };
         health_tips: {
            Row: {
               id: string;
               title: string;
               content: string;
               category: string;
               is_active: boolean;
               created_at: string;
               updated_at: string;
               created_by: string | null;
               version: number;
            };
            Insert: {
               id?: string;
               title: string;
               content: string;
               category: string;
               is_active?: boolean;
               created_at?: string;
               updated_at?: string;
               created_by?: string | null;
               version?: number;
            };
            Update: {
               id?: string;
               title?: string;
               content?: string;
               category?: string;
               is_active?: boolean;
               created_at?: string;
               updated_at?: string;
               created_by?: string | null;
               version?: number;
            };
            Relationships: [
               {
                  foreignKeyName: "health_tips_created_by_fkey";
                  columns: ["created_by"];
                  referencedRelation: "users";
                  referencedColumns: ["id"];
               }
            ];
         };
         audit_logs: {
            Row: {
               id: string;
               table_name: string;
               record_id: string;
               action: string;
               old_values: Json | null;
               new_values: Json | null;
               user_id: string | null;
               created_at: string;
            };
            Insert: {
               id?: string;
               table_name: string;
               record_id: string;
               action: string;
               old_values?: Json | null;
               new_values?: Json | null;
               user_id?: string | null;
               created_at?: string;
            };
            Update: {
               id?: string;
               table_name?: string;
               record_id?: string;
               action?: string;
               old_values?: Json | null;
               new_values?: Json | null;
               user_id?: string | null;
               created_at?: string;
            };
            Relationships: [
               {
                  foreignKeyName: "audit_logs_user_id_fkey";
                  columns: ["user_id"];
                  referencedRelation: "users";
                  referencedColumns: ["id"];
               }
            ];
         };
      };
      Views: {
         [_ in never]: never;
      };
      Functions: {
         [_ in never]: never;
      };
      Enums: {
         [_ in never]: never;
      };
      CompositeTypes: {
         [_ in never]: never;
      };
   };
}
