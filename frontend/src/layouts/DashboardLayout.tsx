import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  CircleAlert,
  TrendingUp,
  ChartColumn,
  Search,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from '../components/Logo';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Exactly 6 Sidebar Navigation Items in Order
  const sidebarItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products / Inventory', path: '/inventory', icon: Package },
    { name: 'Sales', path: '/pos', icon: CreditCard },
    { name: 'Low Stock Alerts', path: '/alerts', icon: CircleAlert },
    { name: 'AI Forecasts', path: '/forecasting', icon: TrendingUp },
    { name: 'Reports', path: '/reports', icon: ChartColumn },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#191919]">
      {/* ========================================================= */}
      {/* 1. Fixed White Top Navigation Bar (Height: ~72px)         */}
      {/* ========================================================= */}
      <header className="fixed top-0 left-0 right-0 h-[72px] bg-white border-b border-[#E5E7EB] z-40 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-[#4B5563] hover:bg-[#F3F4F6] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center focus:outline-none shrink-0">
            <div className="scale-[0.85] origin-left">
              <Logo />
            </div>
          </Link>
        </div>

        {/* Center: Wide Search Input */}
        <div className="flex-1 max-w-xl mx-4 sm:mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-[#F4F6F9] border border-[#E5E7EB] rounded-xl text-sm text-[#191919] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF642D]/20 focus:border-[#CBD5E1] transition-all"
            />
          </form>
        </div>

        {/* Right: Notifications & Avatar "2" */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            className="p-2 text-[#4B5563] hover:text-[#191919] hover:bg-[#F3F4F6] rounded-xl transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[1.8]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF642D]" />
          </button>

          {/* User circular avatar displaying "2" */}
          <div
            title="User Profile (Retailer Admin)"
            className="w-8 h-8 rounded-full bg-[#F3F4F6] border border-[#D1D5DB] flex items-center justify-center text-xs font-bold text-[#374151] select-none cursor-pointer hover:border-[#9CA3AF] transition-colors"
          >
            2
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. Fixed Left Sidebar (Simplified: Exactly 6 Items)       */}
      {/* ========================================================= */}
      <aside
        className={`fixed top-[72px] left-0 bottom-0 w-[276px] bg-white border-r border-[#E5E7EB] z-30 transition-transform duration-200 overflow-y-auto ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="p-3.5 space-y-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                  active
                    ? 'bg-[#F0F2F6] text-[#0F172A] font-semibold'
                    : 'text-[#1E293B] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 stroke-[1.8] ${
                    active ? 'text-[#FF642D]' : 'text-[#64748B]'
                  }`}
                />
                <span className="truncate tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-20 lg:hidden"
        />
      )}

      {/* ========================================================= */}
      {/* 3. Main Content Viewport                                   */}
      {/* ========================================================= */}
      <main className="lg:ml-[276px] pt-[72px] min-h-screen bg-[#F5F7FB]">
        <Outlet />
      </main>
    </div>
  );
};
