// Reusable StatusBadge component
// Usage: <StatusBadge status="active" />
import React from 'react';

const statusConfig = {
    active: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800/50', label: 'Active' },
    inactive: { bg: 'bg-gray-900/30', text: 'text-gray-400', border: 'border-gray-800/50', label: 'Inactive' },
    pending: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-800/50', label: 'Pending' },
    completed: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-800/50', label: 'Completed' },
    cancelled: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-800/50', label: 'Cancelled' },
    open: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800/50', label: 'Open' },
    closed: { bg: 'bg-gray-900/30', text: 'text-gray-400', border: 'border-gray-800/50', label: 'Closed' },
    high: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-800/50', label: 'High' },
    medium: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-800/50', label: 'Medium' },
    low: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800/50', label: 'Low' },
    admin: { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-800/50', label: 'Admin' },
    user: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800/50', label: 'User' },
};

const StatusBadge = ({ status, label, className = '' }) => {
    const config = statusConfig[status?.toLowerCase()] || statusConfig.inactive;
    const displayLabel = label || config.label;

    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}>
            {displayLabel}
        </span>
    );
};

export default StatusBadge;
export { statusConfig };
