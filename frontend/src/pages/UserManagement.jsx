import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { getAuthHeaders } from '../services/api';
import { verifyUser } from '../features/authSlice';
import styles from '../styles';

const UserManagement = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [openActionId, setOpenActionId] = useState(null);
    const [editModalData, setEditModalData] = useState(null);


    const [referrals, setReferrals] = useState([]);

    const [totalReferrals, setTotalReferrals] = useState(0);
    const [referralLoading, setReferralLoading] = useState(false);
    const [referralError, setReferralError] = useState(null);
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        const fetchReferrals = async () => {
            if (activeTab !== 'referrals') return;

            setReferralLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/user/admin/referrals`, {
                    headers: getAuthHeaders(),
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch referrals');
                }

                // Assuming backend returns an array of referrals directly
                setReferrals(data || []);
            } catch (err) {
                setReferralError(err.message);
            } finally {
                setReferralLoading(false);
            }
        };

        if (user && user.role === 'admin') {
            fetchReferrals();
        }
    }, [user, activeTab]);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [referralCurrentPage, setReferralCurrentPage] = useState(1);
    const [referralRowsPerPage, setReferralRowsPerPage] = useState(10);
    const [referralTotalPages, setReferralTotalPages] = useState(1);
    const [walletBalance, setWalletBalance] = useState('0.00');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        console.log('URL tab param:', tabParam);
        if (tabParam && ['users', 'referrals'].includes(tabParam)) {
            setActiveTab(tabParam);
        } else {
            setActiveTab('users');
        }
    }, [location.search]);

    const handleTabChange = (tab) => {
        console.log('Changing tab to:', tab);
        setActiveTab(tab);
        navigate(`/admin/users?tab=${tab}`, { replace: true });
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (activeTab !== 'users') return;

            setLoading(true);
            try {
                const query = new URLSearchParams({
                    page: currentPage,
                    limit: rowsPerPage,
                    ...(debouncedSearch && { search: debouncedSearch })
                }).toString();

                const response = await fetch(`${API_URL}/api/user/admin/users?${query}`, {
                    headers: getAuthHeaders(),
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch users');
                }

                setUsers(data.users || []);
                setTotalUsers(data.total || 0);
                setTotalPages(data.totalPages || 1);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === 'admin') {
            fetchUsers();
        }
    }, [user, activeTab, currentPage, rowsPerPage, debouncedSearch]);

    useEffect(() => {
        if (activeTab === 'referrals') {
            setReferralTotalPages(Math.ceil(referrals.length / referralRowsPerPage));
            setTotalReferrals(referrals.length);
        }
    }, [activeTab, referralRowsPerPage, referrals.length]);

    const handleSearch = (e) => setSearchTerm(e.target.value);
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

    const handleReferralPrevPage = () => setReferralCurrentPage(prev => Math.max(prev - 1, 1));
    const handleReferralNextPage = () => setReferralCurrentPage(prev => Math.min(prev + 1, referralTotalPages));

    const getCurrentPageReferrals = () => {
        const startIndex = (referralCurrentPage - 1) * referralRowsPerPage;
        const endIndex = startIndex + referralRowsPerPage;
        return referrals.slice(startIndex, endIndex);
    };

    const toggleActionMenu = (id) => {
        setOpenActionId(openActionId === id ? null : id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const response = await fetch(`${API_URL}/api/user/admin/users/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete');
            }
        } catch (err) {
            console.error(err);
        }
        setOpenActionId(null);
    };

    const handleLoginAs = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/user/admin/login-as/${id}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                if (data.token) localStorage.setItem('token', data.token);
                // Await verification to update Redux state, then soft redirect
                await dispatch(verifyUser());
                navigate('/');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to login as user');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditClick = (u) => {
        setEditModalData({ ...u });
        setOpenActionId(null);
    };

    const handleEditChange = (field, value) => {
        setEditModalData({ ...editModalData, [field]: value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/user/admin/users/${editModalData.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(editModalData),
            });
            if (response.ok) {
                const { user: updatedUser } = await response.json();
                setUsers(users.map(u => u.id === editModalData.id ? { ...u, ...updatedUser } : u));
                setEditModalData(null);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update user');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusToggle = async (u) => {
        try {
            const newStatus = !u.status;
            const response = await fetch(`${API_URL}/api/user/admin/users/${u.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                setUsers(users.map(userItem => userItem.id === u.id ? { ...userItem, status: newStatus } : userItem));
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update user status');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && activeTab === 'users') return <div className={styles.umLoading}>Loading users...</div>;
    if (error && activeTab === 'users') return <div className={styles.umError}>{error}</div>;

    return (
        <div className={styles.umContainer}>
            <div className={styles.umHeaderFlex}>
                <div className={styles.umHeaderLeft}>
                    <h2 className={styles.umTitle}>User Management</h2>
                </div>

                <div className={styles.umTabContainer}>
                    <button
                        onClick={() => handleTabChange('users')}
                        className={`${styles.umTabButton} ${activeTab === 'users' ? styles.umTabActive : styles.umTabInactive}`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => handleTabChange('referrals')}
                        className={`${styles.umTabButton} ${activeTab === 'referrals' ? styles.umTabActive : styles.umTabInactive}`}
                    >
                        Referrals
                    </button>
                </div>

                <div className={styles.umDateButtonWrapper}>
                    <div className={styles.umDateButton}>
                        <svg className={styles.umDateIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Date
                    </div>
                </div>
            </div>

            {activeTab === 'users' && (
                <div className={styles.umTableWrapper}>
                    <div className={styles.umSearchHeader}>
                        <div className={styles.searchWrapper}>
                            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search users..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>

                    <table className={styles.umTable}>
                        <thead className={styles.umThead}>
                            <tr>
                                <th scope="col" className={styles.umTh}>S.No</th>
                                <th scope="col" className={styles.umTh}>Name</th>
                                <th scope="col" className={styles.umTh}>Email</th>
                                <th scope="col" className={styles.umTh}>Phone No</th>
                                <th scope="col" className={styles.umTh}>Wallet Address</th>
                                <th scope="col" className={styles.umTh}>Balance</th>
                                <th scope="col" className={styles.umTh}>Role</th>
                                <th scope="col" className={styles.umTh}>UserCode</th>
                                <th scope="col" className={styles.umTh}>Status</th>
                                <th scope="col" className={styles.umTh}>Created At</th>
                                <th scope="col" className={styles.umThAction}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, index) => (
                                <tr key={u.id} className={styles.umTr}>
                                    <td className={styles.umTdBold}>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                    <td className={styles.umTd}>{u.name || (u.email.split('@')[0])}</td>
                                    <td className={styles.umTd}>{u.email}</td>
                                    <td className={styles.umTd}>{u.phone_number || '+919611443729'}</td>
                                    <td className={styles.umTd}>{u.wallet_address || '-'}</td>
                                    <td className={styles.umTd}>${parseFloat(u.wallet_balance || 0).toLocaleString()}</td>
                                    <td className={styles.umTd}>
                                        <span className={`${styles.umRoleBadgeBase} ${u.role === 'admin' ? styles.umRoleAdmin : styles.umRoleUser}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className={`${styles.umTd} ${styles.umUserCode}`}>{u.referral_code}</td>
                                    <td className={styles.umTd}>
                                        <label className={styles.switchWrapper}>
                                            <input
                                                type="checkbox"
                                                className={styles.switchInput}
                                                checked={u.status === true || u.status === 'true'}
                                                onChange={() => handleStatusToggle(u)}
                                            />
                                            <div className={styles.switchBg}></div>
                                        </label>
                                    </td>
                                    <td className={styles.umTd}>{u.created_at ? new Date(u.created_at).toLocaleString() : '18/2/2026, 9:54:29 pm'}</td>
                                    <td className={styles.umActionCell}>
                                        <button
                                            type="button"
                                            className="p-1 rounded-md hover:bg-gray-800 transition-colors focus:outline-none"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleActionMenu(u.id);
                                            }}
                                        >
                                            <svg
                                                className={styles.umActionIcon}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                                            </svg>
                                        </button>

                                        {openActionId === u.id && (
                                            <div className={styles.umDropdownMenu}>
                                                <button
                                                    type="button"
                                                    className={`w-full text-left ${styles.umDropdownItem}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(u);
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`w-full text-left ${styles.umDropdownItemDelete}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(u.id);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`w-full text-left ${styles.umDropdownItemLogin}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLoginAs(u.id);
                                                    }}
                                                >
                                                    Login as them
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="10" className={styles.umNoDataCell}>
                                        No users found.
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
                                    setCurrentPage(1);
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
                                disabled={currentPage === 1}
                                className={styles.paginationButton}
                            >
                                <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                Previous
                            </button>

                            <div className={styles.paginationNumbers}>
                                {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                                    let pageNum = i + 1;
                                    if (currentPage > 2 && totalPages > 4) {
                                        pageNum = currentPage - 2 + i;
                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i - 1);
                                    }

                                    return (
                                        <span
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={currentPage === pageNum ? styles.paginationActive : styles.paginationInactive}
                                        >
                                            {pageNum}
                                        </span>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className={styles.paginationButton}
                            >
                                Next
                                <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'referrals' && (
                <div className={styles.umContainer}>
                    <div className={styles.umSearchHeader}>
                        <div className={styles.searchWrapper}>
                            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search Referrals..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                    <div className={styles.umReferralsContent}>
                        {referralLoading ? (
                            <div className={styles.umLoading}>Loading referrals...</div>
                        ) : referralError ? (
                            <div className={styles.umError}>{referralError}</div>
                        ) : (
                            <>
                                <div className={styles.umTableWrapper}>
                                    <table className={styles.umTable}>
                                        <thead className={styles.umThead}>
                                            <tr>
                                                <th scope="col" className={styles.umTh}>S.No</th>
                                                <th scope="col" className={styles.umTh}>Referrer</th>
                                                <th scope="col" className={styles.umTh}>Referred</th>
                                                <th scope="col" className={styles.umTh}>Level</th>
                                                <th scope="col" className={styles.umTh}>Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getCurrentPageReferrals().map((referral, index) => (
                                                <tr key={referral.id} className={styles.umTr}>
                                                    <td className={styles.umTdBold}>
                                                        {((referralCurrentPage - 1) * referralRowsPerPage + index + 1)}
                                                    </td>
                                                    <td className={styles.umTd}>
                                                        <div>{referral.referrer_name || 'N/A'}</div>
                                                        <div className="text-xs text-gray-400">{referral.referrer_code}</div>
                                                    </td>
                                                    <td className={styles.umTd}>
                                                        <div>{referral.referred_name || 'N/A'}</div>
                                                        <div className="text-xs text-gray-400">{referral.referred_code}</div>
                                                    </td>
                                                    <td className={styles.umTd}>
                                                        <span className={`${styles.umRoleBadgeBase} ${styles.umRoleUser}`}>
                                                            Level {referral.level}
                                                        </span>
                                                    </td>
                                                    <td className={styles.umTd}>
                                                        {new Date(referral.created_at).toLocaleString('en-US', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </td>
                                                </tr>
                                            ))}
                                            {referrals.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className={styles.umNoDataCell}>
                                                        No referrals found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className={styles.paginationContainer}>
                                    <div className={styles.paginationRowsWrapper}>
                                        <div className={styles.paginationRowsInner}>
                                            <span className={styles.paginationRowsLabel}>Rows:</span>
                                            <select
                                                className={styles.rowsSelect}
                                                value={referralRowsPerPage}
                                                onChange={(e) => {
                                                    setReferralRowsPerPage(Number(e.target.value));
                                                    setReferralCurrentPage(1);
                                                }}
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className={styles.paginationControls}>
                                        <button
                                            onClick={handleReferralPrevPage}
                                            disabled={referralCurrentPage === 1}
                                            className={styles.paginationButton}
                                            style={{ opacity: referralCurrentPage === 1 ? 0.5 : 1 }}
                                        >
                                            <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                            </svg>
                                            Previous
                                        </button>

                                        <div className={styles.paginationNumbers}>
                                            {Array.from({ length: Math.min(5, referralTotalPages) }, (_, i) => {
                                                let pageNum = i + 1;
                                                if (referralCurrentPage > 3 && referralTotalPages > 5) {
                                                    pageNum = referralCurrentPage - 3 + i;
                                                    if (pageNum > referralTotalPages) pageNum = referralTotalPages - (5 - i - 1);
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setReferralCurrentPage(pageNum)}
                                                        className={referralCurrentPage === pageNum ? styles.paginationActive : styles.paginationInactive}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={handleReferralNextPage}
                                            disabled={referralCurrentPage === referralTotalPages}
                                            className={styles.paginationButton}
                                            style={{ opacity: referralCurrentPage === referralTotalPages ? 0.5 : 1 }}
                                        >
                                            Next
                                            <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editModalData && (
                <div style={inlineStyles.modalOverlay}>
                    <div style={inlineStyles.modalContent}>
                        <h3 className="text-xl font-bold mb-4 text-white">Edit User</h3>
                        <form onSubmit={handleSave}>
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2">Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                    value={editModalData.name || ''}
                                    onChange={(e) => handleEditChange('name', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                    value={editModalData.email || ''}
                                    onChange={(e) => handleEditChange('email', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                    value={editModalData.phone_number || ''}
                                    onChange={(e) => handleEditChange('phone_number', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2">Wallet Address</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                    value={editModalData.wallet_address || ''}
                                    onChange={(e) => handleEditChange('wallet_address', e.target.value)}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-bold mb-2">Role</label>
                                <select
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-purple-500"
                                    value={editModalData.role || 'user'}
                                    onChange={(e) => handleEditChange('role', e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setEditModalData(null)}
                                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
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

export default UserManagement;