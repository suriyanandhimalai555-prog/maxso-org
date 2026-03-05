// Reusable PageHeader component
// Usage: <PageHeader title="Plans" badge="5" actions={<button>Add</button>} />
import React from 'react';

const PageHeader = ({ title, badge, actions, dividerStyle = 'gradient' }) => {
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    {badge !== undefined && (
                        <span className="bg-[#1a1a1a] text-red-500 border border-red-900/50 text-sm font-medium px-3 py-1 rounded-md">
                            {badge}
                        </span>
                    )}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
            {dividerStyle === 'gradient' && (
                <div style={{ height: '2px', background: 'linear-gradient(to right, #dc2626, transparent)', marginBottom: '24px' }}></div>
            )}
        </div>
    );
};

export default PageHeader;
