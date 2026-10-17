import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { GoogleIcon } from '../components/GoogleIcon';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Required field validation
    if (!businessName.trim()) {
      setError('Please enter your business or shop name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid business email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide your contact phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!city.trim()) {
      setError('Please enter your city.');
      return;
    }

    setLoading(true);
    setError(null);

    // Save demo user information & transition to dashboard
    setTimeout(() => {
      setLoading(false);
      try {
        localStorage.setItem(
          'smartstock_auth_user',
          JSON.stringify({
            businessName,
            email,
            phone,
            city,
            registeredAt: new Date().toISOString(),
          })
        );
      } catch {
        // Safe fallback
      }
      navigate('/dashboard');
    }, 600);
  };

  return (
    <AuthLayout
      activeTab="signup"
      title="Create Account"
      subtitle="Start your free trial today"
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Business Name */}
        <div>
          <label
            htmlFor="signup-business-name"
            className="block text-xs font-semibold text-[#1F2937] mb-1.5"
          >
            Business Name
          </label>
          <input
            id="signup-business-name"
            type="text"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Your Shop Name"
            required
            className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#191919] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF642D]/20 focus:border-[#FF642D] transition-all"
          />
        </div>

        {/* 2. Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold text-[#1F2937] mb-1.5"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#191919] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF642D]/20 focus:border-[#FF642D] transition-all"
          />
        </div>

        {/* 3. Phone */}
        <div>
          <label
            htmlFor="signup-phone"
            className="block text-xs font-semibold text-[#1F2937] mb-1.5"
          >
            Phone
          </label>
          <input
            id="signup-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(null);
            }}
            placeholder="+91 98765 43210"
            required
            className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#191919] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF642D]/20 focus:border-[#FF642D] transition-all"
          />
        </div>

        {/* 4. Password */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold text-[#1F2937] mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 pr-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#191919] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF642D]/20 focus:border-[#FF642D] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer focus:outline-none p-1"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* 5. City */}
        <div>
          <label
            htmlFor="signup-city"
            className="block text-xs font-semibold text-[#1F2937] mb-1.5"
          >
            City
          </label>
          <input
            id="signup-city"
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Mumbai"
            required
            className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#191919] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF642D]/20 focus:border-[#FF642D] transition-all"
          />
        </div>

        {/* Primary Create Account Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#FF642D] hover:bg-[#F0551E] active:bg-[#D94814] text-white text-sm sm:text-base font-semibold rounded-xl shadow-xs hover:shadow-md transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Creating Account...</span>
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E7EB]" />
        </div>
        <div className="relative bg-[#F5F7FA] px-3 text-[11px] font-semibold uppercase tracking-wider text-[#98A2B3]">
          OR CONTINUE WITH
        </div>
      </div>

      {/* Google Authentication Button */}
      <button
        type="button"
        onClick={() => setGoogleNotice(true)}
        className="w-full py-3 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 border border-[#D0D5DD] rounded-xl text-sm font-medium text-[#344054] shadow-xs flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer"
      >
        <GoogleIcon className="w-5 h-5 shrink-0" />
        <span>Continue with Google</span>
      </button>

      {/* Google OAuth Notice Modal */}
      {googleNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl relative border border-gray-100 text-center">
            <button
              type="button"
              onClick={() => setGoogleNotice(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <GoogleIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#191919] mb-1.5">
              Google Sign Up
            </h3>
            <p className="text-xs text-[#667085] mb-5 leading-relaxed">
              Google OAuth client ID is not configured in this local environment. Please complete sign-up using the registration form above.
            </p>
            <button
              type="button"
              onClick={() => setGoogleNotice(false)}
              className="w-full py-2.5 bg-[#FF642D] hover:bg-[#F0551E] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
