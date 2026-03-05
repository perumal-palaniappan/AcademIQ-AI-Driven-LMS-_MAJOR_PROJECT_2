import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <AlertCircle className="w-5 h-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
    };

    const textColors = {
        success: 'text-green-800',
        error: 'text-red-800',
        info: 'text-blue-800',
    };

    return (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[type]} backdrop-blur-sm`}>
                {icons[type]}
                <p className={`font-medium ${textColors[type]}`}>{message}</p>
                <button
                    onClick={onClose}
                    className={`ml-2 ${textColors[type]} hover:opacity-70 transition-opacity`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
