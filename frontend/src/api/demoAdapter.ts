import type { Product, SalesRecord, ForecastDemand, ModelEvaluation, ReorderRecommendation } from '../types';

export const INITIAL_DEMO_PRODUCTS: Product[] = [
  {
    product_id: "SKU-101",
    product_name: "Ergonomic Mechanical Keyboard",
    current_stock: 14,
    lead_time_days: 7,
    unit_cost: 65.00,
    category: "Electronics",
    base_daily_sales: 5.2,
  },
  {
    product_id: "SKU-102",
    product_name: "USB-C Dual 4K Docking Station",
    current_stock: 8,
    lead_time_days: 10,
    unit_cost: 89.50,
    category: "Electronics",
    base_daily_sales: 3.8,
  },
  {
    product_id: "SKU-103",
    product_name: "Ultra-Fast Wireless Charger 15W",
    current_stock: 32,
    lead_time_days: 5,
    unit_cost: 18.00,
    category: "Accessories",
    base_daily_sales: 6.5,
  },
  {
    product_id: "SKU-104",
    product_name: "Active Noise-Cancelling Headphones",
    current_stock: 58,
    lead_time_days: 6,
    unit_cost: 120.00,
    category: "Audio",
    base_daily_sales: 4.1,
  },
  {
    product_id: "SKU-105",
    product_name: "Artisan Colombian Coffee Beans 1kg",
    current_stock: 19,
    lead_time_days: 4,
    unit_cost: 14.50,
    category: "Pantry",
    base_daily_sales: 8.0,
  },
  {
    product_id: "SKU-106",
    product_name: "Ceramic Thermal Tumbler 500ml",
    current_stock: 95,
    lead_time_days: 5,
    unit_cost: 12.00,
    category: "Lifestyle",
    base_daily_sales: 4.5,
  },
  {
    product_id: "SKU-107",
    product_name: "Organic Japanese Matcha Powder 100g",
    current_stock: 70,
    lead_time_days: 8,
    unit_cost: 22.00,
    category: "Pantry",
    base_daily_sales: 3.2,
  },
  {
    product_id: "SKU-108",
    product_name: "Aluminum Ergonomic Laptop Stand",
    current_stock: 390,
    lead_time_days: 5,
    unit_cost: 28.00,
    category: "Office",
    base_daily_sales: 4.0,
  },
  {
    product_id: "SKU-109",
    product_name: "1080p Ultra-Clear Webcam Pro",
    current_stock: 5,
    lead_time_days: 5,
    unit_cost: 45.00,
    category: "Electronics",
    base_daily_sales: 4.2,
  },
  {
    product_id: "SKU-110",
    product_name: "Braided Nylon USB-C Cable (2m)",
    current_stock: 550,
    lead_time_days: 3,
    unit_cost: 4.50,
    category: "Accessories",
    base_daily_sales: 12.0,
  },
];

// Generate synthetic historical sales (last 30 days)
export function getDemoSalesHistory(): SalesRecord[] {
  const records: SalesRecord[] = [];
  const today = new Date();

  INITIAL_DEMO_PRODUCTS.forEach((prod) => {
    const base = prod.base_daily_sales || 5;
    for (let i = 30; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const variation = (Math.sin(i * 1.5) * 1.8);
      const weekendBoost = isWeekend ? 1.25 : 1.0;
      const qty = Math.max(1, Math.round((base + variation) * weekendBoost));
      
      records.push({
        product_id: prod.product_id,
        date: d.toISOString().split('T')[0],
        quantity_sold: qty,
      });
    }
  });

  return records;
}

// Generate 7-Day Demand Forecast
export function getDemoForecast(): ForecastDemand[] {
  const forecast: ForecastDemand[] = [];
  const today = new Date();

  INITIAL_DEMO_PRODUCTS.forEach((prod) => {
    const base = prod.base_daily_sales || 5;
    for (let day = 1; day <= 7; day++) {
      const d = new Date(today);
      d.setDate(d.getDate() + day);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const dowMultiplier = isWeekend ? 1.2 : 1.0;
      const predicted = Math.max(1, Math.round(base * dowMultiplier));

      forecast.push({
        product_id: prod.product_id,
        date: d.toISOString().split('T')[0],
        predicted_demand: predicted,
      });
    }
  });

  return forecast;
}

// Compute inventory metrics matching src/ml_adapter.py logic
export function enrichProductsWithMetrics(products: Product[]): Product[] {
  const forecast = getDemoForecast();

  return products.map((prod) => {
    const pForecast = forecast.filter((f) => f.product_id === prod.product_id);
    const forecast_7d = pForecast.reduce((sum, f) => sum + f.predicted_demand, 0);
    const daily_rate = Number((forecast_7d / 7.0).toFixed(2));
    const days_of_supply = daily_rate > 0 ? Number((prod.current_stock / daily_rate).toFixed(1)) : 999.0;
    const lead_time_demand = Number((daily_rate * prod.lead_time_days).toFixed(1));
    const safety_stock = Number((daily_rate * 2.0).toFixed(1));
    const reorder_point = Math.round(lead_time_demand + safety_stock);
    const inventory_value = Number((prod.current_stock * prod.unit_cost).toFixed(2));

    let recommended_reorder_qty = 0;
    if (prod.current_stock <= reorder_point) {
      const target_stock = Math.round(daily_rate * 14 + safety_stock);
      recommended_reorder_qty = Math.max(5, target_stock - prod.current_stock);
    }

    let stock_risk = '✅ Healthy Stock';
    let risk_reason = `Optimal inventory. Stock covers ${days_of_supply} days of forecasted demand with a ${prod.lead_time_days}-day lead time buffer.`;
    let severity_rank = 3;

    if (prod.current_stock <= lead_time_demand) {
      stock_risk = '🚨 High Stockout Risk';
      risk_reason = `Critical! Stock (${prod.current_stock} units) will deplete in ${days_of_supply} days. Supplier lead time is ${prod.lead_time_days} days. Order urgently!`;
      severity_rank = 1;
    } else if (prod.current_stock <= reorder_point) {
      stock_risk = '⚠️ Reorder Soon';
      risk_reason = `Approaching threshold. Stock is below Reorder Point (${reorder_point} units). Buffer lasts ${days_of_supply} days.`;
      severity_rank = 2;
    } else if (days_of_supply > 35) {
      const tiedCapital = Math.max(0, (prod.current_stock - Math.round(daily_rate * 21)) * prod.unit_cost);
      stock_risk = '📦 Overstocked';
      risk_reason = `Excess holding. ${days_of_supply} days of supply exceeds 21-day holding window. ~$${tiedCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })} tied up.`;
      severity_rank = 4;
    }

    return {
      ...prod,
      forecast_7d_demand: forecast_7d,
      daily_demand_rate: daily_rate,
      days_of_supply,
      lead_time_demand,
      safety_stock,
      reorder_point,
      recommended_reorder_qty,
      inventory_value,
      stock_risk,
      risk_reason,
      severity_rank,
    };
  }).sort((a, b) => (a.severity_rank || 99) - (b.severity_rank || 99));
}

export function getDemoReorderRecommendations(): ReorderRecommendation[] {
  const enriched = enrichProductsWithMetrics(INITIAL_DEMO_PRODUCTS);
  return enriched
    .filter((p) => (p.recommended_reorder_qty || 0) > 0)
    .map((p) => {
      const qty = p.recommended_reorder_qty || 0;
      const urgency: 'HIGH' | 'MEDIUM' | 'LOW' = p.severity_rank === 1 ? 'HIGH' : 'MEDIUM';
      return {
        product_id: p.product_id,
        product_name: p.product_name,
        current_stock: p.current_stock,
        reorder_point: p.reorder_point || 0,
        recommended_reorder_qty: qty,
        unit_cost: p.unit_cost,
        total_order_cost: Number((qty * p.unit_cost).toFixed(2)),
        lead_time_days: p.lead_time_days,
        days_of_supply: p.days_of_supply || 0,
        urgency,
        reason: p.risk_reason || 'Reorder needed to maintain safety buffer.',
      };
    });
}

export const DEMO_EVALUATION_METRICS: ModelEvaluation[] = [
  {
    product_id: "SKU-101",
    mae: 0.84,
    rmse: 1.12,
    r2_score: 0.91,
    model_type: "Ridge + DOW Harmonic Regression",
  },
  {
    product_id: "SKU-102",
    mae: 0.62,
    rmse: 0.88,
    r2_score: 0.89,
    model_type: "Ridge + DOW Harmonic Regression",
  },
  {
    product_id: "SKU-105",
    mae: 1.05,
    rmse: 1.41,
    r2_score: 0.93,
    model_type: "Exponential Smoothing (Holt-Winters)",
  },
  {
    product_id: "SKU-109",
    mae: 0.73,
    rmse: 0.95,
    r2_score: 0.88,
    model_type: "Ridge + DOW Harmonic Regression",
  },
];
