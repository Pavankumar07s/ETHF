
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  return (
    <header className="w-full bg-white/95 shadow-lg border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand Section */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 group cursor-pointer">
              {/* Logo Icon */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-md transform transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5">
                    <div className="w-6 h-6 border-2 border-white rounded-sm transform rotate-45"></div>
                  </div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 w-10 h-10 bg-black rounded-lg opacity-20 blur-sm transform scale-110"></div>
                </div>
                
                {/* Brand Name */}
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight transform transition-all duration-200 group-hover:text-black">
                    TradePro
                  </h1>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cross-Chain Trading
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation & Connect Section */}
          <div className="flex items-center space-x-6">
            {/* Enhanced Status Indicator */}
            <div className="hidden sm:flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-30"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Live</span>
                <span className="text-xs text-gray-600">Network Active</span>
              </div>
            </div>

            {/* Trading Stats Indicator */}
            <div className="hidden md:flex items-center space-x-3 px-4 py-2.5 bg-black text-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 animate-fade-in">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">24h Volume</span>
                  <span className="text-xs text-green-400 font-medium">$2.4M+</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Connect Button Container */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 rounded-xl blur opacity-0 group-hover:opacity-20 transition-all duration-300"></div>
              <div className="relative transform transition-all duration-300 hover:scale-105 hover:-translate-y-0.5">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-1 shadow-sm hover:border-black hover:shadow-lg transition-all duration-300">
                  <ConnectButton />
                </div>
              </div>
            </div>

            {/* Quick Actions Menu */}
            <div className="hidden lg:flex items-center">
              <button className="group relative p-3 bg-gray-50 hover:bg-black rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg border border-gray-200 hover:border-black">
                <svg className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                
                {/* Tooltip */}
                <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 whitespace-nowrap z-10">
                  Quick Menu
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 translate-y-1"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle gradient line at bottom */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
    </header>
  );
};

export default Header;


