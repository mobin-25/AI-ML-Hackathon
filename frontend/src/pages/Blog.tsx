import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Calendar, ArrowRight, Sparkles } from 'lucide-react';

export const Blog: React.FC = () => {
  const articles = [
    {
      id: '1',
      title: 'How 7-Day Demand Forecasting Prevents Weekend Retail Stockouts',
      excerpt: 'Retail demand in Indian tier-1 and tier-2 markets spikes up to 40% between Friday evening and Sunday. Learn why 7-day weighted moving averages protect store revenue.',
      category: 'Forecasting Science',
      date: 'Oct 14, 2026',
      readTime: '4 min read',
    },
    {
      id: '2',
      title: 'Calculating Safety Stock When Supplier Lead Times Are Unpredictable',
      excerpt: 'A practical guide for shopkeepers on balancing lead-time variance against capital constraints without locking cash in slow-moving warehouse inventory.',
      category: 'Inventory Operations',
      date: 'Oct 10, 2026',
      readTime: '5 min read',
    },
    {
      id: '3',
      title: 'Why Barcode Digitization is the Prerequisite for Retail AI',
      excerpt: 'Machine learning demand models are only as good as historical sales data. How instant SKU scanning replaces manual paper registers in small Indian shops.',
      category: 'Store Digitization',
      date: 'Oct 05, 2026',
      readTime: '3 min read',
    },
    {
      id: '4',
      title: 'The Hidden Cost of Overstock: How Dead Stock Drains Retail Margin',
      excerpt: 'Holding inventory for more than 35 days silently erodes gross profits through damage, obsolescence, and lost working capital interest.',
      category: 'Financial Health',
      date: 'Sep 28, 2026',
      readTime: '4 min read',
    },
  ];

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF1EB] text-[#FF642B] text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Retail Knowledge Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
          SmartStock <span className="gradient-heading">Insights</span>
        </h1>
        <p className="text-base sm:text-lg text-[#64748B]">
          Guides, operational best practices, and data strategies for modern Indian retailers and inventory managers.
        </p>
      </div>

      {/* Demo Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {articles.map((art) => (
          <article
            key={art.id}
            className="bg-white border border-[#E2E8F0] hover:border-[#FF642B]/50 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF1EB] text-[#FF642B] border border-[#FFE2D5]">
                  {art.category}
                </span>
                <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {art.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {art.readTime}
                  </span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-3 hover:text-[#FF642B] transition-colors">
                {art.title}
              </h2>

              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                {art.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
              <span className="text-xs text-[#94A3B8] font-medium">Demonstration Article</span>
              <button
                type="button"
                onClick={() => alert(`Opening sample educational article: "${art.title}"`)}
                className="text-xs sm:text-sm font-bold text-[#FF642B] hover:text-[#E8531C] inline-flex items-center gap-1.5 focus:outline-none"
              >
                <span>Read Full Article</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Newsletter / Demonstration Footer Note */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 text-center max-w-2xl mx-auto space-y-3">
        <Sparkles className="w-6 h-6 text-[#FF642B] mx-auto" />
        <h3 className="text-xl font-bold text-[#0F172A]">Looking to test these formulas in your store?</h3>
        <p className="text-xs sm:text-sm text-[#64748B]">
          You can test the actual Reorder Point, safety stock formulas, and 7-day demand predictions directly on your products.
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF642B] hover:bg-[#E8531C] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <span>Open Interactive Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
};
