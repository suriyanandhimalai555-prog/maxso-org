import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { verifyUser } from './features/authSlice'


import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import UserManagement from './pages/UserManagement'
import Transactions from './pages/Transactions'
import styles from './styles'
import LevelConfig from './pages/LevelConfig'
import Settings from './pages/Settings'
import Plans from './pages/Plans'
import Portfolio from './pages/Portfolio'
import MyNetwork from './pages/MyNetwork'
import MyReferrals from './pages/MyReferrals'
import LevelEarnings from './pages/LevelEarnings'
function App() {
  const dispatch = useDispatch();
  const { user, isAuthReady } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dispatch(verifyUser());
  }, [dispatch]);

  if (!isAuthReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderRadius: '50%', borderTopColor: '#a78bfa', animation: 'spin 1s ease-in-out infinite' }}></div>
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user ? (
        <div className={styles.appWrapper}>

          {isSidebarOpen && (
            <div
              className={styles.sidebarOverlay}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          <Sidebar isOpen={isSidebarOpen} />

          <div className={styles.mainContent}>
            <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles.pageContainer}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin/users" element={user.role === 'admin' ? <UserManagement /> : <Navigate to="/" />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/networking/my-network" element={<MyNetwork />} />
                <Route path="/networking/my-referrals" element={<MyReferrals />} />
                <Route path="/networking/level-earnings" element={<LevelEarnings />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/level-config" element={<LevelConfig />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.authContainer}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;