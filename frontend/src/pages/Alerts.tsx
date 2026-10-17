import React, { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Package,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getProducts, get7DayForecast } from '../api/client';
import type { Product, ForecastDemand } from '../types';

export const Alerts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [forecasts, setForecasts] = useState<ForecastDemand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, forecastRes] = await Promise.all([
        getProducts(),
        get7DayForecast(),
      ]);
      setProducts(prodRes.data || []);
      setForecasts(forecastRes.data || []);
      setLastRefreshed(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err) {
      console.error('Failed to load inventory alerts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute status and restocking needs for every product
  const productsWithStatus = useMemo(() => {
    if (!products.length) return [];

    return products.map((prod) => {
      // 7-day predicted demand
      const pForecast = forecasts.filter((f) => f.product_id === prod.product_id);
      const expectedDemand =
        pForecast.length > 0
          ? pForecast.reduce((sum, f) => sum + f.predicted_demand, 0)
          : prod.forecast_7d_demand || Math.round((prod.base_daily_sales || 5) * 7);

      const dailyRate = expectedDemand / 7.0;
      const safetyStock = prod.safety_stock || Math.round(dailyRate * 2.0);
      const leadTimeDemand = prod.lead_time_demand || Math.round(dailyRate * (prod.lead_time_days || 3));
      const reorderPoint = prod.reorder_point || Math.round(leadTimeDemand + safetyStock);

      // Units to reorder
      const targetStock = Math.round(leadTimeDemand + safetyStock);
      const unitsToReorder =
        prod.recommended_reorder_qty !== undefined && prod.recommended_reorder_qty > 0
          ? prod.recommended_reorder_qty
          : Math.max(0, targetStock - prod.current_stock);

      // Status: Urgent | Reorder Soon | Stock OK
      let status: 'Urgent' | 'Reorder Soon' | 'Stock OK' = 'Stock OK';
      let isCritical = false;

      if (prod.current_stock === 0 || prod.current_stock <= leadTimeDemand) {
        status = 'Urgent';
        isCritical = true;
      } else if (prod.current_stock <= reorderPoint || unitsToReorder > 0) {
        status = 'Reorder Soon';
      }

      return {
        id: prod.product_id,
        fullName: prod.product_name,
        name: prod.product_name.length > 32 ? prod.product_name.slice(0, 30) + '…' : prod.product_name,
        category: prod.category || 'General',
        currentStock: prod.current_stock,
        expectedDemand,
        unitsToReorder,
        status,
        isCritical,
        reorderPoint,
      };
    });
  }, [products, forecasts]);

  // Top 3 Summary Card Counts
  const summaryCards = useMemo(() => {
    const outOfStockCount = productsWithStatus.filter((p) => p.currentStock === 0).length;
    const lowStockCount = productsWithStatus.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.reorderPoint
    ).length;
    const needToReorderCount = productsWithStatus.filter(
      (p) => p.expectedDemand > p.currentStock || p.unitsToReorder > 0
    ).length;

    return {
      outOfStockCount,
      lowStockCount,
      needToReorderCount,
    };
  }, [productsWithStatus]);

  // Top 5 Products Requiring the Most Restocking for Horizontal Bar Chart
  const topRestockProducts = useMemo(() => {
    return productsWithStatus
      .filter((p) => p.unitsToReorder > 0)
      .sort((a, b) => b.unitsToReorder - a.unitsToReorder)
      .slice(0, 5);
  }, [productsWithStatus]);

  // Table products: sorted by urgency (Urgent -> Reorder Soon -> Stock OK), then unitsToReorder desc
  const sortedTableProducts = useMemo(() => {
    const rank = { Urgent: 1, 'Reorder Soon': 2, 'Stock OK': 3 };
    return [...productsWithStatus].sort((a, b) => {
      const diff = rank[a.status] - rank[b.status];
      if (diff !== 0) return diff;
      return b.unitsToReorder - a.unitsToReorder;
    });
  }, [productsWithStatus]);

  return (
    <div className="space-y-6 pb-14 max-w-7xl mx-auto">
      {/* ----------------------------------------------------------- */}
      {/* Page Header                                                 */}
      {/* ----------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Low Stock Alerts
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Real-time inventory alerts, shortage risk detection, and restocking requirements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#111827] flex items-center gap-2 hover:border-[#F97316] transition-colors shadow-2xs cursor-pointer"
            title="Recalculate alerts from dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F97316] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {lastRefreshed && (
            <span className="hidden sm:inline-block text-[11px] text-[#9CA3AF]">
              Updated: {lastRefreshed}
            </span>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 1. Three Summary Cards                                      */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Out of Stock */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Out of Stock</span>
            <span className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1 block">
              {summaryCards.outOfStockCount}
            </span>
            <span className="text-[11px] text-[#9CA3AF] mt-0.5 block">Zero stock remaining</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 2: Low Stock */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Low Stock</span>
            <span className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1 block">
              {summaryCards.lowStockCount}
            </span>
            <span className="text-[11px] text-[#9CA3AF] mt-0.5 block">Below reorder threshold</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 3: Need to Reorder */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Need to Reorder</span>
            <span className="text-2xl sm:text-3xl font-bold text-[#F97316] mt-1 block">
              {summaryCards.needToReorderCount}
            </span>
            <span className="text-[11px] text-[#9CA3AF] mt-0.5 block">Demand exceeds stock</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 2. Simple Horizontal Bar Graph                              */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#111827]">
            Which Products Need Restocking?
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Top 5 products requiring replenishment based on projected 7-day demand and available stock.
          </p>
        </div>

        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-5 h-5 text-[#F97316] animate-spin mb-2" />
            <p className="text-xs text-[#64748B]">Calculating restocking needs...</p>
          </div>
        ) : topRestockProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9CA3AF] bg-[#F9FAFB] rounded-2xl border border-dashed border-[#E5E7EB]">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-[#111827]">All Products Have Sufficient Stock</p>
            <p className="mt-1">No products currently require immediate reordering.</p>
          </div>
        ) : (
          <div className="pt-2">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topRestockProducts}
                  margin={{ top: 10, right: 65, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={235}
                    tick={{ fontSize: 12, fill: '#111827', fontWeight: 500 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <p className="font-bold text-slate-100">{item.fullName}</p>
                            <p className="text-orange-300">
                              Additional Units Needed: <strong>{item.unitsToReorder} units</strong>
                            </p>
                            <p className="text-slate-300">
                              Current Stock: <strong>{item.currentStock} units</strong>
                            </p>
                            <p className="text-slate-300">
                              Expected 7d Demand: <strong>{item.expectedDemand} units</strong>
                            </p>
                            <p className={item.isCritical ? 'text-rose-400 font-semibold' : 'text-amber-400 font-semibold'}>
                              Status: {item.status}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="unitsToReorder"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                    label={{
                      position: 'right',
                      fill: '#334155',
                      fontSize: 12,
                      fontWeight: 700,
                      formatter: (val: any) => `${val} units`,
                    }}
                  >
                    {topRestockProducts.map((entry, index) => (
                      <Cell
                        key={`restock-bar-${index}`}
                        fill={entry.isCritical ? '#EF4444' : '#F97316'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Simple Legend and Explanation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#F1F5F9] text-xs">
              <div className="flex items-center gap-4 text-xs font-medium text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#EF4444] inline-block" />
                  <span>Critically Low Stock (Urgent)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#F97316] inline-block" />
                  <span>Needs Restocking</span>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B]">
                Bars show how many additional units may be needed based on forecast demand and current stock.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3. Simple Table: Products to Check                          */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#111827]">
            Products to Check
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Full catalog inventory check with stock levels, 7-day expected demand, and status.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#9CA3AF]">
            Loading product data...
          </div>
        ) : sortedTableProducts.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#9CA3AF] bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB]">
            No products available in the inventory catalog.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] text-[#475569] font-bold border-b border-[#E5E7EB] text-xs">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Expected Demand (next 7 days)</th>
                  <th className="py-3 px-4 text-center">Units to Reorder</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#111827]">
                {sortedTableProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9FAFB]/80 transition-colors">
                    {/* Product Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                          {p.id}
                        </span>
                        <div>
                          <div className="font-semibold text-[#111827]">{p.fullName}</div>
                          <div className="text-[11px] text-[#64748B]">{p.category}</div>
                        </div>
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={p.isCritical ? 'text-rose-600' : 'text-[#111827]'}>
                        {p.currentStock}
                      </span>
                    </td>

                    {/* Expected Demand */}
                    <td className="py-3 px-4 text-center font-medium text-[#475569]">
                      {p.expectedDemand} units
                    </td>

                    {/* Units to Reorder */}
                    <td className="py-3 px-4 text-center font-bold">
                      {p.unitsToReorder > 0 ? (
                        <span className="text-[#F97316]">+{p.unitsToReorder} units</span>
                      ) : (
                        <span className="text-[#9CA3AF] font-normal">0</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-right">
                      {p.status === 'Urgent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                          Urgent
                        </span>
                      )}
                      {p.status === 'Reorder Soon' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Reorder Soon
                        </span>
                      )}
                      {p.status === 'Stock OK' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Stock OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
