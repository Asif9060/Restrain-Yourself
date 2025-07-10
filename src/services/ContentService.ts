"use client";

import { supabase } from "@/lib/supabase";
import { Quote, HealthTip, HabitCategory } from "@/types";

export class ContentService {
   // Motivational Quotes
   static async getQuotes(category?: HabitCategory): Promise<Quote[]> {
      let query = supabase
         .from("motivational_quotes")
         .select("*")
         .eq("is_active", true)
         .order("created_at", { ascending: false });

      if (category) {
         query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
         console.error("Error fetching quotes:", error);
         throw new Error("Failed to fetch quotes");
      }

      return data.map((quote) => ({
         id: quote.id,
         text: quote.text,
         author: quote.author,
         category: quote.category as HabitCategory,
         isActive: quote.is_active,
         createdAt: new Date(quote.created_at),
         updatedAt: new Date(quote.updated_at),
         createdBy: quote.created_by || undefined,
         version: quote.version,
      }));
   }

   static async getRandomQuote(category?: HabitCategory): Promise<Quote | null> {
      try {
         const quotes = await this.getQuotes(category);
         if (quotes.length === 0) return null;

         const randomIndex = Math.floor(Math.random() * quotes.length);
         return quotes[randomIndex];
      } catch (error) {
         console.error("Error getting random quote:", error);
         return null;
      }
   }

   static async createQuote(
      quoteData: Omit<Quote, "id" | "createdAt" | "updatedAt" | "version">,
      userId?: string
   ): Promise<Quote> {
      const { data, error } = await supabase
         .from("motivational_quotes")
         .insert({
            text: quoteData.text,
            author: quoteData.author,
            category: quoteData.category,
            is_active: quoteData.isActive,
            created_by: userId || null,
            version: 1,
         })
         .select()
         .single();

      if (error) {
         console.error("Error creating quote:", error);
         throw new Error("Failed to create quote");
      }

      return {
         id: data.id,
         text: data.text,
         author: data.author,
         category: data.category as HabitCategory,
         isActive: data.is_active,
         createdAt: new Date(data.created_at),
         updatedAt: new Date(data.updated_at),
         createdBy: data.created_by || undefined,
         version: data.version,
      };
   }

   static async updateQuote(
      id: string,
      updates: Partial<Omit<Quote, "id" | "createdAt" | "updatedAt" | "version">>,
      userId?: string
   ): Promise<Quote> {
      // First get the current version
      const { data: currentData, error: fetchError } = await supabase
         .from("motivational_quotes")
         .select("version")
         .eq("id", id)
         .single();

      if (fetchError) {
         throw new Error("Failed to fetch current quote version");
      }

      const updateData: Record<string, unknown> = {
         updated_at: new Date().toISOString(),
         version: currentData.version + 1,
      };

      if (updates.text !== undefined) updateData.text = updates.text;
      if (updates.author !== undefined) updateData.author = updates.author;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
         .from("motivational_quotes")
         .update(updateData)
         .eq("id", id)
         .select()
         .single();

      if (error) {
         console.error("Error updating quote:", error);
         throw new Error("Failed to update quote");
      }

      // Log the update
      await this.logAuditAction(
         "motivational_quotes",
         id,
         "UPDATE",
         null,
         updateData,
         userId
      );

      return {
         id: data.id,
         text: data.text,
         author: data.author,
         category: data.category as HabitCategory,
         isActive: data.is_active,
         createdAt: new Date(data.created_at),
         updatedAt: new Date(data.updated_at),
         createdBy: data.created_by || undefined,
         version: data.version,
      };
   }

   static async deleteQuote(id: string, userId?: string): Promise<void> {
      // Soft delete by setting is_active to false
      const { error } = await supabase
         .from("motivational_quotes")
         .update({
            is_active: false,
            updated_at: new Date().toISOString(),
         })
         .eq("id", id);

      if (error) {
         console.error("Error deleting quote:", error);
         throw new Error("Failed to delete quote");
      }

      // Log the deletion
      await this.logAuditAction(
         "motivational_quotes",
         id,
         "DELETE",
         null,
         { is_active: false },
         userId
      );
   }

   // Health Tips
   static async getHealthTips(category?: HabitCategory): Promise<HealthTip[]> {
      let query = supabase
         .from("health_tips")
         .select("*")
         .eq("is_active", true)
         .order("created_at", { ascending: false });

      if (category) {
         query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
         console.error("Error fetching health tips:", error);
         throw new Error("Failed to fetch health tips");
      }

      return data.map((tip) => ({
         id: tip.id,
         title: tip.title,
         content: tip.content,
         category: tip.category as HabitCategory,
         isActive: tip.is_active,
         createdAt: new Date(tip.created_at),
         updatedAt: new Date(tip.updated_at),
         createdBy: tip.created_by || undefined,
         version: tip.version,
      }));
   }

   static async getRandomHealthTip(category?: HabitCategory): Promise<HealthTip | null> {
      try {
         const tips = await this.getHealthTips(category);
         if (tips.length === 0) return null;

         const randomIndex = Math.floor(Math.random() * tips.length);
         return tips[randomIndex];
      } catch (error) {
         console.error("Error getting random health tip:", error);
         return null;
      }
   }

   static async createHealthTip(
      tipData: Omit<HealthTip, "id" | "createdAt" | "updatedAt" | "version">,
      userId?: string
   ): Promise<HealthTip> {
      const { data, error } = await supabase
         .from("health_tips")
         .insert({
            title: tipData.title,
            content: tipData.content,
            category: tipData.category,
            is_active: tipData.isActive,
            created_by: userId || null,
            version: 1,
         })
         .select()
         .single();

      if (error) {
         console.error("Error creating health tip:", error);
         throw new Error("Failed to create health tip");
      }

      return {
         id: data.id,
         title: data.title,
         content: data.content,
         category: data.category as HabitCategory,
         isActive: data.is_active,
         createdAt: new Date(data.created_at),
         updatedAt: new Date(data.updated_at),
         createdBy: data.created_by || undefined,
         version: data.version,
      };
   }

   static async updateHealthTip(
      id: string,
      updates: Partial<Omit<HealthTip, "id" | "createdAt" | "updatedAt" | "version">>,
      userId?: string
   ): Promise<HealthTip> {
      // First get the current version
      const { data: currentData, error: fetchError } = await supabase
         .from("health_tips")
         .select("version")
         .eq("id", id)
         .single();

      if (fetchError) {
         throw new Error("Failed to fetch current health tip version");
      }

      const updateData: Record<string, unknown> = {
         updated_at: new Date().toISOString(),
         version: currentData.version + 1,
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
         .from("health_tips")
         .update(updateData)
         .eq("id", id)
         .select()
         .single();

      if (error) {
         console.error("Error updating health tip:", error);
         throw new Error("Failed to update health tip");
      }

      // Log the update
      await this.logAuditAction("health_tips", id, "UPDATE", null, updateData, userId);

      return {
         id: data.id,
         title: data.title,
         content: data.content,
         category: data.category as HabitCategory,
         isActive: data.is_active,
         createdAt: new Date(data.created_at),
         updatedAt: new Date(data.updated_at),
         createdBy: data.created_by || undefined,
         version: data.version,
      };
   }

   static async deleteHealthTip(id: string, userId?: string): Promise<void> {
      // Soft delete by setting is_active to false
      const { error } = await supabase
         .from("health_tips")
         .update({
            is_active: false,
            updated_at: new Date().toISOString(),
         })
         .eq("id", id);

      if (error) {
         console.error("Error deleting health tip:", error);
         throw new Error("Failed to delete health tip");
      }

      // Log the deletion
      await this.logAuditAction(
         "health_tips",
         id,
         "DELETE",
         null,
         { is_active: false },
         userId
      );
   }

   // Audit Logging
   private static async logAuditAction(
      tableName: string,
      recordId: string,
      action: string,
      oldValues: Record<string, unknown> | null,
      newValues: Record<string, unknown> | null,
      userId?: string
   ): Promise<void> {
      try {
         await supabase.from("audit_logs").insert({
            table_name: tableName,
            record_id: recordId,
            action,
            old_values: oldValues,
            new_values: newValues,
            user_id: userId || null,
         });
      } catch (error) {
         // Don't throw here as audit logging is not critical
         console.error("Error logging audit action:", error);
      }
   }

   // Get audit logs for admin interface
   static async getAuditLogs(
      tableName?: string,
      recordId?: string,
      userId?: string,
      limit = 50
   ): Promise<
      Array<{
         id: string;
         tableName: string;
         recordId: string;
         action: string;
         oldValues: Record<string, unknown> | null;
         newValues: Record<string, unknown> | null;
         userId: string | null;
         createdAt: Date;
      }>
   > {
      let query = supabase
         .from("audit_logs")
         .select("*")
         .order("created_at", { ascending: false })
         .limit(limit);

      if (tableName) query = query.eq("table_name", tableName);
      if (recordId) query = query.eq("record_id", recordId);
      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query;

      if (error) {
         console.error("Error fetching audit logs:", error);
         throw new Error("Failed to fetch audit logs");
      }

      return data.map((log) => ({
         id: log.id,
         tableName: log.table_name,
         recordId: log.record_id,
         action: log.action,
         oldValues: log.old_values as Record<string, unknown> | null,
         newValues: log.new_values as Record<string, unknown> | null,
         userId: log.user_id,
         createdAt: new Date(log.created_at),
      }));
   }
}
