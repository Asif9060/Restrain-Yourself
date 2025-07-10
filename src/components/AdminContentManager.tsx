'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Save,
    X,
    Quote as QuoteIcon,
    Heart,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { ContentService } from '@/services/ContentService';
import { Quote, HealthTip, HabitCategory } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES: HabitCategory[] = [
    'smoking',
    'drinking',
    'adult-content',
    'social-media',
    'junk-food',
    'custom',
];

interface AdminContentManagerProps {
    onClose: () => void;
}

export function AdminContentManager({ onClose }: AdminContentManagerProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'quotes' | 'tips'>('quotes');
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<Quote | HealthTip | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state for adding/editing
    const [formData, setFormData] = useState({
        text: '',
        author: '',
        title: '',
        content: '',
        category: 'smoking' as HabitCategory,
        isActive: true,
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'quotes') {
                const quotesData = await ContentService.getQuotes();
                setQuotes(quotesData);
            } else {
                const tipsData = await ContentService.getHealthTips();
                setHealthTips(tipsData);
            }
        } catch (err) {
            setError('Failed to load content');
            console.error('Error loading content:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const handleAdd = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'quotes') {
                await ContentService.createQuote({
                    text: formData.text,
                    author: formData.author,
                    category: formData.category,
                    isActive: formData.isActive,
                }, user.id);
            } else {
                await ContentService.createHealthTip({
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                    isActive: formData.isActive,
                }, user.id);
            }

            setShowAddForm(false);
            resetForm();
            loadData();
        } catch (err) {
            setError('Failed to create content');
            console.error('Error creating content:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (item: Quote | HealthTip) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'quotes' && 'text' in item) {
                await ContentService.updateQuote(item.id, {
                    text: formData.text,
                    author: formData.author,
                    category: formData.category,
                    isActive: formData.isActive,
                }, user.id);
            } else if ('title' in item) {
                await ContentService.updateHealthTip(item.id, {
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                    isActive: formData.isActive,
                }, user.id);
            }

            setEditingItem(null);
            resetForm();
            loadData();
        } catch (err) {
            setError('Failed to update content');
            console.error('Error updating content:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (item: Quote | HealthTip) => {
        if (!user || !confirm('Are you sure you want to delete this item?')) return;

        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'quotes') {
                await ContentService.deleteQuote(item.id, user.id);
            } else {
                await ContentService.deleteHealthTip(item.id, user.id);
            }

            loadData();
        } catch (err) {
            setError('Failed to delete content');
            console.error('Error deleting content:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (item: Quote | HealthTip) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'quotes') {
                await ContentService.updateQuote(item.id, {
                    isActive: !item.isActive,
                }, user.id);
            } else {
                await ContentService.updateHealthTip(item.id, {
                    isActive: !item.isActive,
                }, user.id);
            }

            loadData();
        } catch (err) {
            setError('Failed to update content');
            console.error('Error updating content:', err);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (item: Quote | HealthTip) => {
        setEditingItem(item);
        if ('text' in item) {
            setFormData({
                text: item.text,
                author: item.author,
                title: '',
                content: '',
                category: item.category,
                isActive: item.isActive,
            });
        } else {
            setFormData({
                text: '',
                author: '',
                title: item.title,
                content: item.content,
                category: item.category,
                isActive: item.isActive,
            });
        }
    };

    const resetForm = () => {
        setFormData({
            text: '',
            author: '',
            title: '',
            content: '',
            category: 'smoking',
            isActive: true,
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setShowAddForm(false);
        resetForm();
    };

    if (!user?.isAdmin) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">You need admin privileges to access this feature.</p>
                    <button
                        onClick={onClose}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('quotes')}
                        className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'quotes'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <QuoteIcon className="w-4 h-4" />
                        Motivational Quotes
                    </button>
                    <button
                        onClick={() => setActiveTab('tips')}
                        className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'tips'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Heart className="w-4 h-4" />
                        Health Tips
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Items List */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {activeTab === 'quotes' ? 'Quotes' : 'Health Tips'} ({activeTab === 'quotes' ? quotes.length : healthTips.length})
                            </h3>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add {activeTab === 'quotes' ? 'Quote' : 'Tip'}
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2 text-red-700">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        )}

                        <div className="space-y-4">
                            {(activeTab === 'quotes' ? quotes : healthTips).map((item) => (
                                <div
                                    key={item.id}
                                    className={`border rounded-lg p-4 ${item.isActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${item.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {item.category}
                                                </span>
                                                {!item.isActive && (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            {'text' in item ? (
                                                <>
                                                    <p className="text-gray-900 mb-1">&ldquo;{item.text}&rdquo;</p>
                                                    <p className="text-sm text-gray-600">— {item.author}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                                                    <p className="text-gray-600 text-sm">{item.content}</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => handleToggleActive(item)}
                                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                title={item.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {item.isActive ? (
                                                    <Eye className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Panel */}
                    {(showAddForm || editingItem) && (
                        <div className="w-96 border-l bg-gray-50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {editingItem ? 'Edit' : 'Add'} {activeTab === 'quotes' ? 'Quote' : 'Health Tip'}
                                </h3>
                                <button
                                    onClick={cancelEdit}
                                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {activeTab === 'quotes' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quote Text
                                            </label>
                                            <textarea
                                                value={formData.text}
                                                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                rows={4}
                                                placeholder="Enter the quote text..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Author
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.author}
                                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Author name"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Title
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Health tip title"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Content
                                            </label>
                                            <textarea
                                                value={formData.content}
                                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                rows={6}
                                                placeholder="Enter the health tip content..."
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as HabitCategory })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {CATEGORIES.map((category) => (
                                            <option key={category} value={category}>
                                                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                        Active
                                    </label>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={editingItem ? () => handleEdit(editingItem) : handleAdd}
                                        disabled={loading || !formData.text && !formData.title}
                                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {editingItem ? 'Update' : 'Create'}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
