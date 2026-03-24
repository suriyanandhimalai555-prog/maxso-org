import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from '../styles';

const API_URL = import.meta.env.VITE_API_URL || 'https://maxso-org-production.up.railway.app';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
    };
};

const Transactions = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((state) => state.auth.user);
    const [activeTab, setActiveTab] = useState('deposit');
    const [deposits, setDeposits] = useState([]);
    const [withdraws, setWithdraws] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdminActionModalOpen, setIsAdminActionModalOpen] = useState(false);
    const [actionTx, setActionTx] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [adminInputValue, setAdminInputValue] = useState('');
    
    const [txType, setTxType] = useState('deposit');
    const [txUserCode, setTxUserCode] = useState('');
    const [txSenderCode, setTxSenderCode] = useState('');
    const [txReceiverCode, setTxReceiverCode] = useState('');
    const [txAmount, setTxAmount] = useState('');
    const [txWalletType, setTxWalletType] = useState('ROI');
    const [txSubmitting, setTxSubmitting] = useState(false);
    const [walletBalances, setWalletBalances] = useState({ roiIncome: 0, levelIncome: 0, directIncome: 0 });

    const [searchTerm, setSearchTerm] = useState('');

    const [depositCurrentPage, setDepositCurrentPage] = useState(1);
    const [withdrawCurrentPage, setWithdrawCurrentPage] = useState(1);
    const [transferCurrentPage, setTransferCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchWalletBalances = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/stats`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setWalletBalances(data.wallet);
            }
        } catch (err) {
            console.error("Failed to fetch wallet balances", err);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const endpoint = user?.role === 'admin'
                ? `${API_URL}/api/transactions/admin/history`
                : `${API_URL}/api/transactions/history`;

            const response = await fetch(endpoint, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch transactions');

            const deps = [];
            const withs = [];
            const trans = [];

            // Helper: classify a transaction type string into a tab category
            const classifyType = (typeStr) => {
                const tl = (typeStr || '').toLowerCase();
                if (tl.includes('deposit') || tl.includes('wallet created')) return 'deposit';
                if (tl.includes('withdraw') || tl.includes('w/d')) return 'withdraw';
                if (tl.includes('roi') || tl.includes('level') || tl.includes('income') ||
                    tl.includes('referral') || tl.includes('direct') || tl.includes('transfer') ||
                    tl.includes('plan_purchase') || tl.includes('bonus')) return 'transfer';
                return 'transfer'; // catch-all: show in transfers
            };

            data.forEach(t => {
                const typeLower = (t.type || '').toLowerCase();
                const tab = classifyType(t.type);

                if (tab === 'deposit') {
                    deps.push({
                        ...t,
                        from_user: t.from_user || `ID:${t.user_id}`,
                        to_user: t.to_user || `ID:${t.reference_user_id}`,
                        plan_name: t.type || t.description || 'Deposit',
                        transaction_hash: t.transaction_hash || `TXN-${t.id}`
                    });
                } else if (tab === 'withdraw') {
                    withs.push({
                        ...t,
                        usercode: t.from_user || t.user_name || `ID:${t.user_id}`,
                        transaction_hash: t.transaction_hash || `TXN-${t.id}`,
                        status: t.status || 'pending'
                    });
                } else {
                    // Transfer / Income types — use the exact DB type string as the display label
                    let displayType = t.type;
                    // Only convert underscore-style generic names to pretty names
                    if (typeLower === 'roi_income') displayType = 'Daily ROI Income';
                    else if (typeLower === 'level_income') displayType = 'Level Income';
                    else if (typeLower === 'direct_income') displayType = 'Direct Referral Income';

                    trans.push({
                        ...t,
                        from_user: t.to_user || t.from_user || `ID:${t.reference_user_id || t.user_id}`,
                        to_user: t.from_user || t.user_name || `ID:${t.user_id}`,
                        type: displayType
                    });
                }
            });

            setDeposits(deps);
            setWithdraws(withs);
            setTransfers(trans);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTransactions();
            if (user.role !== 'admin') {
                fetchWalletBalances();
            }
        } else {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['deposit', 'withdraw', 'transfer'].includes(tabParam)) {
            setActiveTab(tabParam);
            setTxType(tabParam);
        }
    }, [location.search]);

    const handleAdminAction = async (e) => {
        e.preventDefault();
        setTxSubmitting(true);
        try {
            const endpoint = actionType === 'approve'
                ? `${API_URL}/api/transactions/admin/approve/${actionTx.id}`
                : `${API_URL}/api/transactions/admin/reject/${actionTx.id}`;
            
            const body = actionType === 'approve'
                ? { transactionHash: adminInputValue }
                : { reason: adminInputValue };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || 'Action failed');

            setIsAdminActionModalOpen(false);
            setAdminInputValue('');
            setActionTx(null);
            setActionType(null);
            fetchTransactions();
        } catch (err) {
            alert(err.message);
        } finally {
            setTxSubmitting(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/transactions?tab=${tab}`, { replace: true });
    };

    const handleTxSubmit = async (e) => {
        e.preventDefault();
        setTxSubmitting(true);
        try {
            const amount = parseFloat(txAmount);
            if (isNaN(amount) || amount <= 0) throw new Error('Please enter a valid amount');

            // For regular users, withdrawals are always requests
            const isWithdrawRequest = user.role !== 'admin' && txType === 'withdraw';
            const endpoint = isWithdrawRequest 
                ? `${API_URL}/api/transactions/withdraw-request`
                : `${API_URL}/api/transactions/${txType}`;

            const payload = { amount };

            if (isWithdrawRequest) {
                payload.walletType = txWalletType;
                
                // Client side validation for balance
                const walletColumnMap = {
                    'ROI': 'roiIncome',
                    'Level': 'levelIncome',
                    'Direct Referral': 'directIncome'
                };
                const available = walletBalances[walletColumnMap[txWalletType]] || 0;
                if (amount > available) throw new Error(`Insufficient balance in ${txWalletType} wallet`);
            } else if (txType === 'transfer') {
                payload.senderCode = txUserCode.trim();
                payload.receiverCode = txReceiverCode.trim();
            } else {
                payload.userCode = txUserCode.trim();
                if (txType === 'deposit' && txSenderCode.trim() !== '') {
                    payload.senderCode = txSenderCode.trim();
                }
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || 'Transaction failed');

            setIsModalOpen(false);
            setTxAmount('');
            setTxUserCode('');
            setTxSenderCode('');
            setTxReceiverCode('');
            fetchTransactions(); // Refresh list
            if (user.role !== 'admin') fetchWalletBalances(); // Refresh balances
        } catch (err) {
            alert(err.message);
        } finally {
            setTxSubmitting(false);
        }
    };

    // Get the full dataset for the active tab, filtered by search
    const getFilteredData = () => {
        let data = [];
        if (activeTab === 'deposit') data = deposits;
        else if (activeTab === 'withdraw') data = withdraws;
        else data = transfers;

        if (!searchTerm.trim()) return data;

        const term = searchTerm.toLowerCase();
        return data.filter(item => {
            const amount = String(item.amount || '');
            if (activeTab === 'deposit') {
                return (item.from_user || '').toLowerCase().includes(term) ||
                    (item.to_user || '').toLowerCase().includes(term) ||
                    (item.transaction_hash || '').toLowerCase().includes(term) ||
                    amount.includes(term);
            } else if (activeTab === 'withdraw') {
                return (item.usercode || '').toLowerCase().includes(term) ||
                    (item.type || '').toLowerCase().includes(term) ||
                    (item.status || '').toLowerCase().includes(term) ||
                    (item.transaction_hash || '').toLowerCase().includes(term) ||
                    amount.includes(term);
            } else {
                return (item.from_user || '').toLowerCase().includes(term) ||
                    (item.to_user || '').toLowerCase().includes(term) ||
                    (item.type || '').toLowerCase().includes(term) ||
                    amount.includes(term);
            }
        });
    };

    const getTotalCount = () => getFilteredData().length;
    const getTotalPages = () => Math.ceil(getTotalCount() / rowsPerPage) || 1;

    const getCurrentPage = () => {
        if (activeTab === 'deposit') return depositCurrentPage;
        if (activeTab === 'withdraw') return withdrawCurrentPage;
        return transferCurrentPage;
    };

    // Paginate the already-filtered data
    const getCurrentPageData = () => {
        const filtered = getFilteredData();
        const currentPage = getCurrentPage();
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filtered.slice(startIndex, startIndex + rowsPerPage);
    };

    const handlePrevPage = () => {
        if (activeTab === 'deposit') setDepositCurrentPage(prev => Math.max(prev - 1, 1));
        else if (activeTab === 'withdraw') setWithdrawCurrentPage(prev => Math.max(prev - 1, 1));
        else setTransferCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        const totalPages = getTotalPages();
        if (activeTab === 'deposit') setDepositCurrentPage(prev => Math.min(prev + 1, totalPages));
        else if (activeTab === 'withdraw') setWithdrawCurrentPage(prev => Math.min(prev + 1, totalPages));
        else setTransferCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        setDepositCurrentPage(1);
        setWithdrawCurrentPage(1);
        setTransferCurrentPage(1);
    }, [searchTerm]);

    if (loading) return <div className={styles.transactionContainer}><h2 className="text-white">Loading...</h2></div>;
    if (error) return <div className={styles.transactionContainer}><h2 className="text-red-500">{error}</h2></div>;

    const isWithdrawRequestModal = user?.role !== 'admin' && txType === 'withdraw';

    return (
        <div className={styles.transactionContainer}>
            <div className={styles.transactionHeader}>
                <div className={styles.transactionHeaderLeft}>
                    <h2 className={styles.transactionTitle}>Transaction List</h2>
                </div>

                <div className={styles.transactionTabContainer}>
                    <button
                        onClick={() => handleTabChange('deposit')}
                        className={`${styles.transactionTabButton} ${activeTab === 'deposit' ? styles.transactionTabActive : styles.transactionTabInactive}`}
                    >
                        Deposit
                    </button>
                    <button
                        onClick={() => handleTabChange('withdraw')}
                        className={`${styles.transactionTabButton} ${activeTab === 'withdraw' ? styles.transactionTabActive : styles.transactionTabInactive}`}
                    >
                        Withdraw
                    </button>
                    <button
                        onClick={() => handleTabChange('transfer')}
                        className={`${styles.transactionTabButton} ${activeTab === 'transfer' ? styles.transactionTabActive : styles.transactionTabInactive}`}
                    >
                        Transfer
                    </button>
                </div>
            </div>

            <div className={styles.transactionTableWrapper}>
                <div className={styles.transactionSearchHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className={styles.searchWrapper}>
                        <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {user && (user.role === 'admin' || activeTab === 'withdraw') && (
                        <button
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                            onClick={() => { 
                                setTxType(activeTab); 
                                if (user.role !== 'admin' && activeTab === 'withdraw') {
                                    fetchWalletBalances();
                                }
                                setIsModalOpen(true); 
                            }}
                        >
                            {user.role === 'admin' ? `+ New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` : 'Withdraw Funds'}
                        </button>
                    )}
                </div>

                <table className={styles.transactionTable}>
                    <thead className={styles.transactionThead}>
                        <tr>
                            <th className={styles.transactionTh}>S.No</th>

                            {activeTab === 'deposit' && (
                                <>
                                    <th className={styles.transactionTh}>From User</th>
                                    <th className={styles.transactionTh}>To User</th>
                                    <th className={styles.transactionTh}>Transaction Hash</th>
                                    <th className={styles.transactionTh}>Plan Name</th>
                                    <th className={styles.transactionTh}>Amount</th>
                                    <th className={styles.transactionTh}>Created At</th>
                                    <th className={styles.transactionTh}>Actions</th>
                                </>
                            )}

                            {activeTab === 'withdraw' && (
                                <>
                                    <th className={styles.transactionTh}>Usercode</th>
                                    <th className={styles.transactionTh}>Type</th>
                                    <th className={styles.transactionTh}>Amount</th>
                                    <th className={styles.transactionTh}>Transaction Hash</th>
                                    <th className={styles.transactionTh}>Status</th>
                                    <th className={styles.transactionTh}>Created At</th>
                                    <th className={styles.transactionTh}>Actions</th>
                                </>
                            )}

                            {activeTab === 'transfer' && (
                                <>
                                    <th className={styles.transactionTh}>From User</th>
                                    <th className={styles.transactionTh}>To User</th>
                                    <th className={styles.transactionTh}>Type</th>
                                    <th className={styles.transactionTh}>Amount</th>
                                    <th className={styles.transactionTh}>Created At</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {getCurrentPageData().map((item, index) => (
                            <tr key={item.id} className={styles.transactionTr}>
                                <td className={styles.transactionTdBold}>
                                    {((getCurrentPage() - 1) * rowsPerPage) + index + 1}
                                </td>

                                {activeTab === 'deposit' && (
                                    <>
                                        <td className={styles.transactionTd}>{item.from_user}</td>
                                        <td className={styles.transactionTd}>{item.to_user}</td>
                                        <td className={styles.transactionTd}>
                                            <span className={styles.transactionHash}>{item.transaction_hash}</span>
                                        </td>
                                        <td className={styles.transactionTd}>
                                            <span className={styles.transactionPlanBadge}>
                                                {item.plan_name}
                                            </span>
                                        </td>
                                        <td className={styles.transactionTd}>
                                            <span className={styles.transactionAmount}>
                                                ${parseFloat(item.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className={styles.transactionTd}>
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className={styles.transactionActionCell}>
                                            <button className={styles.transactionActionButton}>
                                                <svg className={styles.transactionActionIcon} fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                                                </svg>
                                            </button>
                                        </td>
                                    </>
                                )}

                                {activeTab === 'withdraw' && (
                                    <>
                                        <td className={styles.transactionTd}>{item.usercode}</td>
                                        <td className={styles.transactionTd}>
                                            <span className={styles.transactionType}>
                                                {item.type || 'Withdraw'}
                                            </span>
                                        </td>
                                        <td className={styles.transactionTd}>
                                            <span className={`${styles.transactionAmount} text-red-400`}>
                                                -${parseFloat(item.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className={styles.transactionTd}>
                                            <span className={styles.transactionHash}>{item.transaction_hash}</span>
                                        </td>
                                        <td className={styles.transactionTd}>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                item.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className={styles.transactionTd}>
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className={styles.transactionActionCell}>
                                            {user?.role === 'admin' && item.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => { setActionTx(item); setActionType('approve'); setIsAdminActionModalOpen(true); }}
                                                        className="px-2 py-1 bg-emerald-600 text-white text-[10px] uppercase font-bold rounded hover:bg-emerald-500 transition shadow-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => { setActionTx(item); setActionType('reject'); setIsAdminActionModalOpen(true); }}
                                                        className="px-2 py-1 bg-red-600 text-white text-[10px] uppercase font-bold rounded hover:bg-red-500 transition shadow-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className={styles.transactionActionButton}>
                                                    <svg className={styles.transactionActionIcon} fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    </>
                                )}

                                {activeTab === 'transfer' && (
                                    <>
                                        <td className={styles.transactionTd}>{item.from_user}</td>
                                        <td className={styles.transactionTd}>{item.to_user}</td>
                                        <td className={styles.transactionTd}>{item.type}</td>
                                        <td className={styles.transactionTd}>
                                            <span className={styles.transactionAmount}>
                                                ${parseFloat(item.amount).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className={styles.transactionTd}>
                                            {formatDate(item.created_at)}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {getFilteredData().length === 0 && (
                            <tr>
                                <td colSpan={activeTab === 'transfer' ? 6 : 8} className={styles.transactionNoData}>
                                    No {activeTab} transactions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className={styles.paginationContainer}>
                    <div className={styles.paginationRowsWrapper}>
                        <span className={styles.paginationRowsLabel}>Rows:</span>
                        <select
                            className={styles.rowsSelect}
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setDepositCurrentPage(1);
                                setWithdrawCurrentPage(1);
                                setTransferCurrentPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className={styles.paginationControls}>
                        <button
                            onClick={handlePrevPage}
                            disabled={getCurrentPage() === 1}
                            className={styles.paginationButton}
                            style={{ opacity: getCurrentPage() === 1 ? 0.5 : 1 }}
                        >
                            <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            Previous
                        </button>

                        <div className={styles.paginationNumbers}>
                            {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                                let pageNum = i + 1;
                                const currentPage = getCurrentPage();
                                const totalPages = getTotalPages();

                                if (currentPage > 3 && totalPages > 5) {
                                    pageNum = currentPage - 3 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (5 - i - 1);
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => {
                                            if (activeTab === 'deposit') setDepositCurrentPage(pageNum);
                                            else if (activeTab === 'withdraw') setWithdrawCurrentPage(pageNum);
                                            else setTransferCurrentPage(pageNum);
                                        }}
                                        className={currentPage === pageNum ? styles.paginationActive : styles.paginationInactive}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={getCurrentPage() === getTotalPages() || getTotalPages() === 0}
                            className={styles.paginationButton}
                            style={{ opacity: (getCurrentPage() === getTotalPages() || getTotalPages() === 0) ? 0.5 : 1 }}
                        >
                            Next
                            <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Creating Transactions */}
            {isModalOpen && (
                <div style={inlineStyles.modalOverlay}>
                    <div style={inlineStyles.modalContent}>
                        <h3 className="text-xl font-bold mb-4 text-white">
                            {isWithdrawRequestModal ? 'Withdraw Funds' : `Create Manual ${txType.charAt(0).toUpperCase() + txType.slice(1)}`}
                        </h3>
                        <form onSubmit={handleTxSubmit}>
                            {user.role === 'admin' && (
                                <div className="mb-4">
                                    <label className="block text-gray-300 text-sm font-bold mb-2">Transaction Type</label>
                                    <select
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3"
                                        value={txType}
                                        onChange={(e) => setTxType(e.target.value)}
                                    >
                                        <option value="deposit">Deposit</option>
                                        <option value="withdraw">Withdraw</option>
                                        <option value="transfer">Transfer</option>
                                    </select>
                                </div>
                            )}

                            {isWithdrawRequestModal && (
                                <div className="mb-4">
                                    <label className="block text-gray-300 text-sm font-bold mb-2">Wallet Type</label>
                                    <select
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3"
                                        value={txWalletType}
                                        onChange={(e) => setTxWalletType(e.target.value)}
                                    >
                                        <option value="ROI">ROI Wallet (${walletBalances.roiIncome.toFixed(2)})</option>
                                        <option value="Level">Level Wallet (${walletBalances.levelIncome.toFixed(2)})</option>
                                        <option value="Direct Referral">Direct Referral Wallet (${walletBalances.directIncome.toFixed(2)})</option>
                                    </select>
                                </div>
                            )}

                            {user.role === 'admin' && (
                                <div className="mb-4">
                                    <label className="block text-gray-300 text-sm font-bold mb-2">
                                        {txType === 'transfer' ? 'Sender User Code' : txType === 'deposit' ? 'Receiver User Code' : 'User Code'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                        value={txUserCode}
                                        onChange={(e) => setTxUserCode(e.target.value)}
                                    />
                                </div>
                            )}

                            {txType === 'deposit' && user?.role === 'admin' && (
                                <div className="mb-4">
                                    <label className="block text-gray-300 text-sm font-bold mb-2">Sender User Code (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Leave blank for Admin deposit"
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                        value={txSenderCode}
                                        onChange={(e) => setTxSenderCode(e.target.value)}
                                    />
                                </div>
                            )}

                            {txType === 'transfer' && user?.role === 'admin' && (
                                <div className="mb-4">
                                    <label className="block text-gray-300 text-sm font-bold mb-2">Receiver User Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                        value={txReceiverCode}
                                        onChange={(e) => setTxReceiverCode(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-bold mb-2">Amount ($)</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                    value={txAmount}
                                    onChange={(e) => setTxAmount(e.target.value)}
                                />
                                {isWithdrawRequestModal && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Max: ${
                                            txWalletType === 'ROI' ? walletBalances.roiIncome :
                                            txWalletType === 'Level' ? walletBalances.levelIncome :
                                            walletBalances.directIncome
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={txSubmitting}
                                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={txSubmitting}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                                >
                                    {txSubmitting ? 'Processing...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Action Modal (Approve/Reject) */}
            {isAdminActionModalOpen && (
                <div style={inlineStyles.modalOverlay}>
                    <div style={inlineStyles.modalContent}>
                        <h3 className="text-xl font-bold mb-4 text-white">
                            {actionType === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Request from: <span className="text-white font-bold">{actionTx?.usercode}</span> for <span className="text-white font-bold">${parseFloat(actionTx?.amount).toFixed(2)}</span>
                        </p>
                        <form onSubmit={handleAdminAction}>
                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-bold mb-2">
                                    {actionType === 'approve' ? 'Transaction Hash (Optional)' : 'Reason for Rejection'}
                                </label>
                                <textarea
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500 h-24 resize-none"
                                    value={adminInputValue}
                                    onChange={(e) => setAdminInputValue(e.target.value)}
                                    placeholder={actionType === 'approve' ? 'Enter crypto tx hash...' : 'Enter rejection reason...'}
                                    required={actionType === 'reject'}
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdminActionModalOpen(false); setActionTx(null); }}
                                    disabled={txSubmitting}
                                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={txSubmitting}
                                    className={`px-4 py-2 text-white rounded transition ${
                                        actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                                    }`}
                                >
                                    {txSubmitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
};

const inlineStyles = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
    },
    modalContent: {
        backgroundColor: '#1E1E2D',
        width: '400px',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '1px solid #2A2A3C'
    }
};

export default Transactions;