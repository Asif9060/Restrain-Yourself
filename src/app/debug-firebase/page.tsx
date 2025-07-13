'use client';

import { useState, useEffect } from 'react';
import { getFCMToken, requestNotificationPermission } from '../../../lib/firebase';

export default function DebugFirebasePage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPermission(Notification.permission);
            addLog(`Initial permission: ${Notification.permission}`);
            addLog(`User agent: ${navigator.userAgent}`);
            addLog(`Location: ${window.location.href}`);
            addLog(`Protocol: ${window.location.protocol}`);
            addLog(`Hostname: ${window.location.hostname}`);
        }
    }, []);

    const testEnvironmentVariables = () => {
        addLog("=== Testing Environment Variables ===");
        const vars = [
            'NEXT_PUBLIC_FIREBASE_API_KEY',
            'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
            'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
            'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
            'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
            'NEXT_PUBLIC_FIREBASE_APP_ID',
            'NEXT_PUBLIC_FIREBASE_VAPID_KEY'
        ];
        
        vars.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                addLog(`✅ ${varName}: ${value.substring(0, 20)}...`);
            } else {
                addLog(`❌ ${varName}: Not set`);
            }
        });
    };

    const testPermission = async () => {
        addLog("=== Testing Notification Permission ===");
        setLoading(true);
        
        try {
            if (!('Notification' in window)) {
                addLog("❌ Notifications not supported");
                return;
            }
            
            addLog("✅ Notifications supported");
            addLog(`Current permission: ${Notification.permission}`);
            
            if (Notification.permission === 'denied') {
                addLog("❌ Permission denied - please enable in browser settings");
                return;
            }
            
            if (Notification.permission === 'default') {
                addLog("Requesting permission...");
                const granted = await requestNotificationPermission();
                addLog(`Permission result: ${granted ? 'granted' : 'denied'}`);
                setPermission(granted ? 'granted' : 'denied');
            } else {
                addLog("✅ Permission already granted");
            }
            
        } catch (error) {
            addLog(`❌ Permission test failed: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const testFCMToken = async () => {
        addLog("=== Testing FCM Token Generation ===");
        setLoading(true);
        
        try {
            if (permission !== 'granted') {
                addLog("❌ Cannot get token without permission");
                return;
            }
            
            addLog("Attempting to get FCM token...");
            const fcmToken = await getFCMToken();
            
            if (fcmToken) {
                addLog(`✅ FCM token obtained: ${fcmToken.substring(0, 30)}...`);
                setToken(fcmToken);
                
                if (fcmToken.startsWith('mock-token-')) {
                    addLog("ℹ️ This is a mock token for development");
                }
            } else {
                addLog("❌ Failed to get FCM token");
            }
            
        } catch (error) {
            addLog(`❌ FCM token test failed: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const runAllTests = async () => {
        setLogs([]);
        testEnvironmentVariables();
        await testPermission();
        await testFCMToken();
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">
                        Firebase FCM Debug Page
                    </h1>
                    
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Current Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-100 p-3 rounded">
                                <div className="text-sm text-gray-600">Permission</div>
                                <div className={`font-semibold ${
                                    permission === 'granted' ? 'text-green-600' : 
                                    permission === 'denied' ? 'text-red-600' : 
                                    'text-yellow-600'
                                }`}>
                                    {permission}
                                </div>
                            </div>
                            <div className="bg-gray-100 p-3 rounded">
                                <div className="text-sm text-gray-600">FCM Token</div>
                                <div className={`font-semibold ${token ? 'text-green-600' : 'text-red-600'}`}>
                                    {token ? 'Available' : 'Not Available'}
                                </div>
                            </div>
                            <div className="bg-gray-100 p-3 rounded">
                                <div className="text-sm text-gray-600">Status</div>
                                <div className={`font-semibold ${loading ? 'text-blue-600' : 'text-gray-600'}`}>
                                    {loading ? 'Testing...' : 'Ready'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={runAllTests}
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Run All Tests
                            </button>
                            <button
                                onClick={testEnvironmentVariables}
                                disabled={loading}
                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                            >
                                Test Env Variables
                            </button>
                            <button
                                onClick={testPermission}
                                disabled={loading}
                                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                            >
                                Test Permission
                            </button>
                            <button
                                onClick={testFCMToken}
                                disabled={loading}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                Test FCM Token
                            </button>
                            <button
                                onClick={clearLogs}
                                disabled={loading}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                Clear Logs
                            </button>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
                        <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                            {logs.length === 0 ? (
                                <div className="text-gray-500">No logs yet. Run a test to see output.</div>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className="mb-1">
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2">Troubleshooting Tips:</h3>
                        <ul className="text-blue-700 text-sm space-y-1">
                            <li>• Make sure you are on HTTPS or localhost</li>
                            <li>• Check that all Firebase environment variables are set</li>
                            <li>• Ensure the service worker file exists at /firebase-messaging-sw.js</li>
                            <li>• Try in an incognito window to rule out browser cache issues</li>
                            <li>• Check the browser console for additional error details</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
