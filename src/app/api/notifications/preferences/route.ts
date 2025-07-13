import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "../../../../../services/NotificationService";

export async function GET(request: NextRequest) {
   try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId");

      if (!userId) {
         return NextResponse.json(
            { error: "Missing required parameter: userId" },
            { status: 400 }
         );
      }

      const preferences = await NotificationService.getNotificationPreferences(userId);

      if (preferences) {
         return NextResponse.json(preferences);
      } else {
         return NextResponse.json(
            { error: "Failed to fetch preferences" },
            { status: 500 }
         );
      }
   } catch (error) {
      console.error("Error fetching preferences:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
}

export async function PUT(request: NextRequest) {
   try {
      const { userId, preferences } = await request.json();

      if (!userId || !preferences) {
         return NextResponse.json(
            { error: "Missing required fields: userId and preferences" },
            { status: 400 }
         );
      }

      const success = await NotificationService.updateNotificationPreferences(
         userId,
         preferences
      );

      if (success) {
         return NextResponse.json({ success: true });
      } else {
         return NextResponse.json(
            { error: "Failed to update preferences" },
            { status: 500 }
         );
      }
   } catch (error) {
      console.error("Error updating preferences:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
}
