// Reusable Modal component
// Usage: <Modal isOpen={true} onClose={fn} title="My Modal">content</Modal>
import React from 'react';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md', // 'sm' | 'md' | 'lg'
    overlayClass = '',
    modalClass = '',
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
    };

    return (
        <div
            className={overlayClass || "fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={modalClass || `bg-[#111] border border-[#333] rounded-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between sticky top-0 bg-[#111] z-10">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
