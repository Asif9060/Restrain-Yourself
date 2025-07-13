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
        addLog(`Environment: ${process.env.NODE_ENV}`);
        addLog(`typeof window: ${typeof window}`);
        
        // Check if we're in browser context
        if (typeof window !== 'undefined') {
            addLog("Running in browser context");
        } else {
            addLog("Running in server context");
        }
        
        const vars = [
            'NEXT_PUBLIC_FIREBASE_API_KEY',
            'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
            'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
            'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
            'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
            'NEXT_PUBLIC_FIREBASE_APP_ID',
            'NEXT_PUBLIC_FIREBASE_VAPID_KEY'
        ];
        
        addLog(`Total env vars to check: ${vars.length}`);
        addLog(`process.env keys starting with NEXT_PUBLIC: ${Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')).length}`);
        
        vars.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                addLog(`✅ ${varName}: ${value.substring(0, 20)}...`);
            } else {
                addLog(`❌ ${varName}: Not set (value is: ${typeof value})`);
            }
        });
        
        // Additional debug info
        addLog("=== All NEXT_PUBLIC vars ===");
        Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')).forEach(key => {
            const value = process.env[key];
            addLog(`${key}: ${value ? value.substring(0, 20) + '...' : 'undefined'}`);
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
                const newPermission = Notification.permission;
                addLog(`Permission result: ${granted ? 'granted' : 'denied'}`);
                addLog(`Browser permission state: ${newPermission}`);
                setPermission(newPermission);
                
                if (newPermission === "granted" as NotificationPermission) {
                    addLog("✅ Permission successfully granted!");
                } else {
                    addLog("❌ Permission was denied");
                }
            } else {
                addLog("✅ Permission already granted");
                setPermission(Notification.permission);
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
            // Check permission again in real-time
            const currentPermission = Notification.permission;
            addLog(`Current permission state: ${currentPermission}`);
            addLog(`Component permission state: ${permission}`);
            
            if (currentPermission !== 'granted') {
                addLog("❌ Cannot get token without permission");
                addLog("Please click 'Test Permission' first to grant permission");
                setLoading(false);
                return;
            }
            
            addLog("Attempting to get FCM token...");
            const fcmToken = await getFCMToken();
            
            if (fcmToken) {
                addLog(`✅ FCM token obtained: ${fcmToken.substring(0, 30)}...`);
                setToken(fcmToken);
                
                if (fcmToken.startsWith('mock-token-')) {
                    addLog("ℹ️ This is a mock token for development");
                } else {
                    addLog("ℹ️ This is a real FCM token");
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

    const testFirebaseDirectly = async () => {
        addLog("=== Testing Firebase with Hardcoded Config ===");
        setLoading(true);
        
        try {
            // Hardcoded Firebase config for testing
            const testConfig = {
                apiKey: "AIzaSyBctypVYrvSZl7gXeDutTuEbNYfgyE7Uuo",
                authDomain: "restrain-yourself.firebaseapp.com",
                projectId: "restrain-yourself",
                storageBucket: "restrain-yourself.firebasestorage.app",
                messagingSenderId: "442834474290",
                appId: "1:442834474290:web:1ab7118cfb1a7e76f4732b",
                measurementId: "G-8820N4Y8H8"
            };
            
            const vapidKey = "BKwk9EvA0I96-bYUDVMYtT-oLo8Wr-oOMMoHFSJu0NMykcNi7HTxYOXUa7mbDpmRLIl8vWBFAMV-o4oHK3Dw3_0";
            
            addLog("✅ Hardcoded config loaded");
            addLog(`Config keys: ${Object.keys(testConfig).join(', ')}`);
            addLog(`VAPID key: ${vapidKey.substring(0, 20)}...`);
            
            // Try to import Firebase directly
            const { initializeApp } = await import('firebase/app');
            const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
            
            addLog("✅ Firebase modules imported");
            
            const app = initializeApp(testConfig);
            addLog("✅ Firebase app initialized");
            
            const supported = await isSupported();
            addLog(`Firebase messaging supported: ${supported}`);
            
            if (!supported) {
                addLog("❌ Firebase messaging not supported in this environment");
                return;
            }
            
            const messaging = getMessaging(app);
            addLog("✅ Firebase messaging instance created");
            
            // Check permission again in real-time
            const currentPermission = Notification.permission;
            addLog(`Current permission state: ${currentPermission}`);
            addLog(`Component permission state: ${permission}`);
            
            if (currentPermission !== 'granted') {
                addLog("❌ Cannot get token without notification permission");
                addLog("Please click 'Test Permission' first to grant permission");
                return;
            }
            
            // Register service worker
            if ('serviceWorker' in navigator) {
                addLog("Registering service worker...");
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                addLog("✅ Service worker registered");
                
                // Get token
                addLog("Getting FCM token with hardcoded config...");
                const token = await getToken(messaging, {
                    vapidKey: vapidKey,
                    serviceWorkerRegistration: registration
                });
                
                if (token) {
                    addLog(`✅ Direct FCM token: ${token.substring(0, 30)}...`);
                    setToken(token);
                } else {
                    addLog("❌ No token received from direct Firebase call");
                }
            } else {
                addLog("❌ Service worker not supported");
            }
            
        } catch (error) {
            addLog(`❌ Direct Firebase test failed: ${error}`);
            console.error('Direct Firebase test error:', error);
        } finally {
            setLoading(false);
        }
    };

    const runAllTests = async () => {
        setLogs([]);
        testEnvironmentVariables();
        await testPermission();
        await testFCMToken();
        await testFirebaseDirectly();
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
                                onClick={testFirebaseDirectly}
                                disabled={loading}
                                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                                Test Direct Firebase
                            </button>
                            <button
                                onClick={() => {
                                    setPermission(Notification.permission);
                                    addLog(`Updated permission state to: ${Notification.permission}`);
                                }}
                                disabled={loading}
                                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                            >
                                Refresh Permission
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
