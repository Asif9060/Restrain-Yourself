import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
    title: 'Notification System Test - Restrain Yourself',
    description: 'Test page for the push notification system',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

export default function TestNotificationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
