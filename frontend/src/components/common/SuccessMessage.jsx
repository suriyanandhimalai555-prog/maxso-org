// Reusable SuccessMessage toast component
// Usage: <SuccessMessage message="Saved!" isVisible={true} />
import React from 'react';

const SuccessMessage = ({ message, isVisible }) => {
    if (!isVisible || !message) return null;

    return (
        <div className="fixed top-5 right-5 z-50 animate-slideIn">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="font-medium">{message}</span>
            </div>
        </div>
    );
};

export default SuccessMessage;
