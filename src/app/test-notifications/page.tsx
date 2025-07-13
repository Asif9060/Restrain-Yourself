'use client';

import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

export default function TestNotificationsPage() {
    const {
        permission,
        isSupported,
        token,
        isRegistered,
        requestPermission,
        registerDevice,
        sendTestNotification
    } = useNotifications();

    const [userId] = useState('test-user-123'); // Replace with actual user ID
    const [testResults, setTestResults] = useState<string[]>([]);

    const addResult = (message: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const runTests = async () => {
        setTestResults([]);
        addResult('Starting notification tests...');

        // Test 1: Check support
        if (!isSupported) {
            addResult('❌ Notifications not supported in this browser');
            return;
        }
        addResult('✅ Notifications supported');

        // Test 2: Request permission
        if (permission !== 'granted') {
            addResult('Requesting notification permission...');
            const granted = await requestPermission();
            if (!granted) {
                addResult('❌ Permission denied');
                return;
            }
        }
        addResult('✅ Permission granted');

        // Test 3: Register device
        addResult('Registering device...');
        const registered = await registerDevice(userId);
        if (!registered) {
            addResult('❌ Device registration failed');
            return;
        }
        addResult('✅ Device registered');

        // Test 4: Send test notification
        addResult('Sending test notification...');
        const sent = await sendTestNotification(userId);
        if (!sent) {
            addResult('❌ Test notification failed');
            return;
        }
        addResult('✅ Test notification sent');

        addResult('🎉 All tests passed!');
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Notification System Test</h1>

            <div className="grid gap-6">
                {/* Status Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">System Status</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                            <span className="font-medium">Browser Support:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isSupported
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                {isSupported ? '✅ Supported' : '❌ Not Supported'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="font-medium">Permission:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${permission === 'granted' ? 'bg-green-100 text-green-800' :
                                    permission === 'denied' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                }`}>
                                {permission === 'granted' ? '✅ Granted' :
                                    permission === 'denied' ? '❌ Denied' : '⏳ Not Requested'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="font-medium">Device Registered:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isRegistered
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                {isRegistered ? '✅ Yes' : '⏳ No'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="font-medium">FCM Token:</span>
                            <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded font-mono max-w-xs truncate">
                                {token ? `${token.substring(0, 20)}...` : 'Not available'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Test Controls */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Controls</h2>
                    <div className="space-y-4">
                        <button
                            onClick={runTests}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            🧪 Run All Tests
                        </button>
                        <p className="text-sm text-gray-600">
                            This will test notification permissions, device registration, and send a test notification.
                        </p>
                    </div>
                </div>

                {/* Test Results */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Results</h2>
                    <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                        {testResults.length === 0 ? (
                            <div className="flex items-center justify-center h-32">
                                <p className="text-gray-500 text-center">
                                    No tests run yet.<br />
                                    Click &quot;Run All Tests&quot; to start testing the notification system.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {testResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className={`text-sm font-mono p-2 rounded ${result.includes('❌') ? 'bg-red-50 text-red-700' :
                                                result.includes('✅') ? 'bg-green-50 text-green-700' :
                                                    result.includes('🎉') ? 'bg-blue-50 text-blue-700' :
                                                        'bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        {result}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Debug Info */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                    <h3 className="font-semibold mb-2 text-gray-700">Debug Information</h3>
                    <div className="text-xs text-gray-600 space-y-1">
                        <div>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</div>
                        <div>HTTPS: {typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'Yes' : 'No') : 'N/A'}</div>
                        <div>Service Worker: {'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
