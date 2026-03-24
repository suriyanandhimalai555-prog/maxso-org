import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../features/authSlice';
import API_URL from '../config/api';
import { getAuthHeaders } from '../services/api';
import styles from '../styles';

const Navbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [walletTotal, setWalletTotal] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWalletTotal = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/stats`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          const total = (data.wallet?.levelIncome || 0) + (data.wallet?.roiIncome || 0) + (data.wallet?.directIncome || 0);
          setWalletTotal(total);
        }
      } catch (err) {
        console.error("Failed to fetch wallet total", err);
      }
    };

    if (user) {
      fetchWalletTotal();
    }
  }, [user]);

  const handleClick = () => {
    dispatch(logoutUser());
    setDropdownOpen(false);
  }

  return (
    <header className={styles.navHeader}>
      <div className={styles.navContainer}>
        {/* Left Side */}
        <div className={styles.navLeft}>
          <div className={styles.navHamburger} onClick={toggleSidebar}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </div>

          <div className={styles.navHeaderTitleBox}>
            <h1 className={styles.navHeaderTitle}>{user?.name || 'Maxso'}</h1>
            <div className={styles.navHeaderSubtitle}>
              <span>{user?.referral_code || 'N/A'}</span>
              {user?.referral_code && (
                <div className="flex items-center gap-1">
                  <svg
                    className={`w-4 h-4 cursor-pointer transition-colors ${copied ? 'text-emerald-400' : 'hover:text-red-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    onClick={() => {
                      const link = `${window.location.origin}/signup?ref=${user.referral_code}`;
                      navigator.clipboard.writeText(link);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    title="Copy Referral Link"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  {copied && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">Copied!</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className={styles.navRight}>
          <div className={styles.walletBox}>
            <span className={styles.walletLabel}>Wallet Balance</span>
            <span className={styles.walletAmount}>${walletTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>

          <div className={styles.avatarBox}>
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=MaxsoAdmin&backgroundColor=b6e3f4"
              alt="User Avatar"
              className={styles.avatarImage}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            />

            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  My Account
                </div>
                <div className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Settings
                </div>
                <div className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Support
                </div>
                <div
                  className={`${styles.dropdownItem} text-red-600 border-t mt-1`}
                  onClick={handleClick}
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  )
}

export default Navbar