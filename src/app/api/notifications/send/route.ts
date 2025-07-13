import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '../../../../../services/NotificationService';
import { NotificationScheduler } from '../../../../../lib/notification-scheduler';

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, type, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, and body' },
        { status: 400 }
      );
    }

    const result = await NotificationService.sendNotificationToUser(
      userId,
      title,
      body,
      type || 'daily_reminder',
      data
    );

    return NextResponse.json({
      success: result.success,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test notification endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    let success = false;

    switch (action) {
      case 'test':
        success = await NotificationScheduler.sendTestNotification(userId);
        break;
      case 'motivational':
        success = await NotificationScheduler.sendMotivationalNotification(
          userId,
          'Your limitation—it\'s only your imagination.',
          'Anonymous'
        );
        break;
      case 'streak':
        success = await NotificationScheduler.sendStreakNotification(
          userId,
          'No Smoking',
          7
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: test, motivational, or streak' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
