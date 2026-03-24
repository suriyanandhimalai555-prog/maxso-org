import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from '../styles';

const Sidebar = ({ isOpen }) => {
    const location = useLocation();
    const user = useSelector((state) => state.auth.user);
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab');

    const [isUserManagementOpen, setIsUserManagementOpen] = useState(
        currentPath.includes('/admin/users')
    );

    const [isTransactionsOpen, setIsTransactionsOpen] = useState(
        currentPath.includes('/transactions')
    );
    const [isNetworkingOpen, setIsNetworkingOpen] = useState(
        currentPath.includes('/networking')
    );
    const [isSettingsOpen, setIsSettingsOpen] = useState(
        currentPath.includes('/settings')
    );
    return (
        <aside className={`${styles.sidebarContainer} ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300`}>
            <div className={styles.sidebarLogoWrapper}>
                <div className={styles.sidebarLogo}>
                    m
                </div>
                <span className="text-xl font-bold text-white ml-2">Maxso</span>
            </div>

            <nav className={styles.sidebarNav}>
                <Link
                    to="/"
                    className={currentPath === '/' ? styles.sidebarLinkActive : styles.sidebarLink}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                    </svg>
                    Dashboard
                </Link>

                {user?.role === 'admin' && (
                    <div className="mt-2">
                        <div
                            className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-900/40 cursor-pointer text-red-100"
                            onClick={() => setIsUserManagementOpen(!isUserManagementOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                                User Management
                            </div>
                            <svg
                                className={`w-4 h-4 transform transition-transform ${isUserManagementOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>

                        {isUserManagementOpen && (
                            <div className={styles.sidebarSubmenu}>
                                <Link
                                    to="/admin/users?tab=users"
                                    className={
                                        currentPath === '/admin/users' && currentTab === 'users'
                                            ? styles.sidebarSubLinkActive
                                            : styles.sidebarSubLink
                                    }
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    Users
                                </Link>
                                <Link
                                    to="/admin/users?tab=referrals"
                                    className={
                                        currentPath === '/admin/users' && currentTab === 'referrals'
                                            ? styles.sidebarSubLinkActive
                                            : styles.sidebarSubLink
                                    }
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                                    </svg>
                                    Referral
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                <Link to="/plans" className={currentPath === '/plans' ? styles.sidebarLinkActive : styles.sidebarLink}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    Plans
                </Link>

                {user?.role !== 'admin' && (
                    <Link to="/portfolio" className={currentPath === '/portfolio' ? styles.sidebarLinkActive : styles.sidebarLink}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        My Portfolio
                    </Link>
                )}


                {user?.role !== 'admin' && (
                    <div className="mt-2">
                        <div
                            className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-900/40 cursor-pointer text-red-100"
                            onClick={() => setIsNetworkingOpen(!isNetworkingOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                Networking
                            </div>
                            <svg
                                className={`w-4 h-4 transform transition-transform ${isNetworkingOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>

                        {isNetworkingOpen && (
                            <div className={styles.sidebarSubmenu}>
                                <Link
                                    to="/networking/my-network"
                                    className={
                                        currentPath === '/networking/my-network'
                                            ? styles.sidebarSubLinkActive
                                            : styles.sidebarSubLink
                                    }
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"></path>
                                    </svg>
                                    My Network
                                </Link>
                                <Link
                                    to="/networking/my-referrals"
                                    className={
                                        currentPath === '/networking/my-referrals'
                                            ? styles.sidebarSubLinkActive
                                            : styles.sidebarSubLink
                                    }
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                                    </svg>
                                    My Referrals
                                </Link>
                                <Link
                                    to="/networking/level-earnings"
                                    className={
                                        currentPath === '/networking/level-earnings'
                                            ? styles.sidebarSubLinkActive
                                            : styles.sidebarSubLink
                                    }
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                                    </svg>
                                    Level Earnings
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-2">
                    <div
                        className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-900/40 cursor-pointer text-red-100"
                        onClick={() => setIsTransactionsOpen(!isTransactionsOpen)}
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                            </svg>
                            Transactions
                        </div>
                        <svg
                            className={`w-4 h-4 transform transition-transform ${isTransactionsOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>

                    {isTransactionsOpen && (
                        <div className={styles.sidebarSubmenu}>
                            <Link
                                to="/transactions?tab=deposit"
                                className={
                                    currentPath === '/transactions' && currentTab === 'deposit'
                                        ? styles.sidebarSubLinkActive
                                        : styles.sidebarSubLink
                                }
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                                </svg>
                                Deposit
                            </Link>
                            <Link
                                to="/transactions?tab=withdraw"
                                className={
                                    currentPath === '/transactions' && currentTab === 'withdraw'
                                        ? styles.sidebarSubLinkActive
                                        : styles.sidebarSubLink
                                }
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                                </svg>
                                Withdraw
                            </Link>
                            <Link
                                to="/transactions?tab=transfer"
                                className={
                                    currentPath === '/transactions' && currentTab === 'transfer'
                                        ? styles.sidebarSubLinkActive
                                        : styles.sidebarSubLink
                                }
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                                </svg>
                                Transfer
                            </Link>
                        </div>
                    )}
                </div>

                {user?.role === 'admin' && (
                    <Link to="/level-config" className={currentPath === '/level-config' ? styles.sidebarLinkActive : styles.sidebarLink}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                        </svg>
                        Level Config
                    </Link>
                )}
                {/* Settings Menu Group */}
                <div className="mt-2">
                    <div
                        className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-900/40 cursor-pointer text-red-100"
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            Settings
                        </div>
                        <svg
                            className={`w-4 h-4 transform transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>

                    {isSettingsOpen && (
                        <div className={styles.sidebarSubmenu}>
                            <Link
                                to="/settings?tab=profile"
                                className={
                                    currentPath === '/settings' && currentTab === 'profile'
                                        ? styles.sidebarSubLinkActive
                                        : styles.sidebarSubLink
                                }
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                Profile
                            </Link>
                            <Link
                                to="/settings?tab=help-support"
                                className={
                                    currentPath === '/settings' && currentTab === 'help-support'
                                        ? styles.sidebarSubLinkActive
                                        : styles.sidebarSubLink
                                }
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                </svg>
                                Help & Support
                            </Link>
                        </div>
                    )}
                </div>


            </nav>
        </aside>
    );
};

export default Sidebar;