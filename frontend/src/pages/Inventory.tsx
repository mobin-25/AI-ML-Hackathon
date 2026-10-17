import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Barcode,
  Scan,
  FileText,
  Package,
  Filter,
  AlertTriangle,
  IndianRupee,
  Download,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/client';
import type { Product } from '../types';

export const Inventory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedBrand, setSelectedBrand] = useState<string>('All Brands');

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Action Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeScanModal, setActiveScanModal] = useState<'barcode' | 'product_scan' | 'invoice_scan' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    category: 'Electronics & Mobile',
    brand: 'SmartStock',
    current_stock: 25,
    lead_time_days: 5,
    unit_cost: 450,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  // Dynamic Summary Metrics
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.current_stock || 0), 0);
  const lowStockCount = products.filter(
    (p) => p.current_stock <= (p.reorder_point || 5)
  ).length;
  const totalStockValue = products.reduce(
    (acc, p) => acc + (p.inventory_value || (p.current_stock || 0) * (p.unit_cost || 0)),
    0
  );

  // Categories and Brands lists
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All Categories', ...Array.from(set)];
  }, [products]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const b = (p as any).brand || p.product_name.split(' ')[0];
      if (b) set.add(b);
    });
    return ['All Brands', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const brand = ((p as any).brand || p.product_name.split(' ')[0] || '').toLowerCase();
      const matchesSearch =
        !q ||
        p.product_name.toLowerCase().includes(q) ||
        p.product_id.toLowerCase().includes(q) ||
        brand.includes(q);

      const matchesCategory =
        selectedCategory === 'All Categories' || p.category === selectedCategory;

      const matchesBrand =
        selectedBrand === 'All Brands' ||
        brand === selectedBrand.toLowerCase();

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand]);

  // Paginated Products
  const totalFiltered = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = totalFiltered === 0 ? 0 : Math.min(startIndex + pageSize, totalFiltered);
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      product_id: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      product_name: '',
      category: 'Electronics & Mobile',
      brand: 'SmartStock',
      current_stock: 25,
      lead_time_days: 5,
      unit_cost: 450,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      product_id: p.product_id,
      product_name: p.product_name,
      category: p.category || 'Electronics & Mobile',
      brand: (p as any).brand || p.product_name.split(' ')[0] || 'SmartStock',
      current_stock: p.current_stock,
      lead_time_days: p.lead_time_days,
      unit_cost: p.unit_cost,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name.trim()) {
      setFormError('Product name cannot be empty.');
      return;
    }
    if (formData.current_stock < 0 || formData.unit_cost < 0) {
      setFormError('Stock count and unit cost must be non-negative.');
      return;
    }

    try {
      if (editingProduct) {
        const res = await updateProduct({
          ...editingProduct,
          product_name: formData.product_name,
          category: formData.category,
          current_stock: Number(formData.current_stock),
          lead_time_days: Number(formData.lead_time_days),
          unit_cost: Number(formData.unit_cost),
        });
        setNotification({ message: `Updated ${res.data.product_name} successfully!`, type: 'success' });
      } else {
        const res = await createProduct({
          product_id: formData.product_id,
          product_name: formData.product_name,
          category: formData.category,
          current_stock: Number(formData.current_stock),
          lead_time_days: Number(formData.lead_time_days),
          unit_cost: Number(formData.unit_cost),
          reorder_point: 5,
        });
        setNotification({ message: `Added ${res.data.product_name} to catalog!`, type: 'success' });
      }
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Error saving product.');
    }
  };

  const handleDelete = async (productId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name} (${productId})?`)) return;
    try {
      await deleteProduct(productId);
      setNotification({ message: `Removed ${name} from inventory.`, type: 'success' });
      fetchProducts();
    } catch {
      setNotification({ message: 'Failed to delete product', type: 'error' });
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      alert('Catalog is currently empty. Add products before exporting.');
      return;
    }
    const headers = ['Product ID,Product Name,Category,Current Stock,Unit Cost,Status'];
    const rows = products.map(
      (p) =>
        `"${p.product_id}","${p.product_name}","${p.category || 'General'}",${p.current_stock},${p.unit_cost},"${p.stock_risk || 'HEALTHY'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'smartstock_inventory_catalog.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto bg-[#F5F7FB] min-h-screen text-[#191919]">
      {/* ========================================================= */}
      {/* 1. Page Header                                             */}
      {/* ========================================================= */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191919] tracking-tight">
          Products / Inventory
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          Manage your product catalog
        </p>
      </div>

      {/* ========================================================= */}
      {/* 2. Action Buttons (One Horizontal Row)                    */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#6125E8] hover:bg-[#521cc9] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Stock</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScanModal('barcode')}
          className="px-4 py-2.5 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-semibold text-[#191919] flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
        >
          <Barcode className="w-4 h-4 text-[#64748B]" />
          <span>Barcode Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScanModal('product_scan')}
          className="px-4 py-2.5 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-semibold text-[#191919] flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
        >
          <Scan className="w-4 h-4 text-[#64748B]" />
          <span>Product Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScanModal('invoice_scan')}
          className="px-4 py-2.5 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-semibold text-[#191919] flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4 text-[#64748B]" />
          <span>Scan Invoice</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. Summary Cards (Four Equal-Width Cards in a Single Row) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Products */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F3EEFF] text-[#6125E8] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-xs font-medium text-[#64748B]">Total Products</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#191919] mt-0.5 leading-tight">
              {totalProducts}
            </div>
          </div>
        </div>

        {/* Card 2: Stock Units */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF4EE] text-[#FF642D] flex items-center justify-center shrink-0">
            <Filter className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-xs font-medium text-[#64748B]">Stock Units</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#191919] mt-0.5 leading-tight">
              {totalStockUnits}
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-xs font-medium text-[#64748B]">Low Stock</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#191919] mt-0.5 leading-tight">
              {lowStockCount}
            </div>
          </div>
        </div>

        {/* Card 4: Stock Value */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F3EEFF] text-[#6125E8] flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-xs font-medium text-[#64748B]">Stock Value</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#191919] mt-0.5 leading-tight">
              ₹{totalStockValue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. Product Catalog Card                                    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        {/* Card Header: Product Catalog & Export All */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#191919]">
            Product Catalog
          </h2>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#191919] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Export All</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="px-5 sm:px-6 pb-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, brand, or barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#191919] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6125E8]/20 focus:border-[#CBD5E1] transition-all"
            />
          </div>
        </div>

        {/* Filter Dropdowns (Below search field, aligned left) */}
        <div className="px-5 sm:px-6 pb-5 flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3.5 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#191919] focus:outline-none focus:border-[#6125E8] cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3.5 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#191919] focus:outline-none focus:border-[#6125E8] cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Content: Empty State OR Products Table */}
        {totalFiltered === 0 ? (
          <div className="py-20 sm:py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="text-[#9CA3AF] mb-3">
              <Package className="w-14 h-14 stroke-[1.4]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#191919] mb-1">
              No products found
            </h3>
            <p className="text-xs sm:text-sm text-[#667085]">
              Start by adding your first product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-[#F1F5F9]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="py-3 px-6">SKU ID</th>
                  <th className="py-3 px-6">Product Title</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Current Stock</th>
                  <th className="py-3 px-6">Unit Cost</th>
                  <th className="py-3 px-6">Health Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {paginatedProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#191919]">
                      {p.product_id}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-[#191919]">{p.product_name}</div>
                      <div className="text-[11px] text-[#9CA3AF]">
                        Brand: {(p as any).brand || p.product_name.split(' ')[0]}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-[#64748B]">{p.category || 'General'}</td>
                    <td className="py-3.5 px-6 font-bold text-[#191919]">
                      {p.current_stock} pcs
                    </td>
                    <td className="py-3.5 px-6 font-medium text-[#191919]">
                      ₹{p.unit_cost.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          p.stock_risk === 'CRITICAL' || p.current_stock === 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : p.stock_risk === 'WARNING' || p.current_stock <= 5
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : p.stock_risk === 'OVERSTOCKED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.stock_risk || (p.current_stock > 5 ? 'HEALTHY' : 'Low Stock')}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-[#64748B] hover:text-[#6125E8] hover:bg-[#F3EEFF] rounded-lg transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.product_id, p.product_name)}
                          className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. Pagination Footer (Screenshot 2 Match)                 */}
        {/* ========================================================= */}
        <div className="p-4 sm:px-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          {/* Left: Showing 1–0 of 0 [ 20 v ] per page */}
          <div className="flex items-center gap-2">
            <span>
              Showing {totalFiltered === 0 ? '1–0' : `${startIndex + 1}–${endIndex}`} of {totalFiltered}
            </span>
            <div className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none pl-2.5 pr-7 py-1 bg-[#F4F6F9] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#191919] focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2 pointer-events-none" />
            </div>
            <span>per page</span>
          </div>

          {/* Right: Prev Arrow, Active Page Number, Next Arrow */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1 || totalFiltered === 0}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-xl border border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#191919] hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="w-7 h-7 rounded-xl bg-[#6125E8] text-white font-bold text-xs flex items-center justify-center select-none shadow-xs">
              {currentPage}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || totalFiltered === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 rounded-xl border border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#191919] hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. Action Modals                                          */}
      {/* ========================================================= */}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#E5E7EB] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-lg font-bold text-[#191919]">
                {editingProduct ? 'Edit Product Details' : 'Add New Inventory SKU'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Product ID / SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.product_id}
                    disabled={!!editingProduct}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] disabled:opacity-60 text-[#191919] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-[#191919] focus:outline-none"
                  >
                    <option value="Electronics & Mobile">Electronics & Mobile</option>
                    <option value="Kirana & Supermarket">Kirana & Supermarket</option>
                    <option value="Hardware & Tools">Hardware & Tools</option>
                    <option value="Automotive Spare Parts">Automotive Spare Parts</option>
                    <option value="Pantry & Provisions">Pantry & Provisions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name / Title *
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-[#191919] focus:outline-none"
                  placeholder="e.g. Type-C Fast Cable 1.5m"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Units in Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-[#191919] focus:outline-none"
                    min={0}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-[#191919] focus:outline-none"
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unit Cost (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-[#191919] focus:outline-none"
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6125E8] hover:bg-[#521cc9] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {activeScanModal === 'barcode' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919]">Barcode Scanner</h3>
              <button
                type="button"
                onClick={() => setActiveScanModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-44 bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white p-4 relative overflow-hidden mb-4">
              <div className="w-48 h-24 border-2 border-[#6125E8] rounded-lg relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#6125E8] animate-pulse" />
              </div>
              <span className="text-[11px] text-gray-400 mt-3">Position barcode inside camera viewfinder</span>
            </div>
            <p className="text-xs text-[#667085] mb-4">
              Camera scanner ready. Compatible with EAN-13, UPC, Code 128, and QR codes.
            </p>
            <button
              type="button"
              onClick={() => {
                alert('Barcode EAN-890123456789 scanned successfully!');
                setActiveScanModal(null);
              }}
              className="w-full py-2.5 bg-[#6125E8] hover:bg-[#521cc9] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Simulate Barcode Capture
            </button>
          </div>
        </div>
      )}

      {/* Product Scan Modal */}
      {activeScanModal === 'product_scan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919]">AI Product Recognition</h3>
              <button
                type="button"
                onClick={() => setActiveScanModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 mb-4 hover:border-[#6125E8] transition-colors cursor-pointer">
              <Scan className="w-10 h-10 text-[#6125E8] mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-800">Snap or drag product photo</p>
              <p className="text-[11px] text-gray-500 mt-1">AI identifies product shape, brand logo & text</p>
            </div>
            <button
              type="button"
              onClick={() => {
                alert('AI Vision Scanner: Identified 65W Fast Charger (Confidence: 97%)');
                setActiveScanModal(null);
              }}
              className="w-full py-2.5 bg-[#6125E8] hover:bg-[#521cc9] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Run AI Recognition
            </button>
          </div>
        </div>
      )}

      {/* Scan Invoice Modal */}
      {activeScanModal === 'invoice_scan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919]">Invoice OCR Ingestion</h3>
              <button
                type="button"
                onClick={() => setActiveScanModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 mb-4 hover:border-[#6125E8] transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-[#6125E8] mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-800">Upload purchase bill / invoice (PDF or Image)</p>
              <p className="text-[11px] text-gray-500 mt-1">Extracts supplier name, line items & taxes</p>
            </div>
            <button
              type="button"
              onClick={() => {
                alert('Invoice OCR parsed: 3 line items detected and ready for stock update.');
                setActiveScanModal(null);
              }}
              className="w-full py-2.5 bg-[#6125E8] hover:bg-[#521cc9] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Parse Invoice Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
