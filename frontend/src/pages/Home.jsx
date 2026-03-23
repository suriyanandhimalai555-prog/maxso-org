
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { getAuthHeaders } from '../services/api';
import styles from '../styles';


const ChartUpIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.dashWalletIcon}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
  </svg>
);

const PiggyBankIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.dashWalletIcon}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const ReferralIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.dashWalletIcon}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
  </svg>
);

const Home = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [stats, setStats] = useState({
    users: { total: 0, active: 0, inactive: 0 },
    wallet: { levelIncome: 0, roiIncome: 0, directIncome: 0 },
    earnings: { roiIncome: 0, levelIncome: 0, referralIncome: 0 },
    todayEarnings: { dailyRoi: 0, levelIncome: 0 },
    referrals: { total: 0, level1: 0, earnings: 0 },
    deposits: { totalAmount: 0, count: 0 },
    withdraws: { totalAmount: 0, count: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/stats`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleUsersClick = () => {
    navigate('/admin/users?tab=users');
  };

  const handleReferralsClick = () => {
    navigate('/admin/users?tab=referrals');
  };

  const handleTransactionsClick = () => {
    navigate('/transactions');
  };

  const handlePlansClick = () => {
    navigate('/plans');
  };

  const { users, wallet, earnings, todayEarnings, referrals, deposits, withdraws } = stats;

  return (
    <div className="space-y-10 mb-10 w-full max-w-6xl">
      {user?.role === 'admin' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className={styles.dashSectionTitle}>Users Overview</h3>
            <button
              onClick={handleUsersClick}
              className="text-sm text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              View All Users
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          <div className={styles.dashUsersBlock}>
            <div
              className={`${styles.dashUserCard} cursor-pointer hover:bg-[#8b0000] transition-colors`}
              onClick={handleUsersClick}
            >
              <div className={styles.dashUserCardContent}>
                <span className={styles.dashUserLabel}>Total Users</span>
                <span className={styles.dashUserValue}>{isLoading ? '...' : users.total}</span>
              </div>
            </div>
            <div
              className={`${styles.dashUserCard} cursor-pointer hover:bg-[#8b0000] transition-colors`}
              onClick={handleUsersClick}
            >
              <div className={styles.dashUserCardContent}>
                <span className={styles.dashUserLabel}>Active Users</span>
                <span className={styles.dashUserValue}>{isLoading ? '...' : users.active}</span>
              </div>
            </div>
            <div
              className={`${styles.dashUserCard} cursor-pointer hover:bg-[#8b0000] transition-colors`}
              onClick={handleUsersClick}
            >
              <div className={styles.dashUserCardContent}>
                <span className={styles.dashUserLabel}>Inactive Users</span>
                <span className={styles.dashUserValue}>{isLoading ? '...' : users.inactive}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Earnings */}
      <div>
        <h3 className={styles.dashSectionTitle}>Today's Earnings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${styles.dashWalletCard} border-emerald-900/40`}>
            <div className={styles.dashWalletHeader}>
              <span className={styles.dashWalletLabel}>Today's Daily ROI</span>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`${styles.dashWalletIcon} text-emerald-400`}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span className={`${styles.dashWalletValue} text-emerald-400`}>
              ${isLoading ? '...' : todayEarnings.dailyRoi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>

          <div className={`${styles.dashWalletCard} border-amber-900/40`}>
            <div className={styles.dashWalletHeader}>
              <span className={styles.dashWalletLabel}>Today's Level Income</span>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`${styles.dashWalletIcon} text-amber-400`}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <span className={`${styles.dashWalletValue} text-amber-400`}>
              ${isLoading ? '...' : todayEarnings.levelIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Balance */}
      <div>
        <h3 className={styles.dashSectionTitle}>Wallet Balance</h3>
        <div className={styles.dashWalletContainer}>
          <div className={styles.dashWalletCard}>
            <div className={styles.dashWalletHeader}>
              <span className={styles.dashWalletLabel}>Level Income (All Time)</span>
              <ChartUpIcon />
            </div>
            <span className={styles.dashWalletValue}>${isLoading ? '...' : wallet.levelIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>

          <div className={styles.dashWalletCard}>
            <div className={styles.dashWalletHeader}>
              <span className={styles.dashWalletLabel}>ROI Income</span>
              <PiggyBankIcon />
            </div>
            <span className={styles.dashWalletValue}>${isLoading ? '...' : wallet.roiIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>

          <div className={styles.dashWalletCard}>
            <div className={styles.dashWalletHeader}>
              <span className={styles.dashWalletLabel}>Direct Referral Income</span>
              <ChartUpIcon />
            </div>
            <span className={styles.dashWalletValue}>${isLoading ? '...' : wallet.directIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div>
        <h3 className={styles.dashSectionTitle}>Earnings</h3>
        <div className={styles.dashWalletContainer}>
          <div className={styles.dashWalletCard}>
            <div className={styles.dashWalletHeader}>
              <span className={styles.dashWalletLabel}>ROI Income</span>
              <ChartUpIcon />
            </div>
            <span className={styles.dashWalletValue}>${isLoading ? '...' : earnings.roiIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>

          <div className={styles.dashWalletCard}>
            <div className={styles.dashWalletHeader}>
              <span className={styles.dashWalletLabel}>Level Income</span>
              <ChartUpIcon />
            </div>
            <span className={styles.dashWalletValue}>${isLoading ? '...' : earnings.levelIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>

          <div className={styles.dashWalletCard}>
            <div className={styles.dashWalletHeader}>
              <span className={styles.dashWalletLabel}>Referral Income</span>
              <ChartUpIcon />
            </div>
            <span className={styles.dashWalletValue}>${isLoading ? '...' : earnings.referralIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className={styles.dashSectionTitle}>Referrals Overview</h3>
            <button
              onClick={handleReferralsClick}
              className="text-sm text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              View All Referrals
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`${styles.dashWalletCard} cursor-pointer hover:bg-[#1a1a1a] transition-colors`}
              onClick={handleReferralsClick}
            >
              <div className={styles.dashWalletHeader}>
                <span className={styles.dashWalletLabel}>Total Referrals</span>
                <ReferralIcon />
              </div>
              <span className={styles.dashWalletValue}>{referrals.total}</span>
              <div className="mt-2 text-xs text-gray-400">Click to view details</div>
            </div>

            <div
              className={`${styles.dashWalletCard} cursor-pointer hover:bg-[#1a1a1a] transition-colors`}
              onClick={handleReferralsClick}
            >
              <div className={styles.dashWalletHeader}>
                <span className={styles.dashWalletLabel}>Level 1 Referrals</span>
                <ReferralIcon />
              </div>
              <span className={styles.dashWalletValue}>{referrals.level1}</span>
            </div>

            <div
              className={`${styles.dashWalletCard} cursor-pointer hover:bg-[#1a1a1a] transition-colors`}
              onClick={handleReferralsClick}
            >
              <div className={styles.dashWalletHeader}>
                <span className={styles.dashWalletLabel}>Referral Earnings</span>
                <ChartUpIcon />
              </div>
              <span className={styles.dashWalletValue}>${referrals.earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Deposit & Withdraw Overview */}
      <div className={styles.dashOverviewContainer}>
        <div>
          <h3 className={styles.dashSectionTitle}>Deposit Overview</h3>
          <div className={styles.dashListCard}>
            <div className={styles.dashListItem}>
              <div className={styles.dashListLeft}>
                <div className={styles.dashListIconBox}>
                  <svg className={styles.dashListIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                </div>
                <div className={styles.dashListText}>
                  <span className={styles.dashListLabel}>Deposit Amount</span>
                  <span className={styles.dashListValue}>${deposits.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                </div>
              </div>
            </div>
            <div className={styles.dashListItem}>
              <div className={styles.dashListLeft}>
                <div className={styles.dashListIconBox}>
                  <svg className={styles.dashListIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <div className={styles.dashListText}>
                  <span className={styles.dashListLabel}>Deposit Count</span>
                  <span className={styles.dashListValue}>{deposits.count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className={styles.dashSectionTitle}>Withdraw Overview</h3>
          <div className={styles.dashListCard}>
            <div className={styles.dashListItem}>
              <div className={styles.dashListLeft}>
                <div className={styles.dashListIconBox}>
                  <svg className={styles.dashListIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                </div>
                <div className={styles.dashListText}>
                  <span className={styles.dashListLabel}>Withdraw Amount</span>
                  <span className={styles.dashListValue}>${withdraws.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                </div>
              </div>
            </div>
            <div className={styles.dashListItem}>
              <div className={styles.dashListLeft}>
                <div className={styles.dashListIconBox}>
                  <svg className={styles.dashListIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                </div>
                <div className={styles.dashListText}>
                  <span className={styles.dashListLabel}>Withdraw Count</span>
                  <span className={styles.dashListValue}>{withdraws.count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div>
          <h3 className={styles.dashSectionTitle}>Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleUsersClick}
              className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg p-4 text-center transition-colors"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
              <span className="text-sm text-white">Manage Users</span>
            </button>

            <button
              onClick={handleReferralsClick}
              className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg p-4 text-center transition-colors"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              <span className="text-sm text-white">View Referrals</span>
            </button>

            <button
              onClick={() => navigate('/transactions?tab=withdraw')}
              className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg p-4 text-center transition-colors"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm text-white">Withdrawals</span>
            </button>

            <button
              onClick={handlePlansClick}
              className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg p-4 text-center transition-colors"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span className="text-sm text-white">Create Plan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;