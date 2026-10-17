import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Box,
} from 'lucide-react';
import { getProducts, getReorderRecommendations } from '../api/client';
import type { Product, ReorderRecommendation } from '../types';

export const Alerts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [reorders, setReorders] = useState<ReorderRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'STOCKOUT' | 'OVERSTOCK'>('ALL');
  const [successAction, setSuccessAction] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, reorderRes] = await Promise.all([
        getProducts(),
        getReorderRecommendations(),
      ]);
      setProducts(prodRes.data);
      setReorders(reorderRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = (reorder: ReorderRecommendation) => {
    setSuccessAction(`Draft Purchase Order created for ${reorder.product_name} (${reorder.recommended_reorder_qty} units at $${reorder.unit_cost})! Ready to send to distributor.`);
    setTimeout(() => setSuccessAction(null), 5000);
  };

  const criticalStockouts = products.filter((p) => p.severity_rank === 1);
  const warningReorders = products.filter((p) => p.severity_rank === 2);
  const overstocked = products.filter((p) => p.severity_rank === 4);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Alerts & Replenishment Radar
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Supplier lead-time aware replenishment recommendations and excess capital alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] flex items-center gap-2 hover:border-[#FF642B] transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#FF642B] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {successAction && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successAction}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            filterType === 'ALL'
              ? 'bg-[#FF642B] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0]'
          }`}
        >
          All Active Alerts ({criticalStockouts.length + warningReorders.length + overstocked.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('STOCKOUT')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            filterType === 'STOCKOUT'
              ? 'bg-[#FF642B] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0]'
          }`}
        >
          Stockout Risks ({criticalStockouts.length + warningReorders.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('OVERSTOCK')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            filterType === 'OVERSTOCK'
              ? 'bg-[#FF642B] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0]'
          }`}
        >
          Overstocked Capital ({overstocked.length})
        </button>
      </div>

      {/* Critical Stockouts Section */}
      {(filterType === 'ALL' || filterType === 'STOCKOUT') && criticalStockouts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold uppercase tracking-wider">
              Critical Stockout Warnings (Order Immediately)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {criticalStockouts.map((prod) => {
              const rec = reorders.find((r) => r.product_id === prod.product_id);
              return (
                <div
                  key={prod.product_id}
                  className="bg-white border-2 border-rose-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md">
                        {prod.product_id}
                      </span>
                      <span className="text-xs font-bold text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-full">
                        {prod.stock_risk}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A]">{prod.product_name}</h3>

                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed bg-[#FFF8F8] p-3.5 rounded-xl border border-rose-100">
                      {prod.risk_reason}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] text-[#94A3B8] uppercase block">Current Stock</span>
                        <strong className="text-sm text-rose-600 font-bold">{prod.current_stock} pcs</strong>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] text-[#94A3B8] uppercase block">Lead Time</span>
                        <strong className="text-sm text-[#0F172A] font-bold">{prod.lead_time_days} days</strong>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] text-[#94A3B8] uppercase block">Supply Left</span>
                        <strong className="text-sm text-rose-600 font-bold">{prod.days_of_supply} days</strong>
                      </div>
                    </div>
                  </div>

                  {rec && (
                    <div className="pt-3 border-t border-rose-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#64748B] block">Recommended Reorder:</span>
                        <strong className="text-sm text-[#0F172A]">
                          {rec.recommended_reorder_qty} units (~${rec.total_order_cost.toFixed(2)})
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCreateOrder(rec)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        Draft Purchase Order
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overstocked Items Section */}
      {(filterType === 'ALL' || filterType === 'OVERSTOCK') && overstocked.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Box className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold uppercase tracking-wider">
              Overstocked Inventory (Trapped Working Capital)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {overstocked.map((prod) => (
              <div
                key={prod.product_id}
                className="bg-white border border-blue-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">
                      {prod.product_id}
                    </span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-full">
                      {prod.stock_risk}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0F172A]">{prod.product_name}</h3>

                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                    {prod.risk_reason}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#94A3B8] uppercase block">Current Stock</span>
                      <strong className="text-sm text-blue-700 font-bold">{prod.current_stock} pcs</strong>
                    </div>

                    <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#94A3B8] uppercase block">Days of Supply</span>
                      <strong className="text-sm text-blue-700 font-bold">{prod.days_of_supply} days</strong>
                    </div>

                    <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#94A3B8] uppercase block">Daily Rate</span>
                      <strong className="text-sm text-[#0F172A] font-bold">{prod.daily_demand_rate} /day</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-100 text-xs text-[#64748B]">
                  Recommendation: Pause future supplier purchase orders on this SKU until holding drops below 21 days.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
