import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';

export const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const tiers = [
    {
      name: 'Community Demo',
      badge: 'Free Forever',
      price: '₹0',
      period: 'prototype test',
      description: 'Ideal for testing SmartStock AI algorithms with pre-loaded demo inventory and sales logs.',
      features: [
        'Up to 25 SKU catalog testing',
        '7-Day statistical demand forecasting',
        'Basic stockout and overstock alerts',
        'CSV sample upload & validation',
        'Single store session sandbox',
      ],
      buttonText: 'Try Free Demo',
      buttonLink: '/dashboard',
      isPopular: false,
      buttonStyle: 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1]',
    },
    {
      name: 'Retail Starter',
      badge: 'Most Popular',
      price: billingCycle === 'monthly' ? '₹999' : '₹799',
      period: '/ month (billed yearly)',
      description: 'Designed for independent retail counters, mobile shops, and local Kirana businesses.',
      features: [
        'Up to 1,000 active SKUs',
        'Daily AI demand forecasting engine',
        'Real-time supplier lead-time buffers',
        'Barcode scanner mobile interface',
        'Automated reorder point calculation',
        'CSV/Excel import & export',
      ],
      buttonText: 'Start 14-Day Trial',
      buttonLink: '/signup',
      isPopular: true,
      buttonStyle: 'bg-[#FF642B] hover:bg-[#E8531C] text-white shadow-md',
    },
    {
      name: 'Pro Multi-Store',
      badge: 'Enterprise Retail',
      price: billingCycle === 'monthly' ? '₹2,499' : '₹1,999',
      period: '/ month (billed yearly)',
      description: 'Full-featured replenishment intelligence for high-volume retailers and wholesale stockists.',
      features: [
        'Unlimited products & SKU tracking',
        'Multi-model ensemble forecasting (Ridge + ETS)',
        'Multi-warehouse & supplier directory',
        'Upcoming WhatsApp direct PO ordering',
        'Priority API & custom ERP connector',
        'Dedicated onboarding & training',
      ],
      buttonText: 'Contact Enterprise',
      buttonLink: '/contact',
      isPopular: false,
      buttonStyle: 'bg-[#0F172A] hover:bg-[#1E293B] text-white',
    },
  ];

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF1EB] text-[#FF642B] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fair & Transparent Plans</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
          Simple Plans for <span className="gradient-heading">Growing Retailers</span>
        </h1>
        <p className="text-base sm:text-lg text-[#64748B]">
          Predict demand, eliminate dead stock, and automate stock replenishment at a fraction of the cost of enterprise ERPs.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-8 rounded-full bg-[#E2E8F0] p-1 transition-colors relative focus:outline-none"
            aria-label="Toggle billing frequency"
          >
            <div
              className={`w-6 h-6 rounded-full bg-[#FF642B] transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
          <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>
            <span>Annual Billing</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative bg-white rounded-3xl p-7 sm:p-8 border transition-all duration-200 flex flex-col justify-between ${
              tier.isPopular
                ? 'border-[#FF642B] shadow-xl ring-2 ring-[#FF642B]/10 lg:-translate-y-2'
                : 'border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1]'
            }`}
          >
            {tier.isPopular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FF642B] text-white text-xs font-bold tracking-wide shadow-sm uppercase">
                {tier.badge}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#0F172A]">{tier.name}</h3>
                {!tier.isPopular && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F4F6FA] text-[#64748B] border border-[#E2E8F0]">
                    {tier.badge}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#0F172A] tracking-tight">{tier.price}</span>
                  <span className="text-xs text-[#64748B] font-medium">{tier.period}</span>
                </div>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">{tier.description}</p>
              </div>

              <div className="pt-4 border-t border-[#F1F5F9] mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3">Included Capabilities</p>
                <ul className="space-y-2.5">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#475569]">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <Link
                to={tier.buttonLink}
                className={`w-full py-3.5 rounded-xl text-center text-sm font-bold transition-all flex items-center justify-center gap-2 ${tier.buttonStyle}`}
              >
                <span>{tier.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Honest Demo Notice */}
      <div className="max-w-2xl mx-auto p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 flex items-center gap-3 text-center sm:text-left">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mx-auto sm:mx-0" />
        <p>
          <strong>Hackathon Disclosure:</strong> Displayed pricing figures are indicative demonstration tiers and do not reflect finalized commercial terms. All visitors can test the complete platform for free right now via the App Demo.
        </p>
      </div>

    </div>
  );
};
