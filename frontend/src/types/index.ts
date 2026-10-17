export type StockRiskLevel = 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'OVERSTOCKED';

export interface Product {
  product_id: string;
  product_name: string;
  current_stock: number;
  lead_time_days: number;
  unit_cost: number;
  category?: string;
  base_daily_sales?: number;
  // Computed metrics
  forecast_7d_demand?: number;
  daily_demand_rate?: number;
  days_of_supply?: number;
  lead_time_demand?: number;
  safety_stock?: number;
  reorder_point?: number;
  recommended_reorder_qty?: number;
  inventory_value?: number;
  stock_risk?: string;
  risk_reason?: string;
  severity_rank?: number;
}

export interface SalesRecord {
  product_id: string;
  date: string;
  quantity_sold: number;
}

export interface ForecastDemand {
  product_id: string;
  date: string;
  predicted_demand: number;
}

export interface ModelEvaluation {
  product_id: string;
  mae: number;
  rmse: number;
  r2_score?: number;
  model_type: string;
}

export interface BackendStatus {
  isLive: boolean;
  message: string;
  endpoint: string;
  forecastModuleLoaded?: boolean;
  inventoryModuleLoaded?: boolean;
}

export interface ReorderRecommendation {
  product_id: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  recommended_reorder_qty: number;
  unit_cost: number;
  total_order_cost: number;
  lead_time_days: number;
  days_of_supply: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  subject: string;
  message: string;
}

export interface PosProductDemandSummary {
  product_id: string;
  product_name: string;
  category: string;
  current_stock: number;
  units_sold_historical: number;
  forecast_demand: number;
  safety_stock: number;
  confirmed_incoming: number;
  estimated_shortage: number;
  recommended_replenish: number;
  demand_trend: 'Increasing' | 'Stable' | 'Decreasing';
  recommended_action: 'Urgent Restock' | 'Restock Soon' | 'Sufficient Stock' | 'Hold Orders';
  lead_time_days: number;
}

