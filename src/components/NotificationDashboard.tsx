'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BarChart3, Users, MessageSquare, TrendingUp } from 'lucide-react';

interface NotificationStats {
    totalSent: number;
    totalDelivered: number;
    totalClicked: number;
    totalFailed: number;
    deliveryRate: number;
    clickRate: number;
}

interface NotificationDashboardProps {
    userId?: string;
}

export default function NotificationDashboard({ userId }: NotificationDashboardProps) {
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (userId) params.append('userId', userId);
                params.append('days', days.toString());

                const response = await fetch(`/api/notifications/stats?${params}`);
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error loading notification stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userId, days]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId);
            params.append('days', days.toString());

            const response = await fetch(`/api/notifications/stats?${params}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading notification stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-600">No notification data available.</p>
                <button
                    onClick={loadStats}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Sent',
            value: stats.totalSent,
            icon: MessageSquare,
            color: 'bg-blue-500',
        },
        {
            title: 'Delivered',
            value: stats.totalDelivered,
            icon: Bell,
            color: 'bg-green-500',
        },
        {
            title: 'Clicked',
            value: stats.totalClicked,
            icon: Users,
            color: 'bg-purple-500',
        },
        {
            title: 'Failed',
            value: stats.totalFailed,
            icon: TrendingUp,
            color: 'bg-red-500',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    Notification Analytics
                </h2>
                <select
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value={1}>Last 24 hours</option>
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className={`${card.color} rounded-md p-3`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                    <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Rate</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(stats.deliveryRate, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="ml-4 text-2xl font-bold text-green-600">
                            {stats.deliveryRate.toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        {stats.totalDelivered} of {stats.totalSent} notifications delivered
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Click-through Rate</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(stats.clickRate, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="ml-4 text-2xl font-bold text-purple-600">
                            {stats.clickRate.toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        {stats.totalClicked} of {stats.totalDelivered} notifications clicked
                    </p>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-gray-700">Success Rate:</span>
                        <span className="ml-2 text-green-600 font-semibold">
                            {stats.totalSent > 0
                                ? ((stats.totalSent - stats.totalFailed) / stats.totalSent * 100).toFixed(1)
                                : 0}%
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Engagement:</span>
                        <span className="ml-2 text-blue-600 font-semibold">
                            {stats.totalSent > 0
                                ? (stats.totalClicked / stats.totalSent * 100).toFixed(1)
                                : 0}%
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Period:</span>
                        <span className="ml-2 text-gray-900 font-semibold">
                            Last {days} day{days !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
