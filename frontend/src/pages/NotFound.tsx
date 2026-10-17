import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="py-20 px-4 text-center max-w-lg mx-auto space-y-6">
      <div className="text-6xl font-extrabold text-[#FF642B]">404</div>
      <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
        Page Not Found
      </h1>
      <p className="text-sm text-[#64748B]">
        The route you are looking for does not exist or has been moved. Explore our website or try the live inventory demo.
      </p>
      <div className="pt-2 flex items-center justify-center gap-4">
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-[#FF642B] hover:bg-[#E8531C] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/dashboard"
          className="px-6 py-3 rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] text-xs sm:text-sm font-bold shadow-xs hover:border-[#FF642B] transition-colors"
        >
          Launch Demo
        </Link>
      </div>
    </div>
  );
};
