import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { GoogleIcon } from '../components/GoogleIcon';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Google SSO status modal
  const [googleNotice, setGoogleNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email and password.');
      return;
    }

    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    // Existing prototype authentication transition to /dashboard
    setTimeout(() => {
      setLoading(false);
      try {
        localStorage.setItem(
          'smartstock_auth_user',
          JSON.stringify({
            email,
            storeName: email.split('@')[0] || 'Demo Store',
            loggedInAt: new Date().toISOString(),
          })
        );
      } catch {
        // Safe fallback if storage is restricted
      }
      navigate('/dashboard');
    }, 600);
  };

  const handleForgotPassword = () => {
    setForgotEmail(email);
    setForgotSubmitted(false);
    setIsForgotOpen(true);
  };

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSubmitted(true);
  };

  return (
    <AuthLayout
      activeTab="login"
      title="Welcome Back"
      subtitle="Enter your credentials to access your account"
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-[#1F2937] mb-1.5"
          >
            Email
          </label>
          <input
            id="login-email"
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

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold text-[#1F2937]"
            >
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-medium text-[#FF642D] hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
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

        {/* Primary Login Button */}
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
                <span>Logging in...</span>
              </span>
            ) : (
              'Login'
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

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-xl relative border border-gray-100">
            <button
              type="button"
              onClick={() => setIsForgotOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-[#191919] mb-1.5">
              Reset Your Password
            </h3>
            <p className="text-xs sm:text-sm text-[#667085] mb-5">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>

            {forgotSubmitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Password reset link sent to:
                </p>
                <p className="text-xs font-semibold text-[#FF642D] break-all bg-orange-50 p-2 rounded-lg">
                  {forgotEmail}
                </p>
                <p className="text-xs text-gray-500">
                  Please check your inbox or spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="mt-4 w-full py-2.5 px-4 bg-[#FF642D] hover:bg-[#F0551E] text-white text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#191919] focus:bg-white focus:outline-none focus:border-[#FF642D]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#FF642D] hover:bg-[#F0551E] text-white text-sm font-semibold rounded-xl cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
              Google Authentication
            </h3>
            <p className="text-xs text-[#667085] mb-5 leading-relaxed">
              Google OAuth client ID is not configured in this local environment. Please log in using your standard email and password.
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
