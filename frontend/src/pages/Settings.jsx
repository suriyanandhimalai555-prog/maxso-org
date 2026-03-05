
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { getAuthHeaders } from '../services/api';
import styles from '../styles';

const Settings = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('profile');

    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        loginCode: '',
        walletAddress: '',
        country: '',
        joinedDate: '',
        totalReferrals: 0,
        totalEarnings: 0
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${API_URL}/api/user/me`, {
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    setProfileData({
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.phone_number || '',
                        loginCode: data.referral_code || '',
                        walletAddress: data.wallet_address || '',
                        country: data.country || '',
                        joinedDate: data.created_at || new Date().toISOString(),
                        totalReferrals: data.referral_count || 0,
                        totalEarnings: 0
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchProfile();
    }, []);
    const [passwordModal, setPasswordModal] = useState({
        show: false,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [logoutModal, setLogoutModal] = useState({ show: false });

    const [supportTickets, setSupportTickets] = useState([
        {
            id: 1,
            username: 'John Anderson (MAX78945)',
            ticketId: 'TKT-2024-001',
            subject: 'Withdrawal Issue - Payment Pending',
            status: 'open',
            priority: 'high',
            created_at: '2024-02-25T14:30:00Z',
            lastUpdated: '2024-02-26T09:15:00Z'
        },
        {
            id: 2,
            username: 'Sarah Williams (MAX45678)',
            ticketId: 'TKT-2024-002',
            subject: 'Login Problem - Two Factor Authentication',
            status: 'pending',
            priority: 'medium',
            created_at: '2024-02-24T11:20:00Z',
            lastUpdated: '2024-02-25T16:45:00Z'
        },
        {
            id: 3,
            username: 'Michael Brown (MAX12345)',
            ticketId: 'TKT-2024-003',
            subject: 'Deposit Not Credited - Transaction Hash: 0x8d76...7086',
            status: 'closed',
            priority: 'high',
            created_at: '2024-02-23T09:45:00Z',
            lastUpdated: '2024-02-24T13:30:00Z'
        }
    ]);

    const [ticketModal, setTicketModal] = useState({
        show: false,
        mode: 'view',
        data: null
    });

    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [openActionId, setOpenActionId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [successMessage, setSuccessMessage] = useState({ show: false, message: '' });
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['profile', 'help-support'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [location.search]);
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/settings?tab=${tab}`, { replace: true });
    };
    const handleEditChange = (field, value) => {
        setProfileData({ ...profileData, [field]: value });
    };

    const handleSaveProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: profileData.name,
                    email: profileData.email,
                    phone_number: profileData.phone,
                    country: profileData.country,
                    wallet_address: profileData.walletAddress
                })
            });
            const data = await response.json();
            if (response.ok) {
                setIsEditing(false);
                showSuccessMessage('Profile updated successfully!');
            } else {
                alert(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('An error occurred while saving.');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordModal.newPassword !== passwordModal.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/user/password`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    oldPassword: passwordModal.oldPassword,
                    newPassword: passwordModal.newPassword
                })
            });
            const data = await response.json();
            if (response.ok) {
                setPasswordModal({ show: false, oldPassword: '', newPassword: '', confirmPassword: '' });
                showSuccessMessage('Password changed successfully!');
            } else {
                alert(data.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('An error occurred while changing password.');
        }
    };
    const handleLogoutClick = () => {
        setLogoutModal({ show: true });
    };

    const confirmLogout = () => {
        setLogoutModal({ show: false });
        showSuccessMessage('Logged out successfully!');
        setTimeout(() => {
            navigate('/login');
        }, 1500);
    };

    const cancelLogout = () => {
        setLogoutModal({ show: false });
    };
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleViewTicket = (ticket) => {
        setTicketModal({ show: true, mode: 'view', data: ticket });
        setOpenActionId(null);
    };

    const handleEditTicket = (ticket) => {
        setTicketModal({ show: true, mode: 'edit', data: { ...ticket } });
        setOpenActionId(null);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
        setOpenActionId(null);
    };

    const confirmDelete = () => {
        setSupportTickets(supportTickets.filter(ticket => ticket.id !== deleteModal.id));
        setDeleteModal({ show: false, id: null });
        showSuccessMessage('Ticket deleted successfully!');
    };

    const handleSaveTicket = (e) => {
        e.preventDefault();

        if (ticketModal.mode === 'edit') {
            setSupportTickets(supportTickets.map(ticket =>
                ticket.id === ticketModal.data.id ? { ...ticketModal.data } : ticket
            ));
            showSuccessMessage('Ticket updated successfully!');
        }

        setTicketModal({ show: false, mode: 'view', data: null });
    };

    const handleTicketChange = (field, value) => {
        setTicketModal({
            ...ticketModal,
            data: { ...ticketModal.data, [field]: value }
        });
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const showSuccessMessage = (message) => {
        setSuccessMessage({ show: true, message });
        setTimeout(() => setSuccessMessage({ show: false, message: '' }), 3000);
    };

    const filteredTickets = supportTickets.filter(ticket =>
        ticket.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCurrentPageTickets = () => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredTickets.slice(startIndex, endIndex);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open':
                return styles.settingsBadgeOpen;
            case 'pending':
                return styles.settingsBadgePending;
            case 'closed':
                return styles.settingsBadgeClosed;
            default:
                return styles.settingsBadgeClosed;
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'high':
                return styles.settingsBadgeHigh;
            case 'medium':
                return styles.settingsBadgeMedium;
            case 'low':
                return styles.settingsBadgeLow;
            default:
                return styles.settingsBadgeClosed;
        }
    };

    return (
        <div className={styles.settingsContainer}>
            {successMessage.show && (
                <div className={styles.settingsSuccessMessage}>
                    <div className={styles.settingsSuccessContent}>
                        <svg className={styles.settingsSuccessIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className={styles.settingsSuccessText}>{successMessage.message}</span>
                    </div>
                </div>
            )}
            <div className={styles.settingsHeader}>
                <div className={styles.settingsHeaderLeft}>
                    <h2 className={styles.settingsTitle}>Settings</h2>
                </div>
                <div className={styles.settingsTabContainer}>
                    <button
                        onClick={() => handleTabChange('profile')}
                        className={`${styles.settingsTabButton} ${activeTab === 'profile' ? styles.settingsTabActive : styles.settingsTabInactive}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => handleTabChange('help-support')}
                        className={`${styles.settingsTabButton} ${activeTab === 'help-support' ? styles.settingsTabActive : styles.settingsTabInactive}`}
                    >
                        Help & Support
                    </button>
                </div>
            </div>

            {activeTab === 'profile' && (
                <div className={styles.settingsProfileCard}>
                    <div className={styles.settingsProfileHeader}>
                        <div className={styles.settingsProfileHeaderContent}>
                            <div className={styles.settingsAvatar}>
                                {profileData.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className={styles.settingsProfileName}>{profileData.name}</h3>
                                <p className={styles.settingsProfileCode}>{profileData.loginCode}</p>
                                <p className={styles.settingsProfileMember}>Member since {new Date(profileData.joinedDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.settingsProfileStats}>
                        <div className={styles.settingsStatItem}>
                            <p className={styles.settingsStatValue}>{profileData.totalReferrals}</p>
                            <p className={styles.settingsStatLabel}>Total Referrals</p>
                        </div>
                        <div className={styles.settingsStatItem}>
                            <p className={styles.settingsStatValue}>${profileData.totalEarnings}</p>
                            <p className={styles.settingsStatLabel}>Total Earnings</p>
                        </div>
                    </div>

                    <div className={styles.settingsProfileDetails}>
                        <div className={styles.settingsDetailItem}>
                            <div className={styles.settingsDetailIcon}>
                                <svg className={styles.settingsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div className={styles.settingsDetailContent}>
                                <p className={styles.settingsDetailLabel}>Email</p>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => handleEditChange('email', e.target.value)}
                                        className={styles.settingsDetailInput}
                                    />
                                ) : (
                                    <p className={styles.settingsDetailText}>{profileData.email}</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.settingsDetailItem}>
                            <div className={styles.settingsDetailIcon}>
                                <svg className={styles.settingsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                </svg>
                            </div>
                            <div className={styles.settingsDetailContent}>
                                <p className={styles.settingsDetailLabel}>Phone</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profileData.phone}
                                        onChange={(e) => handleEditChange('phone', e.target.value)}
                                        className={styles.settingsDetailInput}
                                    />
                                ) : (
                                    <p className={styles.settingsDetailText}>{profileData.phone}</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.settingsDetailItem}>
                            <div className={styles.settingsDetailIcon}>
                                <svg className={styles.settingsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div className={styles.settingsDetailContent}>
                                <p className={styles.settingsDetailLabel}>Country</p>
                                {isEditing ? (
                                    <select
                                        value={profileData.country}
                                        onChange={(e) => handleEditChange('country', e.target.value)}
                                        className={styles.settingsDetailSelect}
                                    >
                                        <option value="United States">United States</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Australia">Australia</option>
                                        <option value="India">India</option>
                                    </select>
                                ) : (
                                    <p className={styles.settingsDetailText}>{profileData.country}</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.settingsDetailItem}>
                            <div className={styles.settingsDetailIcon}>
                                <svg className={styles.settingsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                                </svg>
                            </div>
                            <div className={styles.settingsDetailContent}>
                                <p className={styles.settingsDetailLabel}>Login Code</p>
                                <p className={`${styles.settingsDetailText} ${styles.settingsMonoText}`}>{profileData.loginCode}</p>
                            </div>
                        </div>

                        <div className={styles.settingsDetailItem}>
                            <div className={styles.settingsDetailIcon}>
                                <svg className={styles.settingsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <div className={styles.settingsDetailContent}>
                                <p className={styles.settingsDetailLabel}>Wallet Address</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profileData.walletAddress}
                                        onChange={(e) => handleEditChange('walletAddress', e.target.value)}
                                        className={`${styles.settingsDetailInput} ${styles.settingsMonoText}`}
                                    />
                                ) : (
                                    <p className={`${styles.settingsDetailText} ${styles.settingsMonoText} ${styles.settingsBreakAll}`}>{profileData.walletAddress}</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.settingsActionButtons}>
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSaveProfile}
                                        className={styles.settingsSaveButton}
                                    >
                                        <svg className={styles.settingsButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className={styles.settingsCancelButton}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className={styles.settingsEditButton}
                                    >
                                        <svg className={styles.settingsButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                        </svg>
                                        Edit Personal
                                    </button>
                                    <button
                                        onClick={() => setPasswordModal({ ...passwordModal, show: true })}
                                        className={styles.settingsPasswordButton}
                                    >
                                        <svg className={styles.settingsButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                        Password
                                    </button>
                                    <button
                                        onClick={handleLogoutClick}
                                        className={styles.settingsLogoutButton}
                                    >
                                        <svg className={styles.settingsButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                        </svg>
                                        Log out
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'help-support' && (
                <div className={styles.settingsSupportCard}>
                    <div className={styles.settingsSupportContent}>
                        <div className={styles.umTableWrapper}>
                            <div className={styles.settingsSearchHeader}>
                                <div className={styles.searchWrapper}>
                                    <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search support tickets..."
                                        className={styles.searchInput}
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                </div>
                            </div>

                            <table className={styles.umTable}>
                                <thead className={styles.umThead}>
                                    <tr>
                                        <th className={styles.umTh}>S.No</th>
                                        <th className={styles.umTh}>Username (Referral Code)</th>
                                        <th className={styles.umTh}>Ticket ID</th>
                                        <th className={styles.umTh}>Subject</th>
                                        <th className={styles.umTh}>Priority</th>
                                        <th className={styles.umTh}>Status</th>
                                        <th className={styles.umTh}>Created At</th>
                                        <th className={styles.umTh}>Last Updated</th>
                                        <th className={styles.umTh}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getCurrentPageTickets().length > 0 ? (
                                        getCurrentPageTickets().map((ticket, index) => (
                                            <tr key={ticket.id} className={styles.umTr}>
                                                <td className={styles.umTdBold}>
                                                    {((currentPage - 1) * rowsPerPage) + index + 1}
                                                </td>
                                                <td className={styles.umTd}>{ticket.username}</td>
                                                <td className={styles.umTd}>
                                                    <span className={styles.settingsTicketId}>
                                                        {ticket.ticketId}
                                                    </span>
                                                </td>
                                                <td className={styles.umTd}>
                                                    <div className={styles.settingsTicketSubject} title={ticket.subject}>
                                                        {ticket.subject}
                                                    </div>
                                                </td>
                                                <td className={styles.umTd}>
                                                    <span className={`${styles.settingsBadgeBase} ${getPriorityBadge(ticket.priority)}`}>
                                                        {ticket.priority.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className={styles.umTd}>
                                                    <span className={`${styles.settingsBadgeBase} ${getStatusBadge(ticket.status)}`}>
                                                        {ticket.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className={styles.umTd}>
                                                    {new Date(ticket.created_at).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className={styles.umTd}>
                                                    {new Date(ticket.lastUpdated).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className={styles.settingsActionCell}>
                                                    <button
                                                        className={styles.settingsActionButton}
                                                        onClick={() => setOpenActionId(openActionId === ticket.id ? null : ticket.id)}
                                                    >
                                                        <svg className={styles.settingsActionIcon} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                                                        </svg>
                                                    </button>
                                                    {openActionId === ticket.id && (
                                                        <div className={styles.settingsDropdownMenu}>
                                                            <div
                                                                className={styles.settingsDropdownItem}
                                                                onClick={() => handleViewTicket(ticket)}
                                                            >
                                                                View
                                                            </div>
                                                            <div
                                                                className={styles.settingsDropdownItem}
                                                                onClick={() => handleEditTicket(ticket)}
                                                            >
                                                                Edit
                                                            </div>
                                                            <div
                                                                className={styles.settingsDropdownItemDelete}
                                                                onClick={() => handleDeleteClick(ticket.id)}
                                                            >
                                                                Delete
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className={styles.settingsNoData}>
                                                <div className={styles.settingsNoDataContent}>
                                                    <svg className={styles.settingsNoDataIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                                    </svg>
                                                    <p className={styles.settingsNoDataTitle}>No tickets found</p>
                                                    <p className={styles.settingsNoDataSubtitle}>Try adjusting your search</p>
                                                </div>
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
                                    <span className={styles.settingsTotalCount}>
                                        Total: {filteredTickets.length} tickets
                                    </span>
                                </div>

                                <div className={styles.paginationControls}>
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className={styles.paginationButton}
                                        style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                                    >
                                        <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                        </svg>
                                        Previous
                                    </button>

                                    <div className={styles.settingsPageInfo}>
                                        <span className={styles.settingsPageText}>
                                            Page {currentPage} of {Math.ceil(filteredTickets.length / rowsPerPage) || 1}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === Math.ceil(filteredTickets.length / rowsPerPage) || filteredTickets.length === 0}
                                        className={styles.paginationButton}
                                        style={{ opacity: (currentPage === Math.ceil(filteredTickets.length / rowsPerPage) || filteredTickets.length === 0) ? 0.5 : 1 }}
                                    >
                                        Next
                                        <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {ticketModal.show && (
                <div className={styles.settingsModalOverlay}>
                    <div className={styles.settingsModal}>
                        <div className={styles.settingsModalHeader}>
                            <h3 className={styles.settingsModalTitle}>
                                {ticketModal.mode === 'view' ? 'View Ticket' : 'Edit Ticket'}
                            </h3>
                            <button
                                onClick={() => setTicketModal({ show: false, mode: 'view', data: null })}
                                className={styles.settingsModalClose}
                            >
                                <svg className={styles.settingsModalCloseIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        {ticketModal.mode === 'view' ? (
                            <div className={styles.settingsModalBody}>
                                <div className={styles.settingsModalGrid}>
                                    <div className={styles.settingsModalField}>
                                        <p className={styles.settingsModalLabel}>Ticket ID</p>
                                        <p className={`${styles.settingsModalValue} ${styles.settingsMonoText}`}>{ticketModal.data.ticketId}</p>
                                    </div>
                                    <div className={styles.settingsModalField}>
                                        <p className={styles.settingsModalLabel}>Username</p>
                                        <p className={styles.settingsModalValue}>{ticketModal.data.username}</p>
                                    </div>
                                    <div className={styles.settingsModalField}>
                                        <p className={styles.settingsModalLabel}>Status</p>
                                        <span className={`${styles.settingsBadgeBase} ${getStatusBadge(ticketModal.data.status)}`}>
                                            {ticketModal.data.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className={styles.settingsModalField}>
                                        <p className={styles.settingsModalLabel}>Priority</p>
                                        <span className={`${styles.settingsBadgeBase} ${getPriorityBadge(ticketModal.data.priority)}`}>
                                            {ticketModal.data.priority.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className={styles.settingsModalField}>
                                        <p className={styles.settingsModalLabel}>Created At</p>
                                        <p className={styles.settingsModalValue}>{new Date(ticketModal.data.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className={styles.settingsModalField}>
                                        <p className={styles.settingsModalLabel}>Last Updated</p>
                                        <p className={styles.settingsModalValue}>{new Date(ticketModal.data.lastUpdated).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className={styles.settingsModalFieldFull}>
                                    <p className={styles.settingsModalLabel}>Subject</p>
                                    <p className={styles.settingsModalSubject}>{ticketModal.data.subject}</p>
                                </div>

                                <div className={styles.settingsModalActions}>
                                    <button
                                        onClick={() => setTicketModal({ show: false, mode: 'view', data: null })}
                                        className={styles.settingsModalConfirm}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveTicket} className={styles.settingsModalForm}>
                                <div className={styles.settingsModalGrid}>
                                    <div className={styles.settingsModalField}>
                                        <label className={styles.settingsModalLabel}>Ticket ID</label>
                                        <input
                                            type="text"
                                            className={styles.settingsModalInput}
                                            value={ticketModal.data.ticketId}
                                            onChange={(e) => handleTicketChange('ticketId', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles.settingsModalField}>
                                        <label className={styles.settingsModalLabel}>Username</label>
                                        <input
                                            type="text"
                                            className={styles.settingsModalInput}
                                            value={ticketModal.data.username}
                                            onChange={(e) => handleTicketChange('username', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles.settingsModalField}>
                                        <label className={styles.settingsModalLabel}>Status</label>
                                        <select
                                            className={styles.settingsModalSelect}
                                            value={ticketModal.data.status}
                                            onChange={(e) => handleTicketChange('status', e.target.value)}
                                        >
                                            <option value="open">Open</option>
                                            <option value="pending">Pending</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                    <div className={styles.settingsModalField}>
                                        <label className={styles.settingsModalLabel}>Priority</label>
                                        <select
                                            className={styles.settingsModalSelect}
                                            value={ticketModal.data.priority}
                                            onChange={(e) => handleTicketChange('priority', e.target.value)}
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.settingsModalFieldFull}>
                                    <label className={styles.settingsModalLabel}>Subject</label>
                                    <textarea
                                        rows="4"
                                        className={styles.settingsModalTextarea}
                                        value={ticketModal.data.subject}
                                        onChange={(e) => handleTicketChange('subject', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.settingsModalFormActions}>
                                    <button
                                        type="button"
                                        onClick={() => setTicketModal({ show: false, mode: 'view', data: null })}
                                        className={styles.settingsModalCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.settingsModalConfirm}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {deleteModal.show && (
                <div className={styles.settingsModalOverlay}>
                    <div className={styles.settingsModalSmall}>
                        <div className={styles.settingsModalHeader}>
                            <h3 className={styles.settingsModalTitle}>Confirm Delete</h3>
                        </div>

                        <div className={styles.settingsModalBody}>
                            <div className={styles.settingsDeleteContent}>
                                <div className={styles.settingsDeleteIcon}>
                                    <svg className={styles.settingsDeleteIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </div>
                                <p className={styles.settingsDeleteText}>
                                    Are you sure you want to delete this ticket? This action cannot be undone.
                                </p>
                            </div>

                            <div className={styles.settingsModalActions}>
                                <button
                                    onClick={() => setDeleteModal({ show: false, id: null })}
                                    className={styles.settingsModalCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className={styles.settingsModalDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {passwordModal.show && (
                <div className={styles.settingsModalOverlay}>
                    <div className={styles.settingsModalSmall}>
                        <div className={styles.settingsModalHeader}>
                            <h3 className={styles.settingsModalTitle}>Change Password</h3>
                            <button
                                onClick={() => setPasswordModal({ show: false, oldPassword: '', newPassword: '', confirmPassword: '' })}
                                className={styles.settingsModalClose}
                            >
                                <svg className={styles.settingsModalCloseIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handlePasswordChange} className={styles.settingsModalForm}>
                            <div className={styles.settingsModalField}>
                                <label className={styles.settingsModalLabel}>Old Password</label>
                                <input
                                    type="password"
                                    className={styles.settingsModalInput}
                                    value={passwordModal.oldPassword}
                                    onChange={(e) => setPasswordModal({ ...passwordModal, oldPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.settingsModalField}>
                                <label className={styles.settingsModalLabel}>New Password</label>
                                <input
                                    type="password"
                                    className={styles.settingsModalInput}
                                    value={passwordModal.newPassword}
                                    onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.settingsModalField}>
                                <label className={styles.settingsModalLabel}>Confirm New Password</label>
                                <input
                                    type="password"
                                    className={styles.settingsModalInput}
                                    value={passwordModal.confirmPassword}
                                    onChange={(e) => setPasswordModal({ ...passwordModal, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.settingsModalFormActions}>
                                <button
                                    type="button"
                                    onClick={() => setPasswordModal({ show: false, oldPassword: '', newPassword: '', confirmPassword: '' })}
                                    className={styles.settingsModalCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.settingsModalConfirm}
                                >
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {logoutModal.show && (
                <div className={styles.settingsModalOverlay}>
                    <div className={styles.settingsModalSmall}>
                        <div className={styles.settingsModalHeader}>
                            <h3 className={styles.settingsModalTitle}>Confirm Logout</h3>
                        </div>

                        <div className={styles.settingsModalBody}>
                            <div className={styles.settingsLogoutContent}>
                                <div className={styles.settingsLogoutIcon}>
                                    <svg className={styles.settingsLogoutIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                    </svg>
                                </div>
                                <p className={styles.settingsLogoutText}>
                                    Are you sure you want to logout? You will need to login again to access your account.
                                </p>
                            </div>

                            <div className={styles.settingsModalActions}>
                                <button
                                    onClick={cancelLogout}
                                    className={styles.settingsModalCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className={styles.settingsModalLogout}
                                >
                                    <svg className={styles.settingsButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                    </svg>
                                    Yes, Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Settings;