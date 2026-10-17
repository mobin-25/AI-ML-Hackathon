import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Barcode,
  Scan,
  FileText,
  Plus,
  Zap,
  CheckCircle2,
  ShieldAlert,
  Banknote,
  Bot,
  Package,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Trophy,
  ArrowRight,
  Mic,
  Send,
  X,
  Upload,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { getProducts, getSalesHistory, createProduct } from '../api/client';
import type { Product, SalesRecord } from '../types';

export const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') === 'analytics' ? 'analytics' : 'command';

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SalesRecord[]>([]);

  // Active Action Modals for Command Center
  const [activeModal, setActiveModal] = useState<
    'lookup' | 'barcode' | 'product_scan' | 'invoice_scan' | 'add_stock' | null
  >(null);

  // New stock form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Electronics & Mobile');
  const [newProdStock, setNewProdStock] = useState('25');
  const [newProdPrice, setNewProdPrice] = useState('450');

  // AI Assistant Chat State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiHistory, setAiHistory] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, salesRes] = await Promise.all([
          getProducts(),
          getSalesHistory(),
        ]);
        setProducts(prodRes.data || []);
        setSales(salesRes.data || []);
      } catch {
        // Fallback to empty states
      }
    };
    fetchData();
  }, []);

  const setView = (view: 'command' | 'analytics') => {
    setSearchParams({ view });
  };

  // Calculate live or calibrated metrics
  const totalProducts = products.length;
  const outOfStockCount = products.filter((p) => p.current_stock === 0).length;
  const lowStockCount = products.filter(
    (p) => p.current_stock > 0 && p.current_stock <= (p.reorder_point || 5)
  ).length;
  const overstockedCount = products.filter(
    (p) => p.stock_risk === 'OVERSTOCKED' || (p.days_of_supply && p.days_of_supply > 60)
  ).length;

  const totalStockValue = products.reduce(
    (acc, p) => acc + (p.inventory_value || (p.current_stock || 0) * (p.unit_cost || 0)),
    0
  );
  const healthyStockValue = products
    .filter((p) => p.stock_risk === 'HEALTHY' || p.stock_risk === 'Optimal Stock')
    .reduce((acc, p) => acc + (p.inventory_value || (p.current_stock || 0) * (p.unit_cost || 0)), 0);
  const blockedOverstockValue = products
    .filter((p) => p.stock_risk === 'OVERSTOCKED')
    .reduce((acc, p) => acc + (p.inventory_value || (p.current_stock || 0) * (p.unit_cost || 0)), 0);
  const lostSalesRisk = products
    .filter((p) => p.stock_risk === 'CRITICAL' || p.current_stock === 0)
    .reduce((acc, p) => acc + (p.reorder_point || 5) * (p.unit_cost || 0), 0);

  // 7-Day Sales Trend Data (matching minimal chart in screenshot)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trendData = daysOfWeek.map((day) => {
    const matching = sales.filter((s) => {
      const d = new Date(s.date);
      return daysOfWeek[d.getDay()] === day;
    });
    const amount = matching.reduce((acc, s) => acc + (s.quantity_sold || 0), 0);
    return { day, value: amount };
  });

  // Category distribution data
  const categoryCounts = products.reduce<Record<string, number>>((acc, p) => {
    const cat = p.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const pieData =
    Object.keys(categoryCounts).length > 0
      ? Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
      : [{ name: 'No 100%', value: 1 }];

  const PIE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  const handleAskAI = (promptText?: string) => {
    const query = promptText || aiQuestion;
    if (!query.trim()) return;

    setIsAiAnswering(true);
    setAiQuestion('');

    setTimeout(() => {
      let response = '';
      const q = query.toLowerCase();
      if (q.includes('next week') || q.includes('how much stock')) {
        response = `Forecast analysis: Your overall stock health index is optimal. Expected replenishment velocity indicates steady demand across retail SKUs with no immediate stockouts projected.`;
      } else if (q.includes('fastest') || q.includes('selling')) {
        response = `Top fast-moving products: Mobile fast-charging cables and LED lighting fixtures exhibit 18% higher sales frequency compared to category benchmarks.`;
      } else if (q.includes('reorder')) {
        response = `Reorder recommendation: All inventory lines are currently above critical reorder thresholds. Supplier WhatsApp reorder queue is clear.`;
      } else {
        response = `SmartStock AI processed "${query}": Store metrics, safety stock buffers, and inventory turnover ratios remain balanced.`;
      }

      setAiHistory((prev) => [{ question: query, answer: response }, ...prev]);
      setIsAiAnswering(false);
    }, 500);
  };

  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newProduct: Omit<Product, 'stock_risk'> = {
      product_id: `SKU-${Date.now().toString().slice(-4)}`,
      product_name: newProdName,
      category: newProdCategory,
      current_stock: parseInt(newProdStock, 10) || 10,
      unit_cost: parseFloat(newProdPrice) || 100,
      lead_time_days: 3,
      reorder_point: 5,
    };

    await createProduct(newProduct);
    const updated = await getProducts();
    setProducts(updated.data);
    setActiveModal(null);
    setNewProdName('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]/60">
        <div className="inline-flex p-1 bg-[#EAECEF] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setView('command')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentView === 'command'
                ? 'bg-white text-[#191919] shadow-xs'
                : 'text-[#64748B] hover:text-[#191919]'
            }`}
          >
            Command Center
          </button>
          <button
            type="button"
            onClick={() => setView('analytics')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentView === 'analytics'
                ? 'bg-white text-[#191919] shadow-xs'
                : 'text-[#64748B] hover:text-[#191919]'
            }`}
          >
            Analytics Overview
          </button>
        </div>

        <span className="text-[11px] font-medium text-[#94A3B8] hidden sm:inline">
          SmartStock.AI Enterprise Console
        </span>
      </div>

      {/* =================================================================== */}
      {/* VIEW 1: COMMAND CENTER (Screenshot 1)                               */}
      {/* =================================================================== */}
      {currentView === 'command' && (
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191919] tracking-tight">
                Command Center
              </h1>
              <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
                Decision-focused view — what needs your attention now
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveModal('lookup')}
                className="px-3.5 py-2 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#191919] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Lookup Product</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('barcode')}
                className="px-3.5 py-2 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#191919] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Barcode className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Barcode Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('product_scan')}
                className="px-3.5 py-2 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#191919] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Product Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('invoice_scan')}
                className="px-3.5 py-2 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#191919] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Scan Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('add_stock')}
                className="px-4 py-2 bg-[#6428F5] hover:bg-[#521fe0] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Stock</span>
              </button>
            </div>
          </div>

          {/* AI Insights Banner */}
          <div className="bg-[#F5EEFF] border border-[#E4D0FC] rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm text-[#6428F5]">
            <Bot className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              AI-Powered Insights — All recommendations include explanations. You always have manual override.
            </span>
          </div>

          {/* Next Best Actions Card */}
          <div className="bg-white rounded-2xl border border-[#FFE2D5] p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#FF642D]" />
              <h2 className="text-base sm:text-lg font-bold text-[#191919]">
                Next Best Actions
              </h2>
            </div>

            <div className="bg-[#FFF4EE] border border-[#FFE7DC] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white border border-[#FF642D] text-[#FF642D] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#191919]">
                    All systems healthy
                  </h3>
                  <p className="text-xs text-[#667085]">
                    No urgent actions needed right now
                  </p>
                </div>
              </div>

              <Link
                to="/inventory"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#191919] shadow-2xs transition-colors self-start sm:self-auto"
              >
                <span>View Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2-Column Grid: Daily Risk Summary & Cash Impact View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Risk Summary */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-5 h-5 text-[#FF642D]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#191919]">
                    Daily Risk Summary
                  </h2>
                </div>

                {/* Circular Health Gauge */}
                <div className="flex flex-col items-center justify-center my-4">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background circular track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#F1F3F5"
                        strokeWidth="8"
                      />
                      {/* Orange arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#FF642D"
                        strokeWidth="8"
                        strokeDasharray="238.76"
                        strokeDashoffset={238.76 * (1 - 0.25)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-extrabold text-[#191919] leading-none">
                        {outOfStockCount}
                      </span>
                      <span className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase mt-1">
                        HEALTHY
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Rows Breakdown */}
                <div className="space-y-3 mt-6 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-[#374151]">Out of Stock</span>
                    </div>
                    <span className="font-bold text-[#191919]">{outOfStockCount} items</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-[#374151]">Low Stock</span>
                    </div>
                    <span className="font-bold text-[#191919]">{lowStockCount} items</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-[#374151]">Overstocked</span>
                    </div>
                    <span className="font-bold text-[#191919]">{overstockedCount} items</span>
                  </div>
                </div>
              </div>

              {/* Full Health Report button */}
              <Link
                to="/inventory"
                className="mt-6 w-full py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#191919] text-center transition-colors block"
              >
                Full Health Report →
              </Link>
            </div>

            {/* Cash Impact View */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Banknote className="w-5 h-5 text-[#FF642D]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#191919]">
                    Cash Impact View
                  </h2>
                </div>

                {/* 2x2 Grid of Metric Tiles */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Tile 1: TOTAL VALUE */}
                  <div className="bg-[#FFF5ED] border border-[#FFE4D3] rounded-xl p-4 text-center">
                    <div className="text-xl sm:text-2xl font-extrabold text-[#FF642D]">
                      ₹{totalStockValue.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase mt-1">
                      TOTAL VALUE
                    </div>
                  </div>

                  {/* Tile 2: HEALTHY STOCK */}
                  <div className="bg-[#FFF5ED] border border-[#FFE4D3] rounded-xl p-4 text-center">
                    <div className="text-xl sm:text-2xl font-extrabold text-[#FF642D]">
                      ₹{healthyStockValue.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase mt-1">
                      HEALTHY STOCK
                    </div>
                  </div>

                  {/* Tile 3: BLOCKED IN OVERSTOCK */}
                  <div className="bg-[#FFF0F0] border border-[#FFDADA] rounded-xl p-4 text-center">
                    <div className="text-xl sm:text-2xl font-extrabold text-[#EF4444]">
                      ₹{blockedOverstockValue.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase mt-1">
                      BLOCKED IN OVERSTOCK
                    </div>
                  </div>

                  {/* Tile 4: LOST SALES RISK */}
                  <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-xl p-4 text-center">
                    <div className="text-xl sm:text-2xl font-extrabold text-[#CA8A04]">
                      ₹{lostSalesRisk.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase mt-1">
                      LOST SALES RISK
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#64748B] font-medium mt-4">
                  Capital Distribution
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: ANALYTICS DASHBOARD (Screenshots 2 & 3)                      */}
      {/* =================================================================== */}
      {currentView === 'analytics' && (
        <div className="space-y-6">
          {/* Top Row: 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Products */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#3B82F6]">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#64748B]">Products</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#191919]">
                {totalProducts}
              </div>
            </div>

            {/* 2. Today's Sales */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#FFF4EE] text-[#FF642D]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#64748B]">Today's Sales</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#191919]">
                ₹0
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">0 transactions</p>
            </div>

            {/* 3. Alerts */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#EF4444]">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#64748B]">Alerts</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#191919]">
                0
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">0 critical</p>
            </div>

            {/* 4. Stock Value */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#F5F3FF] text-[#8B5CF6]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#64748B]">Stock Value</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#191919]">
                ₹{totalStockValue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Row 2: 7-Day Sales Trend & Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-Day Sales Trend */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-[#FF642D]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#191919]">
                  7-Day Sales Trend
                </h2>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val}`}
                      domain={[0, 4]}
                    />
                    <Tooltip
                      formatter={(val: any) => [`₹${val}`, 'Sales']}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#FF642D"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs">
              <h2 className="text-base sm:text-lg font-bold text-[#191919] mb-4">
                Category Distribution
              </h2>
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      dataKey="value"
                      label={({ name }) => name}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Stock Alerts & AI Reorder Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Alerts */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h2 className="text-base sm:text-lg font-bold text-[#191919]">
                      Stock Alerts
                    </h2>
                  </div>
                  <Link
                    to="/alerts"
                    className="text-xs font-semibold text-[#64748B] hover:text-[#FF642D] flex items-center gap-1 transition-colors"
                  >
                    <span>View All</span>
                    <span>→</span>
                  </Link>
                </div>

                <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#64748B]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>All stock levels healthy</span>
                </div>
              </div>
            </div>

            {/* AI Reorder Queue */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#FF642D]" />
                    <h2 className="text-base sm:text-lg font-bold text-[#191919]">
                      AI Reorder Queue
                    </h2>
                  </div>
                  <Link
                    to="/alerts"
                    className="text-xs font-semibold text-[#64748B] hover:text-[#FF642D] flex items-center gap-1 transition-colors"
                  >
                    <span>Review All</span>
                    <span>→</span>
                  </Link>
                </div>

                <div className="py-8 text-center text-xs text-[#64748B]">
                  No pending suggestions
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Top Suppliers */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FF642D]" />
                <h2 className="text-base sm:text-lg font-bold text-[#191919]">
                  Top Suppliers
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => alert('Supplier list exported')}
                  className="text-[#64748B] hover:text-[#191919] cursor-pointer"
                >
                  Export
                </button>
                <Link to="/inventory" className="text-[#64748B] hover:text-[#FF642D]">
                  View All →
                </Link>
              </div>
            </div>

            <div className="py-8 text-center text-xs text-[#64748B]">
              No suppliers added yet
            </div>
          </div>

          {/* Row 5: Ask SmartStock AI Full-Width Assistant Panel */}
          <div className="bg-white rounded-2xl border border-[#E4D0FC] p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#6428F5]" />
                <h2 className="text-base font-bold text-[#191919]">
                  Ask SmartStock AI
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5EEFF] text-[#6428F5] border border-[#E4D0FC]">
                  Voice or text
                </span>
              </div>
            </div>

            {/* Input area */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert('Voice command active. Speak now into your microphone.')}
                className="p-2.5 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#64748B] hover:text-[#191919] transition-colors cursor-pointer"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskAI();
                }}
                placeholder="e.g., How much stock do I have next week?"
                className="flex-1 px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#191919] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:border-[#6428F5]"
              />
              <button
                type="button"
                onClick={() => handleAskAI()}
                disabled={isAiAnswering}
                className="p-2.5 rounded-xl bg-[#6428F5] hover:bg-[#521fe0] text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[11px] text-[#94A3B8]">Suggested:</span>
              <button
                type="button"
                onClick={() => handleAskAI('How much stock next week?')}
                className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-[11px] text-[#475569] font-medium transition-colors cursor-pointer"
              >
                How much stock next week?
              </button>
              <button
                type="button"
                onClick={() => handleAskAI('Which products are selling fastest?')}
                className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-[11px] text-[#475569] font-medium transition-colors cursor-pointer"
              >
                Which products are selling fastest?
              </button>
              <button
                type="button"
                onClick={() => handleAskAI('What should I reorder?')}
                className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-[11px] text-[#475569] font-medium transition-colors cursor-pointer"
              >
                What should I reorder?
              </button>
            </div>

            {/* AI Assistant Output Responses */}
            {isAiAnswering && (
              <div className="mt-4 p-3 rounded-xl bg-[#F5EEFF] text-xs text-[#6428F5] flex items-center gap-2">
                <Bot className="w-4 h-4 animate-spin" />
                <span>SmartStock AI is computing inventory radar...</span>
              </div>
            )}

            {aiHistory.length > 0 && (
              <div className="mt-4 space-y-2.5 max-h-48 overflow-y-auto pt-2 border-t border-[#E5E7EB]/50">
                {aiHistory.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                    <p className="text-xs font-bold text-[#191919]">Q: {item.question}</p>
                    <p className="text-xs text-[#475569] leading-relaxed">A: {item.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ACTION MODALS (Command Center Interactive Features)                 */}
      {/* =================================================================== */}

      {/* 1. Lookup Product Modal */}
      {activeModal === 'lookup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919] flex items-center gap-2">
                <Search className="w-5 h-5 text-[#FF642D]" />
                <span>Lookup Product</span>
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#667085] mb-4">
              Search by SKU code, item name, or barcode number.
            </p>
            <input
              type="text"
              placeholder="e.g., SKU-1001 or Fast Charger..."
              className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm mb-4 focus:bg-white focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <Link
                to="/inventory"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#FF642D] text-white text-xs font-semibold rounded-xl hover:bg-[#E8531C]"
              >
                Search in Inventory →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Barcode Scan Modal */}
      {activeModal === 'barcode' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919]">Barcode Scanner</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-44 bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white p-4 relative overflow-hidden mb-4">
              <div className="w-48 h-24 border-2 border-[#FF642D] rounded-lg relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#FF642D] animate-pulse" />
              </div>
              <span className="text-[11px] text-gray-400 mt-3">Position barcode inside camera viewfinder</span>
            </div>
            <p className="text-xs text-[#667085] mb-4">
              Connected to camera scanning pipeline. Ready to ingest EAN-13, UPC, and QR codes.
            </p>
            <button
              type="button"
              onClick={() => {
                alert('Barcode EAN-890123456789 detected: Matched to catalogue item.');
                setActiveModal(null);
              }}
              className="w-full py-2.5 bg-[#FF642D] hover:bg-[#E8531C] text-white text-xs font-semibold rounded-xl"
            >
              Simulate Scan Capture
            </button>
          </div>
        </div>
      )}

      {/* 3. Product Scan Modal */}
      {activeModal === 'product_scan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919]">AI Product Recognition</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 mb-4 hover:border-[#6428F5] transition-colors cursor-pointer">
              <Scan className="w-10 h-10 text-[#6428F5] mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-800">Snap or drag product photo</p>
              <p className="text-[11px] text-gray-500 mt-1">AI identifies product shape, brand logo & text</p>
            </div>
            <button
              type="button"
              onClick={() => {
                alert('AI Vision Scanner: Identified 65W Fast Charger (Confidence: 97%)');
                setActiveModal(null);
              }}
              className="w-full py-2.5 bg-[#6428F5] hover:bg-[#521fe0] text-white text-xs font-semibold rounded-xl"
            >
              Run AI Recognition
            </button>
          </div>
        </div>
      )}

      {/* 4. Scan Invoice Modal */}
      {activeModal === 'invoice_scan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919]">Invoice OCR Ingestion</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 mb-4 hover:border-[#FF642D] transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-[#FF642D] mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-800">Upload purchase bill / invoice (PDF or Image)</p>
              <p className="text-[11px] text-gray-500 mt-1">Extracts supplier name, line items & taxes</p>
            </div>
            <Link
              to="/import"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-[#FF642D] hover:bg-[#E8531C] text-white text-xs font-semibold rounded-xl block text-center"
            >
              Open File Uploader →
            </Link>
          </div>
        </div>
      )}

      {/* 5. Add New Stock Modal */}
      {activeModal === 'add_stock' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919]">Add New Stock Item</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStock} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g., 65W Fast Charger Type-C"
                  required
                  className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs focus:bg-white focus:outline-none"
                >
                  <option value="Electronics & Mobile">Electronics & Mobile</option>
                  <option value="Kirana & Supermarket">Kirana & Supermarket</option>
                  <option value="Hardware & Tools">Hardware & Tools</option>
                  <option value="Automotive Spare Parts">Automotive Spare Parts</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Units in Stock
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6428F5] hover:bg-[#521fe0] text-white text-xs font-semibold rounded-xl"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
