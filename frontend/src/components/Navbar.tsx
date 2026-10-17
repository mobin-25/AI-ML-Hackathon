import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Industries', path: '/industries' },
    { name: 'About', path: '/about' },
    { name: 'Compare', path: '/compare' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[74px]">
          
          {/* Logo on Left */}
          <Link to="/" className="flex items-center group focus:outline-none">
            <Logo />
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[14.5px] font-medium transition-colors ${
                    active
                      ? 'text-[#191919] font-semibold'
                      : 'text-[#4A5568] hover:text-[#191919]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              to="/login"
              className="text-[14.5px] font-medium text-[#191919] hover:text-[#FF642D] transition-colors"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-xl bg-[#FF642D] hover:bg-[#E8531C] text-white text-[14.5px] font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#4A5568] hover:text-[#191919] hover:bg-[#F5F7FA] border border-[#E5E7EB] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E5E7EB] shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 pt-3 pb-6 space-y-1 max-h-[85vh] overflow-y-auto">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors ${
                    active
                      ? 'bg-[#FFF1EB] text-[#FF642D] font-semibold'
                      : 'text-[#334155] hover:bg-[#F5F7FA]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-4 mt-3 border-t border-[#E5E7EB] grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center font-semibold text-[#191919] bg-white border border-[#E5E7EB] rounded-xl text-sm hover:bg-[#F8FAFC]"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center font-bold text-white bg-[#FF642D] rounded-xl text-sm hover:bg-[#E8531C]"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
