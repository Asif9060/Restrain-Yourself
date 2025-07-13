'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Clock, Calendar, Volume2, VolumeX, Vibrate, Hash } from 'lucide-react';
import { NotificationPreferences } from '../../services/NotificationService';
import { getFCMToken, requestNotificationPermission, getDeviceInfo } from '../../lib/firebase';

interface NotificationSettingsProps {
    userId: string;
    onClose?: () => void;
}

const DAYS_OF_WEEK = [
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
    { value: 7, label: 'Sunday', short: 'Sun' },
];

const TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
];

export default function NotificationSettings({ userId, onClose }: NotificationSettingsProps) {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');

    const loadPreferences = useCallback(async () => {
        try {
            const response = await fetch(`/api/notifications/preferences?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setPreferences(data);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        const initializeSettings = async () => {
            await loadPreferences();
            checkPermissionStatus();
        };

        initializeSettings();
    }, [userId, loadPreferences]);

    const checkPermissionStatus = () => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    };

    const handleRequestPermission = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            setPermissionStatus('granted');
            await registerDevice();
        } else {
            setPermissionStatus('denied');
        }
    };

    const registerDevice = async () => {
        try {
            const token = await getFCMToken();
            if (token) {
                const deviceInfo = getDeviceInfo();

                const response = await fetch('/api/notifications/devices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId,
                        deviceToken: token,
                        deviceInfo,
                    }),
                });

                if (response.ok) {
                    console.log('Device registered successfully');
                }
            }
        } catch (error) {
            console.error('Error registering device:', error);
        }
    };

    const handleSave = async () => {
        if (!preferences) return;

        setSaving(true);
        try {
            const response = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    preferences,
                }),
            });

            if (response.ok) {
                alert('Notification preferences saved successfully!');
                onClose?.();
            } else {
                alert('Failed to save preferences. Please try again.');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Failed to save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestNotification = async () => {
        try {
            const response = await fetch(`/api/notifications/send?userId=${userId}&action=test`);
            const result = await response.json();

            if (result.success) {
                alert('Test notification sent successfully!');
            } else {
                alert('Failed to send test notification.');
            }
        } catch (error) {
            console.error('Error sending test notification:', error);
            alert('Failed to send test notification.');
        }
    };

    const updatePreferences = (updates: Partial<NotificationPreferences>) => {
        if (preferences) {
            setPreferences({ ...preferences, ...updates });
        }
    };

    const toggleDay = (day: number) => {
        if (!preferences) return;

        const newDays = preferences.days_of_week.includes(day)
            ? preferences.days_of_week.filter(d => d !== day)
            : [...preferences.days_of_week, day].sort();

        updatePreferences({ days_of_week: newDays });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!preferences) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-600">Failed to load notification preferences.</p>
                <button
                    onClick={loadPreferences}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-6 h-6" />
                    Notification Settings
                </h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Permission Status */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Browser Permissions</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {permissionStatus === 'granted' ? (
                            <Bell className="w-5 h-5 text-green-600" />
                        ) : (
                            <BellOff className="w-5 h-5 text-red-600" />
                        )}
                        <span className="text-sm text-gray-700">
                            Notifications: {permissionStatus === 'granted' ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                    {permissionStatus !== 'granted' && (
                        <button
                            onClick={handleRequestPermission}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                        >
                            Enable
                        </button>
                    )}
                </div>
            </div>

            {/* Main Toggle */}
            <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Daily Reminders</h3>
                        <p className="text-sm text-gray-600">Get notified about unmarked habits</p>
                    </div>
                    <button
                        onClick={() => updatePreferences({ enabled: !preferences.enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Time Settings */}
            {preferences.enabled && (
                <div className="space-y-4">
                    <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Reminder Time
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={preferences.reminder_time}
                                    onChange={(e) => updatePreferences({ reminder_time: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Timezone
                                </label>
                                <select
                                    value={preferences.timezone}
                                    onChange={(e) => updatePreferences({ timezone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {TIMEZONES.map(tz => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Days of Week */}
                    <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Days of Week
                        </h3>
                        <div className="grid grid-cols-7 gap-2">
                            {DAYS_OF_WEEK.map(day => (
                                <button
                                    key={day.value}
                                    onClick={() => toggleDay(day.value)}
                                    className={`p-2 text-sm rounded-lg transition-colors ${preferences.days_of_week.includes(day.value)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {day.short}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Notification Style</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {preferences.sound_enabled ? (
                                        <Volume2 className="w-5 h-5 text-gray-600" />
                                    ) : (
                                        <VolumeX className="w-5 h-5 text-gray-400" />
                                    )}
                                    <span className="text-sm text-gray-700">Sound</span>
                                </div>
                                <button
                                    onClick={() => updatePreferences({ sound_enabled: !preferences.sound_enabled })}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${preferences.sound_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${preferences.sound_enabled ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Vibrate className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm text-gray-700">Vibration</span>
                                </div>
                                <button
                                    onClick={() => updatePreferences({ vibration_enabled: !preferences.vibration_enabled })}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${preferences.vibration_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${preferences.vibration_enabled ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm text-gray-700">Badge Count</span>
                                </div>
                                <button
                                    onClick={() => updatePreferences({ badge_enabled: !preferences.badge_enabled })}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${preferences.badge_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${preferences.badge_enabled ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Notification */}
            {preferences.enabled && permissionStatus === 'granted' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Test Notifications</h3>
                    <p className="text-sm text-blue-700 mb-3">
                        Send a test notification to make sure everything is working correctly.
                    </p>
                    <button
                        onClick={handleSendTestNotification}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                        Send Test Notification
                    </button>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
