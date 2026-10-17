import type { Product, SalesRecord, ForecastDemand, ModelEvaluation, ReorderRecommendation, PosProductDemandSummary } from '../types';

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

// Generate historical sales (up to 90 days), merged with completed POS sales
export function getDemoSalesHistory(days: number = 90): SalesRecord[] {
  const records: SalesRecord[] = [];
  const today = new Date();

  INITIAL_DEMO_PRODUCTS.forEach((prod) => {
    const base = prod.base_daily_sales || 5;
    for (let i = days; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const variation = Math.sin(i * 0.8) * (base * 0.25);
      const weekendBoost = isWeekend ? 1.25 : 1.0;
      const qty = Math.max(1, Math.round((base + variation) * weekendBoost));

      records.push({
        product_id: prod.product_id,
        date: d.toISOString().split('T')[0],
        quantity_sold: qty,
      });
    }
  });

  // Merge today's completed POS sales if any exist
  try {
    const posSalesJson = localStorage.getItem('smartstock_pos_sales_events');
    if (posSalesJson) {
      const posEvents = JSON.parse(posSalesJson);
      if (Array.isArray(posEvents)) {
        posEvents.forEach((ev: any) => {
          if (ev.product_id && ev.quantity && ev.date) {
            const existing = records.find(
              (r) => r.product_id === ev.product_id && r.date === ev.date
            );
            if (existing) {
              existing.quantity_sold += Number(ev.quantity);
            } else {
              records.push({
                product_id: ev.product_id,
                date: ev.date,
                quantity_sold: Number(ev.quantity),
              });
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not read pos sales events:', err);
  }

  return records;
}

// Generate Demand Forecast for specified horizon (7, 30, or 90 days)
// Implements moving-average baseline with weekend seasonality matching src/forecast.py
export function getDemoForecast(horizonDays: number = 7, products: Product[] = INITIAL_DEMO_PRODUCTS): ForecastDemand[] {
  const forecast: ForecastDemand[] = [];
  const today = new Date();
  const salesHistory = getDemoSalesHistory(60);

  products.forEach((prod) => {
    // Calculate moving average from recent 7 days of sales for this product
    const prodSales = salesHistory.filter((s) => s.product_id === prod.product_id);
    const recent7 = prodSales.slice(-7);
    const recentAvg =
      recent7.length > 0
        ? recent7.reduce((sum, s) => sum + s.quantity_sold, 0) / recent7.length
        : prod.base_daily_sales || 5;

    // Compute trend momentum (recent 7 vs previous 7)
    const prev7 = prodSales.slice(-14, -7);
    const prevAvg =
      prev7.length > 0
        ? prev7.reduce((sum, s) => sum + s.quantity_sold, 0) / prev7.length
        : recentAvg;
    const trendGrowth = prevAvg > 0 ? (recentAvg - prevAvg) / prevAvg : 0;
    const boundedGrowth = Math.max(-0.2, Math.min(0.2, trendGrowth));

    for (let day = 1; day <= horizonDays; day++) {
      const d = new Date(today);
      d.setDate(d.getDate() + day);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const dowMultiplier = isWeekend ? 1.25 : 1.0;

      // Realistic trend progression
      const timeTrend = 1.0 + (boundedGrowth * (day / horizonDays) * 0.5);
      const predicted = Math.max(1, Math.round(recentAvg * dowMultiplier * timeTrend));

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

/**
 * Calculates demand ranking and restocking metrics specifically for the POS & Forecasting views.
 * Restocking Formula:
 * Estimated shortage = max(0, forecast demand + safety stock - available stock - confirmed incoming stock)
 */
export function calculatePosDemandMetrics(
  horizonDays: number,
  products: Product[],
  salesHistory: SalesRecord[],
  forecasts: ForecastDemand[]
): PosProductDemandSummary[] {
  return products.map((prod) => {
    // 1. Units sold in the historical period matching horizon (e.g. past 7, 30, or 90 days)
    const prodSales = salesHistory.filter((s) => s.product_id === prod.product_id);
    const historicalSlice = prodSales.slice(-horizonDays);
    const units_sold_historical = historicalSlice.reduce((sum, s) => sum + s.quantity_sold, 0);

    // 2. Forecast demand over the selected future period
    const prodForecast = forecasts.filter((f) => f.product_id === prod.product_id);
    const forecast_demand = prodForecast.reduce((sum, f) => sum + f.predicted_demand, 0);

    // 3. Historical trend comparison (recent half vs prior half of the window)
    const half = Math.max(3, Math.floor(historicalSlice.length / 2));
    const recentHalf = historicalSlice.slice(-half);
    const priorHalf = historicalSlice.slice(-half * 2, -half);
    const recentSum = recentHalf.reduce((sum, s) => sum + s.quantity_sold, 0);
    const priorSum = priorHalf.reduce((sum, s) => sum + s.quantity_sold, 0);

    let demand_trend: 'Increasing' | 'Stable' | 'Decreasing' = 'Stable';
    if (priorSum > 0) {
      const growth = (recentSum - priorSum) / priorSum;
      if (growth > 0.08) demand_trend = 'Increasing';
      else if (growth < -0.08) demand_trend = 'Decreasing';
    }

    // 4. Daily burn rate and safety stock
    const dailyRate = forecast_demand / Math.max(1, horizonDays);
    const safety_stock = Math.round(dailyRate * Math.max(2, (prod.lead_time_days || 3) * 0.5));
    const confirmed_incoming = 0; // Baseline assumption: no active purchase orders logged

    // 5. Shortage calculation according to specification:
    // Estimated shortage = max(0, forecast demand + safety stock - available stock - confirmed incoming stock)
    const estimated_shortage = Math.max(0, forecast_demand + safety_stock - prod.current_stock - confirmed_incoming);
    const recommended_replenish = estimated_shortage;

    // 6. Recommended Action
    let recommended_action: 'Urgent Restock' | 'Restock Soon' | 'Sufficient Stock' | 'Hold Orders' = 'Sufficient Stock';
    if (prod.current_stock === 0 || prod.current_stock <= Math.round(dailyRate * (prod.lead_time_days || 2))) {
      recommended_action = 'Urgent Restock';
    } else if (estimated_shortage > 0) {
      recommended_action = 'Restock Soon';
    } else if (prod.current_stock > (forecast_demand + safety_stock) * 1.5) {
      recommended_action = 'Hold Orders';
    }

    return {
      product_id: prod.product_id,
      product_name: prod.product_name,
      category: prod.category || 'General',
      current_stock: prod.current_stock,
      units_sold_historical,
      forecast_demand,
      safety_stock,
      confirmed_incoming,
      estimated_shortage,
      recommended_replenish,
      demand_trend,
      recommended_action,
      lead_time_days: prod.lead_time_days || 3,
    };
  });
}

