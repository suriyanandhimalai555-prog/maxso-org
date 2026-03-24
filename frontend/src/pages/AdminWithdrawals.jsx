import React, { useState, useEffect } from 'react';
import API_URL from '../config/api';
import { getAuthHeaders } from '../services/api';
import styles from '../styles';

const AdminWithdrawals = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [inputValue, setInputValue] = useState(''); // hash or reason
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchPendingRequests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/transactions/admin/pending`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch pending withdrawals", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const handleAction = async (e) => {
        e.preventDefault();
        if (!actionId || !actionType) return;

        setIsSubmitting(true);
        try {
            const endpoint = actionType === 'approve' 
                ? `${API_URL}/api/transactions/admin/approve/${actionId}`
                : `${API_URL}/api/transactions/admin/reject/${actionId}`;
            
            const body = actionType === 'approve' 
                ? { transactionHash: inputValue }
                : { reason: inputValue };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: `Withdrawal ${actionType}d successfully!` });
                setActionId(null);
                setActionType(null);
                setInputValue('');
                fetchPendingRequests();
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.message || `Failed to ${actionType} withdrawal` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className={styles.dashSectionTitle}>Pending Withdrawals</h2>
                <p className="text-gray-400 mt-1">Review and process user withdrawal requests.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {/* Modal for Approve/Reject */}
            {actionId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">
                            {actionType === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
                        </h3>
                        <form onSubmit={handleAction} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    {actionType === 'approve' ? 'Transaction Hash (Optional)' : 'Reason for Rejection'}
                                </label>
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={actionType === 'approve' ? 'Enter crypto tx hash...' : 'Enter reason...'}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-colors text-white h-24"
                                    required={actionType === 'reject'}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => { setActionId(null); setActionType(null); }}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 font-bold py-3 rounded-xl transition-all ${
                                        actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
                                    }`}
                                >
                                    {isSubmitting ? 'Processing...' : actionType === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pending Requests Table */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">User / Date</th>
                                <th className="px-6 py-4 font-medium">Wallet Type</th>
                                <th className="px-6 py-4 font-medium text-right">Amount</th>
                                <th className="px-6 py-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {pendingRequests.length > 0 ? pendingRequests.map((row) => (
                                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-200">{row.user_name}</div>
                                        <div className="text-xs text-gray-500">{row.referral_code} | {new Date(row.created_at).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-300 font-medium">{row.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-lg font-bold text-red-400">${parseFloat(row.amount).toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => { setActionId(row.id); setActionType('approve'); setInputValue(''); }}
                                                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => { setActionId(row.id); setActionType('reject'); setInputValue(''); }}
                                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        {isLoading ? 'Loading requests...' : 'No pending withdrawals found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminWithdrawals;
