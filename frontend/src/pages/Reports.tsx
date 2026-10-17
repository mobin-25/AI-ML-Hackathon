import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Download,
  TrendingUp,
  BarChart3,
  Package,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getProducts, getSalesHistory } from '../api/client';
import type { Product, SalesRecord } from '../types';

type DateRangeOption = '7' | '30' | '90' | '365';
type TabType = 'overview' | 'sales' | 'purchases' | 'inventory';

interface DailyFinancialRecord {
  date: string;
  displayDate: string;
  sales: number;
  purchases: number;
  salesUnits: number;
  purchaseUnits: number;
  netMargin: number;
}

interface PurchaseOrder {
  id: string;
  date: string;
  product_id: string;
  product_name: string;
  category: string;
  units: number;
  unit_cost: number;
  total_cost: number;
  status: 'Received' | 'Delivered';
}

export const Reports: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('30');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reset scroll position on mount or tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Close download dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products and sales history based on selected date range
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const days = parseInt(selectedRange, 10);
        const [prodRes, salesRes] = await Promise.all([
          getProducts(),
          getSalesHistory(days),
        ]);
        setProducts(prodRes.data || []);
        setSalesRecords(salesRes.data || []);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedRange]);

  // Product price lookup map (Unit cost and selling retail price estimate)
  const productPriceMap = useMemo(() => {
    const map = new Map<string, { cost: number; retail: number; name: string; category: string }>();
    products.forEach((p) => {
      map.set(p.product_id, {
        cost: p.unit_cost,
        // Retail markup (~1.3x unit cost for retail sales price)
        retail: Math.round(p.unit_cost * 1.3),
        name: p.product_name,
        category: p.category || 'General',
      });
    });
    return map;
  }, [products]);

  // Filter sales records within selected date range
  const daysCount = parseInt(selectedRange, 10);
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - daysCount);
    return d.toISOString().split('T')[0];
  }, [daysCount]);

  const filteredSales = useMemo(() => {
    return salesRecords.filter((s) => s.date >= cutoffDate);
  }, [salesRecords, cutoffDate]);

  // Generate synthetic purchase/restock orders from inventory lead times & restock cycles
  const purchaseOrders = useMemo<PurchaseOrder[]>(() => {
    const orders: PurchaseOrder[] = [];
    const today = new Date();

    // Create realistic periodic batch replenishment shipments over the selected range
    products.forEach((prod) => {
      const restockBatch = Math.max(10, Math.round((prod.lead_time_days || 5) * (prod.base_daily_sales || 5) * 1.5));
      const intervalDays = Math.max(7, (prod.lead_time_days || 5) * 2);

      for (let offset = 4; offset <= daysCount; offset += intervalDays) {
        const d = new Date(today);
        d.setDate(d.getDate() - offset);
        const dateStr = d.toISOString().split('T')[0];

        orders.push({
          id: `PO-${dateStr.replace(/-/g, '')}-${prod.product_id}`,
          date: dateStr,
          product_id: prod.product_id,
          product_name: prod.product_name,
          category: prod.category || 'General',
          units: restockBatch,
          unit_cost: prod.unit_cost,
          total_cost: Math.round(restockBatch * prod.unit_cost),
          status: 'Received',
        });
      }
    });

    return orders.sort((a, b) => b.date.localeCompare(a.date));
  }, [products, daysCount]);

  // Aggregate Daily Trend Data (Sales vs Purchases Trend)
  const dailyFinancialData = useMemo<DailyFinancialRecord[]>(() => {
    const map = new Map<string, { sales: number; purchases: number; salesUnits: number; purchaseUnits: number }>();
    const today = new Date();

    // Initialize all days in the range so graph lines are smooth and continuous
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      map.set(dateStr, { sales: 0, purchases: 0, salesUnits: 0, purchaseUnits: 0 });
    }

    // Accumulate Sales
    filteredSales.forEach((s) => {
      const info = productPriceMap.get(s.product_id);
      const retailPrice = info?.retail || 50;
      const amount = s.quantity_sold * retailPrice;

      const curr = map.get(s.date) || { sales: 0, purchases: 0, salesUnits: 0, purchaseUnits: 0 };
      curr.sales += amount;
      curr.salesUnits += s.quantity_sold;
      map.set(s.date, curr);
    });

    // Accumulate Purchases
    purchaseOrders.forEach((po) => {
      if (map.has(po.date)) {
        const curr = map.get(po.date)!;
        curr.purchases += po.total_cost;
        curr.purchaseUnits += po.units;
      }
    });

    // Format output sorted chronologically
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, vals]) => {
        const parts = date.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = parseInt(parts[1], 10) - 1;
        const displayDate = `${parts[2]} ${monthNames[m] || ''}`;

        return {
          date,
          displayDate,
          sales: Math.round(vals.sales),
          purchases: Math.round(vals.purchases),
          salesUnits: vals.salesUnits,
          purchaseUnits: vals.purchaseUnits,
          netMargin: Math.round(vals.sales - vals.purchases),
        };
      });
  }, [daysCount, filteredSales, purchaseOrders, productPriceMap]);

  // Category-wise Stock Aggregation
  const categoryStockData = useMemo(() => {
    const map = new Map<string, { category: string; units: number; valuation: number; count: number }>();

    products.forEach((p) => {
      const cat = p.category || 'General';
      const curr = map.get(cat) || { category: cat, units: 0, valuation: 0, count: 0 };
      curr.units += p.current_stock || 0;
      curr.valuation += (p.current_stock || 0) * (p.unit_cost || 0);
      curr.count += 1;
      map.set(cat, curr);
    });

    return Array.from(map.values()).sort((a, b) => b.units - a.units);
  }, [products]);

  // Summary Metrics
  const totalSales = useMemo(() => {
    return dailyFinancialData.reduce((acc, d) => acc + d.sales, 0);
  }, [dailyFinancialData]);

  const totalPurchases = useMemo(() => {
    return dailyFinancialData.reduce((acc, d) => acc + d.purchases, 0);
  }, [dailyFinancialData]);

  const totalProducts = products.length;

  const lowStockCount = useMemo(() => {
    return products.filter((p) => (p.current_stock || 0) <= (p.reorder_point || 10)).length;
  }, [products]);

  // Overall Inventory Value
  const totalInventoryValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.current_stock || 0) * (p.unit_cost || 0), 0);
  }, [products]);

  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.current_stock || 0), 0);
  }, [products]);

  // CSV Export Handler
  const handleDownloadCsv = () => {
    let csvContent = `data:text/csv;charset=utf-8,`;

    csvContent += `SMARTSTOCK AI - EXECUTIVE RETAIL REPORT\n`;
    csvContent += `Period,Last ${selectedRange} days\n`;
    csvContent += `Generated Date,${new Date().toLocaleString()}\n\n`;

    // 1. Summary Cards
    csvContent += `--- EXECUTIVE SUMMARY ---\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Sales (INR),₹${totalSales.toLocaleString()}\n`;
    csvContent += `Total Purchases (INR),₹${totalPurchases.toLocaleString()}\n`;
    csvContent += `Net Margin (INR),₹${(totalSales - totalPurchases).toLocaleString()}\n`;
    csvContent += `Total Products,${totalProducts}\n`;
    csvContent += `Low Stock Items,${lowStockCount}\n`;
    csvContent += `Total Inventory Units,${totalStockUnits}\n`;
    csvContent += `Total Inventory Valuation (INR),₹${totalInventoryValuation.toLocaleString()}\n\n`;

    // 2. Daily Financial Data
    csvContent += `--- DAILY SALES VS PURCHASES TREND ---\n`;
    csvContent += `Date,Sales (INR),Purchases (INR),Sales Units,Purchase Units,Net Margin (INR)\n`;
    dailyFinancialData.forEach((row) => {
      csvContent += `${row.date},${row.sales},${row.purchases},${row.salesUnits},${row.purchaseUnits},${row.netMargin}\n`;
    });
    csvContent += `\n`;

    // 3. Category Breakdown
    csvContent += `--- CATEGORY-WISE STOCK DISTRIBUTION ---\n`;
    csvContent += `Category,Product Count,Total Stock Units,Valuation (INR)\n`;
    categoryStockData.forEach((cat) => {
      csvContent += `"${cat.category}",${cat.count},${cat.units},${Math.round(cat.valuation)}\n`;
    });
    csvContent += `\n`;

    // 4. Low Stock Alert Catalog
    csvContent += `--- LOW STOCK REPLENISHMENT ITEMS ---\n`;
    csvContent += `SKU ID,Product Name,Category,Current Stock,Reorder Point,Unit Cost (INR)\n`;
    products
      .filter((p) => (p.current_stock || 0) <= (p.reorder_point || 10))
      .forEach((p) => {
        csvContent += `${p.product_id},"${p.product_name}","${p.category || 'General'}",${p.current_stock},${p.reorder_point || 10},${p.unit_cost}\n`;
      });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartStock_Report_${selectedRange}Days_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloadOpen(false);
  };

  // PDF / Print Handler
  const handleDownloadPdf = () => {
    setIsDownloadOpen(false);
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:space-y-4">
      {/* ========================================================= */}
      {/* 1. Header Row (Heading, Download Report, Date Filter)     */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191919] tracking-tight">Reports</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 print:hidden">
            Performance analytics, cash flow, and inventory distribution
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 print:hidden">
          {/* Download Report Button with Dropdown */}
          <div className="relative" ref={downloadRef}>
            <button
              type="button"
              id="btn-download-report"
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              className="px-4 py-2.5 bg-[#6125E8] hover:bg-[#521cc9] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {isDownloadOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in">
                <button
                  type="button"
                  id="btn-download-pdf"
                  onClick={handleDownloadPdf}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-gray-700 hover:bg-purple-50 hover:text-[#6125E8] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#6125E8]" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  id="btn-download-csv"
                  onClick={handleDownloadCsv}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-gray-700 hover:bg-purple-50 hover:text-[#6125E8] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative">
            <div className="flex items-center bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#191919] shadow-2xs hover:bg-[#F9FAFB] transition-colors cursor-pointer">
              <Calendar className="w-4 h-4 text-[#64748B] mr-2 shrink-0" />
              <select
                id="select-date-range"
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value as DateRangeOption)}
                className="bg-transparent focus:outline-none cursor-pointer pr-4 appearance-none text-[#191919] font-semibold"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">All Time</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] pointer-events-none -ml-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <h2 className="text-xl font-bold">SmartStock AI — Retail Analytics Report</h2>
        <p className="text-xs text-gray-600">Period: Last {selectedRange} days | Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* ========================================================= */}
      {/* 2. Four Summary Cards in One Row (Matches Screenshot)     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Sales */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium block">Total Sales</span>
            <span className="text-xl sm:text-2xl font-bold text-[#191919] tracking-tight">
              ₹{totalSales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2. Total Purchases */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium block">Total Purchases</span>
            <span className="text-xl sm:text-2xl font-bold text-[#191919] tracking-tight">
              ₹{totalPurchases.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 3. Total Products */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-[#6125E8]" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium block">Total Products</span>
            <span className="text-xl sm:text-2xl font-bold text-[#191919] tracking-tight">
              {totalProducts}
            </span>
          </div>
        </div>

        {/* 4. Low Stock Items */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium block">Low Stock Items</span>
            <span className="text-xl sm:text-2xl font-bold text-[#191919] tracking-tight">
              {lowStockCount}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. Four Tabs: Overview, Sales, Purchases, Inventory       */}
      {/* ========================================================= */}
      <div className="bg-[#F0F2F6] p-1 rounded-xl inline-flex flex-wrap items-center gap-1 print:hidden">
        <button
          type="button"
          id="tab-overview"
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-[#191919] shadow-xs'
              : 'text-[#64748B] hover:text-[#191919]'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          id="tab-sales"
          onClick={() => setActiveTab('sales')}
          className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-white text-[#191919] shadow-xs'
              : 'text-[#64748B] hover:text-[#191919]'
          }`}
        >
          Sales
        </button>
        <button
          type="button"
          id="tab-purchases"
          onClick={() => setActiveTab('purchases')}
          className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'purchases'
              ? 'bg-white text-[#191919] shadow-xs'
              : 'text-[#64748B] hover:text-[#191919]'
          }`}
        >
          Purchases
        </button>
        <button
          type="button"
          id="tab-inventory"
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-white text-[#191919] shadow-xs'
              : 'text-[#64748B] hover:text-[#191919]'
          }`}
        >
          Inventory
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW (Matches Reference Screenshot)            */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Two Large Chart Cards Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Sales vs Purchases Trend */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-base font-bold text-[#191919]">Sales vs Purchases Trend</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Daily revenue inflow vs replenishment procurement outflow
                </p>
              </div>

              {dailyFinancialData.length === 0 || isLoading ? (
                <div className="h-72 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  Loading trend data...
                </div>
              ) : (
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyFinancialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                        interval={Math.ceil(dailyFinancialData.length / 6)}
                      />
                      <YAxis
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          `₹${Number(val).toLocaleString()}`,
                          name === 'sales' ? 'Sales Revenue' : 'Purchase Cost',
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        }}
                      />
                      {/* Orange Line: purchases */}
                      <Line
                        type="monotone"
                        dataKey="purchases"
                        name="purchases"
                        stroke="#FF642D"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#FF642D', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                      {/* Purple Line: sales */}
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="sales"
                        stroke="#6125E8"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#6125E8', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legend matching screenshot: --o-- purchases   --o-- sales */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-[#FF642D]">
                  <span className="w-2.5 h-0.5 bg-[#FF642D] inline-block" />
                  <span className="w-2 h-2 rounded-full border-2 border-[#FF642D] inline-block" />
                  <span className="w-2.5 h-0.5 bg-[#FF642D] inline-block" />
                  <span className="capitalize ml-1 text-xs">purchases</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#6125E8]">
                  <span className="w-2.5 h-0.5 bg-[#6125E8] inline-block" />
                  <span className="w-2 h-2 rounded-full border-2 border-[#6125E8] inline-block" />
                  <span className="w-2.5 h-0.5 bg-[#6125E8] inline-block" />
                  <span className="capitalize ml-1 text-xs">sales</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Category-wise Stock */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-base font-bold text-[#191919]">Category-wise Stock</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Available units grouped by product department
                </p>
              </div>

              {categoryStockData.length === 0 || isLoading ? (
                <div className="h-72 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  Loading category stock...
                </div>
              ) : (
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStockData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="category"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()} units`, 'Current Stock']}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        }}
                      />
                      <Bar
                        dataKey="units"
                        fill="#6125E8"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Category Breakdown Total Summary */}
              <div className="flex items-center justify-between text-xs text-[#64748B] pt-3 border-t border-gray-100">
                <span>Total Categories: <strong className="text-[#191919]">{categoryStockData.length}</strong></span>
                <span>Total Units: <strong className="text-[#6125E8]">{totalStockUnits.toLocaleString()} pcs</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Financial Health Indicators */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h4 className="text-sm font-bold text-[#191919] mb-4">Financial & Inventory Health Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500 block">Gross Profit</span>
                <span className="text-lg font-bold text-emerald-600 block mt-1">
                  ₹{(totalSales - totalPurchases).toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5 block">Sales revenue minus purchases</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500 block">Inventory Valuation</span>
                <span className="text-lg font-bold text-[#6125E8] block mt-1">
                  ₹{totalInventoryValuation.toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5 block">Based on wholesale unit cost</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500 block">Avg. Daily Sales</span>
                <span className="text-lg font-bold text-[#191919] block mt-1">
                  ₹{Math.round(totalSales / (daysCount || 1)).toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5 block">Over last {selectedRange} days</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500 block">Stock Health Ratio</span>
                <span className="text-lg font-bold text-blue-600 block mt-1">
                  {totalProducts > 0 ? Math.round(((totalProducts - lowStockCount) / totalProducts) * 100) : 100}%
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5 block">Products with healthy stock</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SALES                                              */}
      {/* ========================================================= */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales Revenue Trend */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h3 className="text-base font-bold text-[#191919] mb-1">Sales Revenue Trend</h3>
            <p className="text-xs text-[#64748B] mb-5">Daily gross revenue over selected period</p>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="displayDate" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Daily Sales']} />
                  <Line type="monotone" dataKey="sales" stroke="#6125E8" strokeWidth={3} dot={{ r: 3, fill: '#6125E8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Sales Records Table */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h3 className="text-base font-bold text-[#191919] mb-4">Recent Sales Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Quantity Sold</th>
                    <th className="pb-3">Unit Price</th>
                    <th className="pb-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSales.slice(0, 15).map((sale, idx) => {
                    const info = productPriceMap.get(sale.product_id);
                    const price = info?.retail || 50;
                    const total = sale.quantity_sold * price;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 text-gray-600">{sale.date}</td>
                        <td className="py-3 font-medium text-gray-900">{sale.product_id}</td>
                        <td className="py-3 text-gray-800">{info?.name || 'Product Item'}</td>
                        <td className="py-3 text-gray-700">{sale.quantity_sold} pcs</td>
                        <td className="py-3 text-gray-700">₹{price}</td>
                        <td className="py-3 text-right font-bold text-[#191919]">₹{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PURCHASES                                          */}
      {/* ========================================================= */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {/* Purchase Expenditure Trend */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h3 className="text-base font-bold text-[#191919] mb-1">Procurement & Purchases Outlay</h3>
            <p className="text-xs text-[#64748B] mb-5">Supplier restock orders and wholesale expenses</p>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="displayDate" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Purchase Outlay']} />
                  <Line type="monotone" dataKey="purchases" stroke="#FF642D" strokeWidth={3} dot={{ r: 3, fill: '#FF642D' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purchase Orders Log */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h3 className="text-base font-bold text-[#191919] mb-4">Stock In & Purchase Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="pb-3">PO Number</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Restocked Units</th>
                    <th className="pb-3">Unit Cost</th>
                    <th className="pb-3 text-right">Total Incurred</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {purchaseOrders.slice(0, 12).map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-medium text-gray-900">{po.id}</td>
                      <td className="py-3 text-gray-600">{po.date}</td>
                      <td className="py-3 text-gray-800">{po.product_name}</td>
                      <td className="py-3 text-gray-700">{po.units} pcs</td>
                      <td className="py-3 text-gray-700">₹{po.unit_cost.toFixed(2)}</td>
                      <td className="py-3 text-right font-bold text-[#191919]">₹{po.total_cost.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: INVENTORY                                          */}
      {/* ========================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Category-wise Stock Bar Chart */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h3 className="text-base font-bold text-[#191919] mb-1">Category Inventory Distribution</h3>
            <p className="text-xs text-[#64748B] mb-5">Stock units across retail departments</p>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStockData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="category" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} units`, 'Stock Units']} />
                  <Bar dataKey="units" fill="#6125E8" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Stock Table */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h3 className="text-base font-bold text-[#191919] mb-4">Product Inventory Audit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Current Stock</th>
                    <th className="pb-3">Unit Cost</th>
                    <th className="pb-3 text-right">Total Valuation</th>
                    <th className="pb-3 text-right">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => {
                    const isLow = (p.current_stock || 0) <= (p.reorder_point || 10);
                    const isCritical = (p.current_stock || 0) <= 5;
                    const val = (p.current_stock || 0) * (p.unit_cost || 0);
                    return (
                      <tr key={p.product_id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">{p.product_id}</td>
                        <td className="py-3 text-gray-800">{p.product_name}</td>
                        <td className="py-3 text-gray-600">{p.category || 'General'}</td>
                        <td className="py-3 font-semibold text-gray-900">{p.current_stock} pcs</td>
                        <td className="py-3 text-gray-700">₹{p.unit_cost.toFixed(2)}</td>
                        <td className="py-3 text-right font-bold text-[#191919]">₹{val.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          {isCritical ? (
                            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              Critical Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
