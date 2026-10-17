import React from 'react';
import {
  Info,
  Cpu,
  Code2,
  Database,
  Layout,
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF1EB] text-[#FF642B] text-xs font-bold uppercase tracking-wider">
          <Info className="w-3.5 h-3.5" />
          <span>Our Vision & Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
          About <span className="gradient-heading">SmartStock AI</span>
        </h1>
        <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
          Bridging the technological divide between large e-commerce supply chains and India's vibrant retail shopkeepers through accessible AI forecasting.
        </p>
      </div>

      {/* The Core Retail Problem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF642B]">The Challenge</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
            Why Traditional Inventory Fails Small Retailers
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Most Indian retailers still track inventory on paper ledgers, basic point-of-sale registers, or mental estimates. This leaves owners blind to two costly risks:
          </p>
          <div className="space-y-3 pt-2">
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex items-start gap-3">
              <span className="text-xl">🚨</span>
              <div>
                <strong className="text-sm font-bold text-[#0F172A] block">Frequent Stockouts on Bestsellers</strong>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Suppliers take 5 to 10 days to deliver. By the time a shopkeeper notices shelves are empty, 7 to 10 days of prime customer sales are already forfeited to competitors.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex items-start gap-3">
              <span className="text-xl">📦</span>
              <div>
                <strong className="text-sm font-bold text-[#0F172A] block">Dead Stock Trapping Working Capital</strong>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Over-ordering slow-moving items ties up scarce working cash that could have purchased fast-turning seasonal inventory.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#FF642B]" />
            <span>The SmartStock AI Solution</span>
          </h3>
          <p className="text-sm text-[#64748B] leading-relaxed">
            SmartStock AI converts static inventory databases into dynamic, predictive decision engines. We combine:
          </p>
          <ul className="space-y-3 text-sm text-[#475569]">
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#FF642B] mt-1.5 shrink-0"></span>
              <span><strong>Barcode & SKU Resolution:</strong> Auto-populates item catalog details without tedious manual typing.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#FF642B] mt-1.5 shrink-0"></span>
              <span><strong>7-Day Demand Forecasting:</strong> Statistical and machine learning models analyze 30-day sales histories with weekend weighting.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#FF642B] mt-1.5 shrink-0"></span>
              <span><strong>Lead-Time Aware Safety Stock:</strong> Computes optimal Reorder Points (ROP) so stock arrives exactly when needed.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Engineering Architecture & Team Ownership */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 shadow-xs space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-2xl font-bold text-[#0F172A]">Modular Hackathon Architecture</h3>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Built with clear separation of concerns across frontend UX, machine learning forecasting, and data verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1EB] text-[#FF642B] flex items-center justify-center">
              <Layout className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-[#FF642B] uppercase tracking-wider">Frontend & UI (Member 2)</div>
            <h4 className="text-base font-bold text-[#0F172A]">React + Vite + TypeScript</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Ajinkya owns the responsive UI, website pages, interactive Recharts dashboard, resilient demo adapter, and API client.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1EB] text-[#FF642B] flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-[#FF642B] uppercase tracking-wider">ML & Backend (Member 1)</div>
            <h4 className="text-base font-bold text-[#0F172A]">FastAPI + ML Forecasting</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Mobin leads the Python backend, FastAPI routing, database layer, demand forecasting models, and inventory calculation scripts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1EB] text-[#FF642B] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-[#FF642B] uppercase tracking-wider">Data & Validation (Member 3)</div>
            <h4 className="text-base font-bold text-[#0F172A]">Dataset Prep & Testing</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Parth prepares real-world Indian retail CSV datasets, integration validation test suites, and model evaluation benchmarks.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
