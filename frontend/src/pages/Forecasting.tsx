import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getProducts, getSalesHistory, get7DayForecast, getModelEvaluations } from '../api/client';
import type { Product, SalesRecord, ForecastDemand, ModelEvaluation } from '../types';

export const Forecasting: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [forecast, setForecast] = useState<ForecastDemand[]>([]);
  const [evaluations, setEvaluations] = useState<ModelEvaluation[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('SKU-101');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, salesRes, forecastRes, evalRes] = await Promise.all([
        getProducts(),
        getSalesHistory(),
        get7DayForecast(),
        getModelEvaluations(),
      ]);
      setProducts(prodRes.data);
      setSales(salesRes.data);
      setForecast(forecastRes.data);
      setEvaluations(evalRes.data);
      if (prodRes.data.length > 0) {
        setSelectedProductId(prodRes.data[0].product_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find((p) => p.product_id === selectedProductId);
  const selectedEval = evaluations.find((e) => e.product_id === selectedProductId);

  // Prepare combined timeline chart: last 7 days actual vs next 7 days forecast
  const productSales = sales.filter((s) => s.product_id === selectedProductId).slice(-7);
  const productForecast = forecast.filter((f) => f.product_id === selectedProductId);

  const chartData = [
    ...productSales.map((s) => ({
      date: s.date.slice(5),
      actualSales: s.quantity_sold,
      predictedDemand: null,
      type: 'Historical Recorded',
    })),
    ...productForecast.map((f) => ({
      date: f.date.slice(5),
      actualSales: null,
      predictedDemand: f.predicted_demand,
      type: '7-Day AI Prediction',
    })),
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            7-Day Demand Forecasting
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Machine learning projections combining 30-day sales velocity, weekend spikes, and seasonality.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] flex items-center gap-2 hover:border-[#FF642B] transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#FF642B] ${loading ? 'animate-spin' : ''}`} />
          <span>Recalculate Projections</span>
        </button>
      </div>

      {/* SKU Selector Strip */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="sku-select" className="text-xs font-bold uppercase tracking-wider text-[#0F172A] shrink-0">
            Select Active SKU:
          </label>
          <select
            id="sku-select"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs sm:text-sm font-semibold text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#FF642B]"
          >
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_id} — {p.product_name} ({p.current_stock} in stock)
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="flex items-center gap-3 text-xs text-[#64748B]">
            <span>Category: <strong className="text-[#0F172A]">{selectedProduct.category}</strong></span>
            <span>•</span>
            <span>Lead Time: <strong className="text-[#0F172A]">{selectedProduct.lead_time_days} days</strong></span>
          </div>
        )}
      </div>

      {/* Chart & Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Combined Timeline Chart */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Historical Sales vs Next 7 Days Forecast
              </h3>
              <p className="text-xs text-[#64748B]">
                Actual recorded daily sales (blue) transitioned into predicted daily demand (orange)
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF1EB] text-[#FF642B]">
              Ridge Harmonic ML
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="actualSales" fill="#38BDF8" name="Past Recorded Sales" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="predictedDemand" stroke="#FF642B" strokeWidth={3} dot={{ r: 4, fill: '#FF642B' }} name="7-Day AI Predicted Demand" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Metrics & Accuracy Evaluation */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-5 h-5 text-[#FF642B]" />
              <h3 className="text-base font-bold text-[#0F172A]">Model Accuracy Metrics</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Standardized error metrics computed against cross-validated holdout retail sales datasets.
            </p>

            {selectedEval ? (
              <div className="space-y-3 mt-4">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">Mean Absolute Error (MAE)</span>
                  <span className="text-sm font-mono font-bold text-[#0F172A]">
                    {selectedEval.mae.toFixed(2)} units
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">Root Mean Squared (RMSE)</span>
                  <span className="text-sm font-mono font-bold text-[#0F172A]">
                    {selectedEval.rmse.toFixed(2)} units
                  </span>
                </div>

                {selectedEval.r2_score && (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                    <span className="text-xs text-[#64748B]">Model R² Goodness-of-Fit</span>
                    <span className="text-sm font-mono font-bold text-emerald-600">
                      {(selectedEval.r2_score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-900">
                  Algorithm: <strong>{selectedEval.model_type}</strong>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
                Evaluation metrics for this product will appear once more than 14 days of continuous sales have been recorded.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F1F5F9] text-xs text-[#94A3B8]">
            Note: MAE/RMSE figures reflect genuine holdout validation datasets (Parth's testing module).
          </div>
        </div>

      </div>

      {/* Limitations and Cold-Start Transparency */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex items-start gap-4">
        <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-[#475569] space-y-1">
          <strong className="text-[#0F172A] block font-semibold">
            Forecast Limitations & Cold-Start Explanations:
          </strong>
          <p className="leading-relaxed">
            Machine learning demand forecasts assume a minimum of 14 continuous days of transaction history. For newly launched SKUs or products with fewer than 7 recorded sales, SmartStock AI automatically falls back to category-average daily burn rates with a conservative safety stock buffer to protect against blind stockouts.
          </p>
        </div>
      </div>

    </div>
  );
};
