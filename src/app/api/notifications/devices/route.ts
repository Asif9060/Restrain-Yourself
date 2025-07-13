import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '../../../../../services/NotificationService';

export async function POST(request: NextRequest) {
  try {
    const { userId, deviceToken, deviceInfo } = await request.json();

    if (!userId || !deviceToken) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and deviceToken' },
        { status: 400 }
      );
    }

    const success = await NotificationService.registerDevice(
      userId,
      deviceToken,
      deviceInfo || {}
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to register device' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { deviceToken } = await request.json();

    if (!deviceToken) {
      return NextResponse.json(
        { error: 'Missing required field: deviceToken' },
        { status: 400 }
      );
    }

    const success = await NotificationService.updateDeviceStatus(deviceToken, false);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to unregister device' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error unregistering device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
