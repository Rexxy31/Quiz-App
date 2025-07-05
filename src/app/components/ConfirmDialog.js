"use client";

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "warning", // warning, danger, info
    loading = false 
}) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'text-red-600',
                    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    border: 'border-red-200'
                };
            case 'warning':
                return {
                    icon: 'text-yellow-600',
                    button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
                    border: 'border-yellow-200'
                };
            case 'info':
                return {
                    icon: 'text-blue-600',
                    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                    border: 'border-blue-200'
                };
            default:
                return {
                    icon: 'text-gray-600',
                    button: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
                    border: 'border-gray-200'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
                onClick={onClose}
            />
            
            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${styles.border}`}>
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full p-1"
                            disabled={loading}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-600 leading-relaxed">{message}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`px-4 py-2 text-sm font-medium text-white ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            <span>{confirmText}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { 
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to { 
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </>
    );
} 