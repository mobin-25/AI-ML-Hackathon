import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface AuthLayoutProps {
  activeTab: 'login' | 'signup';
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  activeTab,
  title,
  subtitle,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F5F7FA]">
      {/* Left panel — Branding */}
      <div
        className="w-full lg:w-1/2 min-h-[380px] lg:min-h-screen lg:h-screen lg:sticky lg:top-0 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden"
        style={{
          background: 'linear-gradient(110deg, #621193 0%, #7b1699 28%, #a71896 64%, #de2883 100%)',
        }}
      >
        {/* Top-left: SmartStock AI logo inside rounded white rectangle */}
        <div className="z-10">
          <div className="bg-white px-3.5 py-2 rounded-2xl shadow-sm border border-white/30 inline-flex items-center">
            <Logo />
          </div>
        </div>

        {/* Center: Branding Headline & Supporting Text */}
        <div className="my-10 lg:my-0 z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-white leading-[1.16] tracking-tight">
            Automate Your Inventory<br />with AI
          </h1>
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed font-normal max-w-md">
            Join thousands of Indian retailers managing their stock smarter with AI-powered tools.
          </p>
        </div>

        {/* Bottom-left: Copyright */}
        <div className="z-10">
          <p className="text-xs sm:text-sm text-white/70 font-normal">
            &copy; 2026 SmartStock.AI. All rights reserved.
          </p>
        </div>

        {/* Subtle decorative glow to enhance depth */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-pink-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-900/30 blur-3xl pointer-events-none" />
      </div>

      {/* Right panel — Authentication form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center py-10 sm:py-14 px-5 sm:px-10 lg:px-12 bg-[#F5F7FA] overflow-y-auto">
        <div className="w-full max-w-[460px] my-auto">
          {/* Top tab switcher */}
          <div className="bg-[#E9ECF2] p-1 rounded-2xl flex w-full max-w-[340px] mx-auto mb-8">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`flex-1 py-2 px-5 text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-[#191919] shadow-xs'
                  : 'text-[#667085] hover:text-[#191919] bg-transparent'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className={`flex-1 py-2 px-5 text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-[#191919] shadow-xs'
                  : 'text-[#667085] hover:text-[#191919] bg-transparent'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Heading */}
          <div className="text-center mb-7">
            <h2 className="text-3xl font-extrabold text-[#191919] tracking-tight mb-2">
              {title}
            </h2>
            <p className="text-sm text-[#667085]">
              {subtitle}
            </p>
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
};
