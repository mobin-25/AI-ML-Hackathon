import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const Compare: React.FC = () => {
  const comparisonRows = [
    {
      dimension: 'Stock Tracking',
      manual: 'Manual tally sheets, handwritten khata books, or basic Excel spreadsheets prone to typos.',
      smartStock: 'Barcode scanning with automatic SKU identification and digital on-hand counts.',
      status: 'Implemented in Prototype',
    },
    {
      dimension: 'Demand Forecasting',
      manual: 'Intuitive guesswork or static reorder rules that ignore seasonal and weekend surges.',
      smartStock: '7-Day predictive machine learning based on 30-day sales patterns and day-of-week trends.',
      status: 'Implemented in Prototype',
    },
    {
      dimension: 'Low-Stock Visibility',
      manual: 'Noticed only when customer asks and shelf is physically empty, creating 5–10 day stockout gaps.',
      smartStock: 'Dynamic Reorder Point (ROP) math factoring supplier lead time and daily burn rates.',
      status: 'Implemented in Prototype',
    },
    {
      dimension: 'Reorder Planning',
      manual: 'Ad-hoc frantic phone calls to distributors with arbitrary order quantities.',
      smartStock: 'Automated recommended reorder quantities and upcoming WhatsApp purchase orders.',
      status: 'Planned WhatsApp API',
    },
    {
      dimension: 'Reporting & Analytics',
      manual: 'Occasional end-of-month manual stock counts requiring store closure for days.',
      smartStock: 'Live web dashboard tracking total inventory value, days of supply, and tied-up capital.',
      status: 'Implemented in Prototype',
    },
    {
      dimension: 'Overstock & Dead Stock',
      manual: 'Excess stock remains unnoticed until damaged or expired, draining cash reserves.',
      smartStock: 'Automated flags for products with >35 days of supply to preserve store liquidity.',
      status: 'Implemented in Prototype',
    },
  ];

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-14">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF1EB] text-[#FF642B] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Workflow Transformation</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
          Manual Records vs <span className="gradient-heading">SmartStock AI</span>
        </h1>
        <p className="text-base sm:text-lg text-[#64748B]">
          A clear side-by-side view comparing traditional retail methods against our AI-assisted replenishment system.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#0F172A] w-1/4">
                  Workflow Dimension
                </th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#64748B] w-3/8">
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <X className="w-4 h-4" />
                    <span>Traditional / Manual Methods</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#FF642B] w-3/8 bg-[#FFF8F5]">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#FF642B]" />
                    <span>SmartStock AI Architecture</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs sm:text-sm">
              {comparisonRows.map((row) => (
                <tr key={row.dimension} className="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td className="py-5 px-6 font-bold text-[#0F172A] align-top">
                    {row.dimension}
                    <div className="mt-1.5">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        row.status.includes('Planned')
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-[#64748B] align-top leading-relaxed">
                    {row.manual}
                  </td>
                  <td className="py-5 px-6 text-[#0F172A] bg-[#FFFBF8] font-medium align-top leading-relaxed">
                    {row.smartStock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Honest Boundary Notice */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#475569]">
            <strong className="text-[#0F172A] font-semibold block mb-0.5">Objective Comparison Standard:</strong>
            This comparison details functional workflow improvements enabled by automated data feeds and statistical forecasting models. Actual business performance gains depend on retail store record quality.
          </div>
        </div>

        <Link
          to="/dashboard"
          className="shrink-0 px-6 py-2.5 rounded-xl bg-[#FF642B] hover:bg-[#E8531C] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
        >
          <span>See Live Metrics</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};
