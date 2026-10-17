import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-[#1A0B2E] text-white overflow-hidden">
      
      {/* Orange Accent Transition Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="bg-[#FF642D] rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left z-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Automate Your Retail Inventory with AI Today
            </h3>
            <p className="text-white/90 text-sm sm:text-base max-w-xl">
              Join Indian retailers saving hours every week with instant barcode digitization and 7-day demand forecasting.
            </p>
          </div>

          <div className="flex items-center gap-4 z-10 shrink-0">
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-xl bg-white text-[#FF642D] hover:bg-[#F8FAFC] text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Subtle background circles */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none"></div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 pt-4 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Logo & Description */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center">
              {/* White-mode Logo */}
              <div className="flex items-center gap-2.5">
                <svg className="w-8 h-8 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 7L38 15V27L24 19V7Z" fill="#A78BFA" opacity="0.9" />
                  <path d="M10 15L24 7V19L10 27V15Z" fill="#8B5CF6" opacity="0.95" />
                  <path d="M10 19L24 27V41L10 33V19Z" fill="#60A5FA" />
                  <path d="M24 27L38 19V33L24 41V27Z" fill="#FF642D" />
                  <circle cx="10" cy="19" r="3" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="24" cy="7" r="3" fill="#A78BFA" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="38" cy="19" r="3" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="24" cy="27" r="3" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1" />
                  <path d="M14 31L23 21L28 25L37 13" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M31 13H37V19" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  SmartStock<span className="text-[#FF642D]">AI</span>
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              SmartStock.AI is an AI-powered inventory management software built specifically for Indian retailers. Automate stock tracking, demand forecasting, and reordering.
            </p>
          </div>

          {/* Navigation Columns */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/features" className="text-slate-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/compare" className="text-slate-400 hover:text-white transition-colors">Compare</Link></li>
              <li><Link to="/faq" className="text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Industries</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/industries" className="text-slate-400 hover:text-white transition-colors">Appliance Spares</Link></li>
              <li><Link to="/industries" className="text-slate-400 hover:text-white transition-colors">Mobile Spares</Link></li>
              <li><Link to="/industries" className="text-slate-400 hover:text-white transition-colors">Electrical Shops</Link></li>
              <li><Link to="/industries" className="text-slate-400 hover:text-white transition-colors">Hardware & Plumbing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About</Link></li>
              <li><Link to="/blog" className="text-slate-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">App Demo</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="flex items-center gap-1.5">
            <span>© 2026 SmartStock AI. Built with</span>
            <Heart className="w-3.5 h-3.5 text-[#FF642D] fill-[#FF642D]" />
            <span>for Indian retailers.</span>
          </p>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Member 2 (Ajinkya)</span>
          </div>
        </div>

      </div>

    </footer>
  );
};
