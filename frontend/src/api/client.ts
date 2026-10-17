import axios from 'axios';
import type { Product, SalesRecord, ForecastDemand, ModelEvaluation, BackendStatus, ReorderRecommendation } from '../types';
import {
  INITIAL_DEMO_PRODUCTS,
  getDemoSalesHistory,
  getDemoForecast,
  enrichProductsWithMetrics,
  getDemoReorderRecommendations,
  DEMO_EVALUATION_METRICS,
} from './demoAdapter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory demo state for active session modifications
let sessionProducts: Product[] = [...INITIAL_DEMO_PRODUCTS];

export interface ApiResponse<T> {
  data: T;
  isDemo: boolean;
  message?: string;
}

/**
 * Checks if Mobin's FastAPI backend is live and responsive
 */
export async function checkBackendHealth(): Promise<BackendStatus> {
  try {
    const res = await api.get('/health', { timeout: 2000 });
    return {
      isLive: true,
      message: res.data?.status || 'FastAPI Backend Online',
      endpoint: API_BASE_URL,
      forecastModuleLoaded: res.data?.forecast_loaded ?? true,
      inventoryModuleLoaded: res.data?.inventory_loaded ?? true,
    };
  } catch {
    return {
      isLive: false,
      message: 'FastAPI Backend Offline (Running in Demo Adapter Mode)',
      endpoint: API_BASE_URL,
      forecastModuleLoaded: false,
      inventoryModuleLoaded: false,
    };
  }
}

/**
 * Fetch product inventory with inventory engineering metrics
 */
export async function getProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const res = await api.get('/api/inventory');
    if (Array.isArray(res.data)) {
      return { data: res.data, isDemo: false };
    }
  } catch {
    // Graceful fallback to demo adapter
  }
  const enriched = enrichProductsWithMetrics(sessionProducts);
  return {
    data: enriched,
    isDemo: true,
    message: 'Using calibrated demo inventory data',
  };
}

/**
 * Add a new product (handles both live backend and session demo)
 */
export async function createProduct(product: Omit<Product, 'stock_risk'>): Promise<ApiResponse<Product>> {
  try {
    const res = await api.post('/api/inventory', product);
    return { data: res.data, isDemo: false };
  } catch {
    const newProduct: Product = {
      ...product,
      category: product.category || 'General',
      base_daily_sales: 4.0,
    };
    sessionProducts = [newProduct, ...sessionProducts];
    const enriched = enrichProductsWithMetrics(sessionProducts);
    const created = enriched.find((p) => p.product_id === product.product_id) || newProduct;
    return {
      data: created,
      isDemo: true,
      message: 'Created in session demo memory (FastAPI backend offline)',
    };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(product: Product): Promise<ApiResponse<Product>> {
  try {
    const res = await api.put(`/api/inventory/${product.product_id}`, product);
    return { data: res.data, isDemo: false };
  } catch {
    sessionProducts = sessionProducts.map((p) => (p.product_id === product.product_id ? product : p));
    const enriched = enrichProductsWithMetrics(sessionProducts);
    const updated = enriched.find((p) => p.product_id === product.product_id) || product;
    return {
      data: updated,
      isDemo: true,
      message: 'Updated in session demo memory (FastAPI backend offline)',
    };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<ApiResponse<boolean>> {
  try {
    await api.delete(`/api/inventory/${productId}`);
    return { data: true, isDemo: false };
  } catch {
    sessionProducts = sessionProducts.filter((p) => p.product_id !== productId);
    return {
      data: true,
      isDemo: true,
      message: 'Removed from session demo memory (FastAPI backend offline)',
    };
  }
}

/**
 * Fetch 30-day historical sales records
 */
export async function getSalesHistory(): Promise<ApiResponse<SalesRecord[]>> {
  try {
    const res = await api.get('/api/sales');
    if (Array.isArray(res.data)) {
      return { data: res.data, isDemo: false };
    }
  } catch {
    // Demo fallback
  }
  return {
    data: getDemoSalesHistory(),
    isDemo: true,
    message: 'Using calibrated 30-day demo retail sales history',
  };
}

/**
 * Fetch 7-day AI demand forecast
 */
export async function get7DayForecast(): Promise<ApiResponse<ForecastDemand[]>> {
  try {
    const res = await api.get('/api/forecast');
    if (Array.isArray(res.data)) {
      return { data: res.data, isDemo: false };
    }
  } catch {
    // Demo fallback
  }
  return {
    data: getDemoForecast(),
    isDemo: true,
    message: 'Using calibrated 7-day baseline demand forecast',
  };
}

/**
 * Fetch reorder recommendations
 */
export async function getReorderRecommendations(): Promise<ApiResponse<ReorderRecommendation[]>> {
  try {
    const res = await api.get('/api/reorders');
    if (Array.isArray(res.data)) {
      return { data: res.data, isDemo: false };
    }
  } catch {
    // Demo fallback
  }
  return {
    data: getDemoReorderRecommendations(),
    isDemo: true,
    message: 'Using dynamic demo replenishment calculations',
  };
}

/**
 * Fetch model evaluations (MAE, RMSE)
 */
export async function getModelEvaluations(): Promise<ApiResponse<ModelEvaluation[]>> {
  try {
    const res = await api.get('/api/evaluation');
    if (Array.isArray(res.data)) {
      return { data: res.data, isDemo: false };
    }
  } catch {
    // Demo fallback
  }
  return {
    data: DEMO_EVALUATION_METRICS,
    isDemo: true,
    message: 'Showing calibrated offline model benchmarks',
  };
}

/**
 * Upload CSV file for inventory or sales
 */
export async function uploadCsvFile(file: File, type: 'inventory' | 'sales'): Promise<ApiResponse<{ processed: number; message: string }>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data, isDemo: false };
  } catch {
    return {
      data: {
        processed: 10,
        message: `Parsed ${file.name} successfully (demo validation mode). Live FastAPI ingestion pending backend deployment.`,
      },
      isDemo: true,
    };
  }
}
