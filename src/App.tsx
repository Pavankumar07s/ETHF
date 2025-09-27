import { useCallback, useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { connect } from "./lib/create-order-cross-chain";
import { checkOrderStatus } from "./lib/order-status";
import Header from "./components/Header";
import TokenSelector from "./components/TokenSelector";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import OrderHistory from "./components/OrderHistory";
import PaymentPage from "./components/PaymentPage";
import "@rainbow-me/rainbowkit/styles.css";
import LogoLoop from './components/LogoLoop';


interface User {
  id: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}
// Custom SVG token icons for Web3 trading
const EthIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#000000"/>
      <path d="M16 4L15.8 4.7V19.3L16 19.5L22.5 15.8L16 4Z" fill="#FFFFFF"/>
      <path d="M16 4L9.5 15.8L16 19.5V12.2V4Z" fill="#CCCCCC"/>
      <path d="M16 20.8L15.9 21V26.3L16 26.4L22.5 17.1L16 20.8Z" fill="#FFFFFF"/>
      <path d="M16 26.4V20.8L9.5 17.1L16 26.4Z" fill="#CCCCCC"/>
      <path d="M16 19.5L22.5 15.8L16 12.2V19.5Z" fill="#999999"/>
      <path d="M9.5 15.8L16 19.5V12.2L9.5 15.8Z" fill="#666666"/>
    </svg>
  </div>
);

const BtcIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#333333"/>
      <path d="M18.1 14.3C18.9 13.9 19.4 13.2 19.3 12.2C19.1 10.9 17.9 10.4 16.4 10.1V8.5H15V10C14.6 10 14.2 10 13.8 10V8.5H12.4V10.1C12.1 10.1 11.8 10.1 11.4 10.1H9.8V11.6C9.8 11.6 10.8 11.6 10.8 11.6C11.3 11.6 11.5 11.9 11.5 12.2V19.8C11.5 20 11.4 20.3 10.9 20.3C10.9 20.3 9.8 20.3 9.8 20.3L9.5 22H11C11.3 22 11.7 22 12 22V23.5H13.4V22.1C13.8 22.1 14.2 22.1 14.6 22.1V23.5H16V22.1C17.9 21.9 19.3 21.1 19.5 19.3C19.7 17.9 19 17.1 17.9 16.7C18.1 16.1 18.2 15.2 18.1 14.3ZM13.8 12.7C14.6 12.7 16.8 12.4 16.8 13.8C16.8 15.1 14.6 14.8 13.8 14.8V12.7ZM13.8 19.3V16.9C14.8 16.9 17.3 16.6 17.3 18.1C17.3 19.6 14.8 19.3 13.8 19.3Z" fill="#FFFFFF"/>
    </svg>
  </div>
);

const UsdcIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#666666"/>
      <path d="M16 6C10.5 6 6 10.5 6 16S10.5 26 16 26S26 21.5 26 16S21.5 6 16 6ZM16 23C12.1 23 9 19.9 9 16S12.1 9 16 9S23 12.1 23 16S19.9 23 16 23Z" fill="#FFFFFF"/>
      <path d="M16.5 11V13.5C18.2 13.7 19.5 14.3 19.5 16H17.5C17.5 15.4 17.1 15 16.5 15H15.5C14.9 15 14.5 15.4 14.5 16C14.5 16.6 14.9 17 15.5 17H16.5C18.4 17 20 18.6 20 20.5C20 22.4 18.4 24 16.5 24V21.5C14.8 21.3 13.5 20.7 13.5 19H15.5C15.5 19.6 15.9 20 16.5 20H17.5C18.1 20 18.5 19.6 18.5 19C18.5 18.4 18.1 18 17.5 18H16.5C14.6 18 13 16.4 13 14.5C13 12.6 14.6 11 16.5 11Z" fill="#FFFFFF"/>
    </svg>
  </div>
);

const UsdtIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#555555"/>
      <path d="M17.8 15.5V13.8H21.5V11.2H10.5V13.8H14.2V15.5C11.2 15.7 9 16.5 9 17.5C9 18.5 11.2 19.3 14.2 19.5V24H17.8V19.5C20.8 19.3 23 18.5 23 17.5C23 16.5 20.8 15.7 17.8 15.5ZM16 18.5C13 18.5 10.5 17.8 10.5 17C10.5 16.2 13 15.5 16 15.5C19 15.5 21.5 16.2 21.5 17C21.5 17.8 19 18.5 16 18.5Z" fill="#FFFFFF"/>
    </svg>
  </div>
);

const MaticIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#777777"/>
      <path d="M21.8 12.2C21.4 12 20.9 12 20.5 12.2L17.2 14L15.2 15.1L11.9 16.9C11.5 17.1 11 17.1 10.6 16.9L8.2 15.6C7.8 15.4 7.5 15 7.5 14.5V11.9C7.5 11.4 7.7 11 8.2 10.8L10.6 9.5C11 9.3 11.5 9.3 11.9 9.5L14.3 10.8C14.7 11 15 11.4 15 11.9V13.6L17 12.5V10.8C17 10.3 16.8 9.9 16.3 9.7L12 7.5C11.6 7.3 11.1 7.3 10.7 7.5L6.2 9.7C5.8 9.9 5.5 10.3 5.5 10.8V15.2C5.5 15.7 5.7 16.1 6.2 16.3L10.7 18.5C11.1 18.7 11.6 18.7 12 18.5L15.3 16.7L17.3 15.6L20.6 13.8C21 13.6 21.5 13.6 21.9 13.8L24.3 15.1C24.7 15.3 25 15.7 25 16.2V18.8C25 19.3 24.8 19.7 24.3 19.9L21.9 21.2C21.5 21.4 21 21.4 20.6 21.2L18.2 19.9C17.8 19.7 17.5 19.3 17.5 18.8V17.1L15.5 18.2V19.9C15.5 20.4 15.7 20.8 16.2 21L20.7 23.2C21.1 23.4 21.6 23.4 22 23.2L26.5 21C26.9 20.8 27.2 20.4 27.2 19.9V15.5C27.2 15 27 14.6 26.5 14.4L21.8 12.2Z" fill="#FFFFFF"/>
    </svg>
  </div>
);

const ArbIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#111111"/>
      <path d="M8.5 20.5L12 14L15.5 20.5H8.5Z" fill="#FFFFFF"/>
      <path d="M16.5 20.5L20 14L23.5 20.5H16.5Z" fill="#CCCCCC"/>
      <path d="M12.5 11.5L16 5L19.5 11.5H12.5Z" fill="#FFFFFF"/>
      <path d="M14 23H18L20.5 27H11.5L14 23Z" fill="#999999"/>
    </svg>
  </div>
);

const techLogos = [
  { node: <EthIcon />, title: "Ethereum", href: "https://ethereum.org" },
  { node: <BtcIcon />, title: "Bitcoin", href: "https://bitcoin.org" },
  { node: <UsdcIcon />, title: "USD Coin", href: "#" },
  { node: <UsdtIcon />, title: "Tether", href: "#" },
  { node: <MaticIcon />, title: "Polygon", href: "https://polygon.technology" },
  { node: <ArbIcon />, title: "Arbitrum", href: "https://arbitrum.io" },
];
function App() {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<'trading' | 'tokens' | 'orders' | 'auth'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastOrderHash] = useState<string>("0xf9bc0c08b4da0e658557d23c1921f93ac4f7207defdb63201440ad3fc8d6433d");
  const [orderStatus, setOrderStatus] = useState<string>("");

  // Check if we're on the public payment page
  const isPaymentPage = location.pathname.startsWith('/pay/');

  // Check if user is already authenticated
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data.user);
          if (!isPaymentPage) {
            setCurrentPage('trading');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isPaymentPage]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setCurrentPage('auth');
      setAuthMode('login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLoginSuccess = () => {
    checkAuth(); // Refresh user data
  };

  const handleRegisterSuccess = () => {
    setAuthMode('login');
    alert('Registration successful! Please check your email to verify your account.');
  };

  const handleConnect = useCallback(async () => {
    try {
      await connect();
      console.log("Connected to wallet!");
    } catch (e: unknown) {
      console.error("Connection failed:", e);
    }
  }, []);



  const handleCheckStatus = useCallback(async () => {
    if (!lastOrderHash) {
      alert("No order hash available. Create an order first.");
      return;
    }
    
    try {
      const status = await checkOrderStatus(lastOrderHash);
      setOrderStatus(`Status: ${status.status}`);
    } catch (e: unknown) {
      console.error("Failed to check status:", e);
      setOrderStatus("Failed to check status");
    }
  }, [lastOrderHash]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public payment route - no authentication required */}
      <Route path="/pay/:uuid" element={<PaymentPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/*" 
        element={
          user ? (
            <AuthenticatedApp 
              user={user}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              authMode={authMode}
              lastOrderHash={lastOrderHash}
              orderStatus={orderStatus}
              handleLogout={handleLogout}
              handleConnect={handleConnect}
              handleCheckStatus={handleCheckStatus}
            />
          ) : (
            <UnauthenticatedApp 
              authMode={authMode}
              setAuthMode={setAuthMode}
              handleLoginSuccess={handleLoginSuccess}
              handleRegisterSuccess={handleRegisterSuccess}
            />
          )
        } 
      />
    </Routes>
  );
}

// Component for authenticated users
interface AuthenticatedAppProps {
  user: User;
  currentPage: 'trading' | 'tokens' | 'orders' | 'auth';
  setCurrentPage: (page: 'trading' | 'tokens' | 'orders' | 'auth') => void;
  authMode: 'login' | 'register';
  lastOrderHash: string;
  orderStatus: string;
  handleLogout: () => void;
  handleConnect: () => void;
  handleCheckStatus: () => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({
  user,
  currentPage,
  setCurrentPage,
  lastOrderHash,
  orderStatus,
  handleLogout,
  handleConnect,
  handleCheckStatus,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* User info and logout */}
      <div className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-fade-in">
            <div className="flex justify-between items-center">
              {/* User Welcome Card */}
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-100 shadow-sm flex-1 mr-6">
                <div className="flex items-center space-x-4">
                  {/* Avatar Circle */}
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-sm">
                    <div className="text-white font-semibold text-sm">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex flex-col space-y-1">
                    <div className="text-base font-semibold text-gray-900">
                      Welcome back
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {user.email}
                    </div>
                  </div>
                  
                  {/* Verification Status */}
                  {!user.isVerified ? (
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
                        Verification pending
                      </span>
                    </div>
                  ) : (
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 text-white shadow-sm">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8 py-4">
            <button
              onClick={() => setCurrentPage('trading')}
              className={`inline-flex items-center px-1 py-2 border-b-2 text-sm font-medium transition-all duration-200 ${
                currentPage === 'trading'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Trading Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('tokens')}
              className={`inline-flex items-center px-1 py-2 border-b-2 text-sm font-medium transition-all duration-200 ${
                currentPage === 'tokens'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Token Selector
            </button>
            <button
              onClick={() => setCurrentPage('orders')}
              className={`inline-flex items-center px-1 py-2 border-b-2 text-sm font-medium transition-all duration-200 ${
                currentPage === 'orders'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Order History
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentPage === 'trading' ? (
          <div className="space-y-8">
            {/* Trading Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Trading Controls</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5" 
                  onClick={handleConnect}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Connect Wallet
                </button>
                <button
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  onClick={handleCheckStatus}
                  disabled={!lastOrderHash}
                >
                  Check Order Status
                </button>
              </div>
            </div>
            
            {/* Order Information */}
            {lastOrderHash && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 ease-in-out">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Order</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Hash</label>
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                      <code className="text-xs font-mono text-gray-800 break-all">{lastOrderHash}</code>
                    </div>
                  </div>
                  {orderStatus && (
                    <div className="animate-fade-in">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                        {orderStatus}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : currentPage === 'tokens' ? (
          <div className="animate-fade-in">
            <TokenSelector />
          </div>
        ) : currentPage === 'orders' ? (
          <div className="animate-fade-in">
            <OrderHistory onBack={() => setCurrentPage('trading')} />
          </div>
        ) : null}
        <div style={{ height: '200px', position: 'relative',padding: '5rem',overflow: 'hidden'}}>
      <LogoLoop
        logos={techLogos}
        speed={60}
        direction="left"
        logoHeight={60}
        gap={50}
        pauseOnHover
        scaleOnHover
        fadeOut
        fadeOutColor="#ffffff"
        ariaLabel="Technology partners"
      />
    </div>
      </main>
    </div>
  );
};

// Component for unauthenticated users
interface UnauthenticatedAppProps {
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  handleLoginSuccess: () => void;
  handleRegisterSuccess: () => void;
}

const UnauthenticatedApp: React.FC<UnauthenticatedAppProps> = ({
  authMode,
  setAuthMode,
  handleLoginSuccess,
  handleRegisterSuccess,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200 animate-fade-in">
            {authMode === 'login' ? (
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setAuthMode('register')}
              />
            ) : (
              <RegisterForm
                onRegisterSuccess={handleRegisterSuccess}
                onSwitchToLogin={() => setAuthMode('login')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
