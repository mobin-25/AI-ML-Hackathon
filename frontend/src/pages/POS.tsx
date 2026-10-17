import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  CreditCard,
  ReceiptText,
  IndianRupee,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Package,
  RefreshCw,
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
import { getProducts, getDemandForecast } from '../api/client';
import type { Product, ForecastDemand } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface SaleRecord {
  billNumber: string;
  date: string;
  customer: string;
  payment: string;
  amount: number;
  itemsCount: number;
}

type HorizonDays = 7 | 30 | 90;

export const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [productSearch, setProductSearch] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');

  // Sales History State
  const [recentSales, setRecentSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('smartstock_recent_sales');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Success Notification Toast
  const [notification, setNotification] = useState<{ message: string; billNo: string } | null>(null);

  // ---------------------------------------------------------------------------
  // Forecast Demand State
  // ---------------------------------------------------------------------------
  const [forecastHorizon, setForecastHorizon] = useState<HorizonDays>(7);
  const [forecasts, setForecasts] = useState<ForecastDemand[]>([]);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);

  // Load Inventory Products
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products for POS:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Forecast Demand from backend/adapter
  const fetchForecast = async (targetHorizon: HorizonDays = forecastHorizon) => {
    try {
      setForecastLoading(true);
      const res = await getDemandForecast(targetHorizon);
      setForecasts(res.data || []);
    } catch (err) {
      console.error('Failed to load demand forecast:', err);
    } finally {
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchForecast(forecastHorizon);
  }, []);

  useEffect(() => {
    fetchForecast(forecastHorizon);
  }, [forecastHorizon]);

  // Filter products by search query for POS grid
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.product_id.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  // Cart Calculations
  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.unit_cost || 0;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    const discounted = subtotal - (Number(discount) || 0);
    return Math.max(0, discounted);
  }, [subtotal, discount]);

  // Today's summary metrics
  const todaysBillsCount = recentSales.length;
  const todaysRevenue = useMemo(() => {
    return recentSales.reduce((acc, s) => acc + s.amount, 0);
  }, [recentSales]);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    if (product.current_stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          return prev; // Reached available stock limit
        }
        return prev.map((item) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.product_id === productId) {
            const newQty = item.quantity + delta;
            const maxStock = item.product.current_stock;
            if (newQty <= 0) return null;
            if (newQty > maxStock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.product_id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setPaymentMethod('Cash');
  };

  // Complete Sale: Records completed transaction, updates inventory, and refreshes forecast pipeline
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    const billNumber = `INV-${1000 + recentSales.length + 1}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} • ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const newSale: SaleRecord = {
      billNumber,
      date: formattedDate,
      customer: customerName.trim() || 'Walk-in Customer',
      payment: paymentMethod,
      amount: cartTotal,
      itemsCount: cartItemCount,
    };

    // Save recent sales immediately
    const updatedSales = [newSale, ...recentSales];
    setRecentSales(updatedSales);
    localStorage.setItem('smartstock_recent_sales', JSON.stringify(updatedSales));

    // Save completed POS sale product line items for forecasting pipeline
    try {
      const todayDateStr = new Date().toISOString().split('T')[0];
      const existingEvents = JSON.parse(localStorage.getItem('smartstock_pos_sales_events') || '[]');
      const newEvents = cart.map((item) => ({
        product_id: item.product.product_id,
        quantity: item.quantity,
        date: todayDateStr,
        billNumber,
      }));
      localStorage.setItem('smartstock_pos_sales_events', JSON.stringify([...existingEvents, ...newEvents]));
    } catch (e) {
      console.warn('Failed to save POS sales event:', e);
    }

    // Update product stock immediately in local state
    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = cart.find((c) => c.product.product_id === p.product_id);
        if (cartMatch) {
          return {
            ...p,
            current_stock: Math.max(0, p.current_stock - cartMatch.quantity),
          };
        }
        return p;
      })
    );

    // Refresh forecasting data immediately with updated sales and inventory
    fetchForecast(forecastHorizon);

    // Show toast
    setNotification({
      message: `Sale completed successfully!`,
      billNo: billNumber,
    });

    // Clear cart inputs
    handleClearCart();

    // Auto-dismiss toast
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // Top 5 Products Expected in Highest Demand (Simple Horizontal Bar Chart)
  // ---------------------------------------------------------------------------
  const topDemandProducts = useMemo(() => {
    if (!products.length || !forecasts.length) return [];

    const list = products.map((prod) => {
      const prodForecast = forecasts.filter((f) => f.product_id === prod.product_id);
      const predictedDemand = prodForecast.reduce((sum, f) => sum + f.predicted_demand, 0);

      // Product may need restocking if predicted demand exceeds current stock
      const needsRestock = prod.current_stock < predictedDemand;

      return {
        id: prod.product_id,
        fullName: prod.product_name,
        name: prod.product_name.length > 30 ? prod.product_name.slice(0, 28) + '…' : prod.product_name,
        predictedDemand,
        currentStock: prod.current_stock,
        needsRestock,
      };
    });

    return list
      .filter((p) => p.predictedDemand > 0)
      .sort((a, b) => b.predictedDemand - a.predictedDemand)
      .slice(0, 5);
  }, [products, forecasts]);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">{notification.message}</span>
            <span className="text-slate-400">Bill #{notification.billNo} printed & inventory updated</span>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 1. Page Header                                              */}
      {/* ----------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
          Sales
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Fast retail checkout and automated inventory demand predictions.
        </p>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 2. Top Summary Cards (4 Cards)                              */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Today's Bills */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Today's Bills</span>
            <span className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 block">
              {todaysBillsCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <ReceiptText className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 2: Today's Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Today's Revenue</span>
            <span className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 block">
              ₹{todaysRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 3: Cart Items */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Cart Items</span>
            <span className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 block">
              {cartItemCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 4: Cart Total */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Cart Total</span>
            <span className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 block">
              ₹{cartTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3. Main Workspace: Product Grid + Cart Column               */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Product Grid */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs flex flex-col">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
              <Search className="w-4 h-4 text-[#64748B]" />
              <span>Select Products</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mb-5">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm placeholder-[#9CA3AF] text-[#111827] focus:bg-white focus:outline-none focus:border-[#CBD5E1] transition-all"
            />
          </div>

          {/* Products Grid (3 columns) */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-6 h-6 text-[#9D7BFA] animate-spin mb-2" />
              <p className="text-xs text-[#64748B]">Loading catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#9CA3AF]">
              No products found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.current_stock <= 0;
                return (
                  <div
                    key={product.product_id}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#CBD5E1] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#111827] line-clamp-1">
                        {product.product_name}
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        SKU: {product.product_id} • {product.category || 'General'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Price</span>
                        <span className="text-sm font-bold text-[#111827]">
                          ₹{product.unit_cost}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-600'
                              : product.current_stock < 15
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {product.current_stock} in stock
                        </span>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(product)}
                          className="w-7 h-7 rounded-lg bg-[#9D7BFA] hover:bg-[#8B68F5] active:bg-[#7A56E6] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          title="Add to Cart"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Cart & Checkout Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs flex flex-col">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
              <ShoppingBag className="w-4 h-4 text-[#64748B]" />
              <span>Cart ({cartItemCount})</span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-[#9CA3AF]">
              <ShoppingBag className="w-8 h-8 mb-2 stroke-[1.5]" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Click + on products to add</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6] max-h-56 overflow-y-auto my-3 pr-1">
              {cart.map((item) => {
                const lineTotal = (item.product.unit_cost || 0) * item.quantity;
                return (
                  <div key={item.product.product_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-[#111827] truncate">{item.product.product_name}</p>
                      <p className="text-[11px] text-[#64748B]">
                        ₹{item.product.unit_cost} × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.product_id, -1)}
                          className="px-1.5 py-1 hover:bg-[#F3F4F6] text-[#4B5563]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-0.5 text-xs font-bold text-[#111827]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.product_id, 1)}
                          disabled={item.quantity >= item.product.current_stock}
                          className="px-1.5 py-1 hover:bg-[#F3F4F6] text-[#4B5563] disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-[#111827] min-w-[50px] text-right">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.product.product_id)}
                        className="text-rose-500 hover:text-rose-700 ml-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Customer & Payment Form Section */}
          <div className="pt-4 border-t border-[#E5E7EB] space-y-3.5 mt-auto">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm placeholder-[#9CA3AF] text-[#111827] focus:bg-white focus:outline-none focus:border-[#CBD5E1] transition-all"
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Customer Phone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm placeholder-[#9CA3AF] text-[#111827] focus:bg-white focus:outline-none focus:border-[#CBD5E1] transition-all"
              />
            </div>

            {/* Discount & Payment in one row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111827] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:border-[#CBD5E1] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Payment</label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="appearance-none w-full px-3.5 py-2.5 pr-8 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-[#CBD5E1] transition-all cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Card">Card</option>
                    <option value="Credit / Due">Credit / Due</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Subtotal & Total */}
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-sm text-[#64748B]">
                <span>Subtotal</span>
                <span className="font-medium text-[#111827]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-[#111827] pt-1">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="w-full py-3 px-4 bg-[#9D7BFA] hover:bg-[#8B68F5] active:bg-[#7A56E6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-2"
            >
              <CreditCard className="w-4 h-4 stroke-[2]" />
              <span>Complete Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 4. Recent Sales Section                                     */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs">
        <h2 className="text-base font-bold text-[#111827] mb-4">Recent Sales</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-[#E5E7EB] text-xs font-semibold text-[#64748B]">
              <tr>
                <th className="py-3 px-4 font-semibold">Bill #</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#9CA3AF]">
                    No recent sales recorded yet
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.billNumber} className="hover:bg-[#F9FAFB]/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                      {sale.billNumber}
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{sale.date}</td>
                    <td className="py-3.5 px-4 font-medium text-[#111827]">{sale.customer}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#F1F5F9] text-[#475569]">
                        {sale.payment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#111827]">
                      ₹{sale.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 5. "Which Products Will Be Needed?" (Simple Horizontal Bar)  */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#111827]">
              Which Products Will Be Needed?
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Estimated product demand for the next {forecastHorizon} days.
            </p>
          </div>

          {/* Horizon Selector (7 / 30 / 90 Days) */}
          <div className="flex items-center gap-2">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-1 rounded-xl flex items-center">
              {( [7, 30, 90] as HorizonDays[] ).map((h) => (
                <button
                  key={h}
                  type="button"
                  id={`horizon-toggle-${h}`}
                  onClick={() => setForecastHorizon(h)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    forecastHorizon === h
                      ? 'bg-white text-[#111827] shadow-2xs'
                      : 'text-[#64748B] hover:text-[#111827]'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        {forecastLoading ? (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-5 h-5 text-[#8B5CF6] animate-spin mb-2" />
            <p className="text-xs text-[#64748B]">Calculating projected demand...</p>
          </div>
        ) : topDemandProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9CA3AF] bg-[#F9FAFB] rounded-2xl border border-dashed border-[#E5E7EB]">
            <Package className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
            <p className="font-semibold text-[#111827]">Not enough sales history to forecast demand</p>
            <p className="mt-1">Complete sales transactions to build historical demand projections.</p>
          </div>
        ) : (
          <div className="pt-2">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topDemandProducts}
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
                    width={230}
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
                            <p className="text-purple-300">
                              Predicted Demand ({forecastHorizon}d): <strong>{item.predictedDemand} units</strong>
                            </p>
                            <p className="text-slate-300">
                              Current Stock: <strong>{item.currentStock} units</strong>
                            </p>
                            <p className={item.needsRestock ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                              Status: {item.needsRestock ? '⚠️ Restock Recommended' : '✅ Sufficient Stock'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="predictedDemand"
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
                    {topDemandProducts.map((entry, index) => (
                      <Cell
                        key={`bar-cell-${index}`}
                        fill={entry.needsRestock ? '#F43F5E' : '#8B5CF6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Simple Legend & Disclaimer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#F1F5F9] text-xs">
              <div className="flex items-center gap-4 text-xs font-medium text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#8B5CF6] inline-block" />
                  <span>Sufficient Stock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#F43F5E] inline-block" />
                  <span>Needs Restocking (Stock &lt; Predicted Demand)</span>
                </div>
              </div>

              <p className="text-[11px] text-[#9CA3AF]">
                * Predicted values are statistical estimates based on historical sales, not guaranteed figures.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;
