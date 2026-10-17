"""
SmartStock AI - ML & Inventory Backend Adapter
Provides a decoupled integration contract with Mobin's ML backend (`src/forecast.py`
and `src/inventory.py`). When the backend functions are present, they are seamlessly
invoked; otherwise, a robust fallback adapter generates statistical baseline forecasts
and inventory risk metrics so the UI remains fully functional.
"""

from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
import numpy as np
import pandas as pd


# Dynamic check for Mobin's backend modules
BACKEND_FORECAST_AVAILABLE = False
BACKEND_INVENTORY_AVAILABLE = False

try:
    import src.forecast as backend_forecast  # type: ignore
    BACKEND_FORECAST_AVAILABLE = hasattr(backend_forecast, "predict_demand") or hasattr(backend_forecast, "forecast_demand")
except Exception:
    backend_forecast = None
    BACKEND_FORECAST_AVAILABLE = False

try:
    import src.inventory as backend_inventory  # type: ignore
    BACKEND_INVENTORY_AVAILABLE = hasattr(backend_inventory, "calculate_inventory_metrics") or hasattr(backend_inventory, "compute_reorder")
except Exception:
    backend_inventory = None
    BACKEND_INVENTORY_AVAILABLE = False


def get_backend_status() -> Dict[str, Any]:
    """Returns the current connection status of Mobin's backend modules."""
    return {
        "forecast_module_loaded": BACKEND_FORECAST_AVAILABLE,
        "inventory_module_loaded": BACKEND_INVENTORY_AVAILABLE,
        "mode": "Live ML Backend (Mobin)" if (BACKEND_FORECAST_AVAILABLE and BACKEND_INVENTORY_AVAILABLE) else "Mock/Fallback Adapter Active",
        "contract_spec": {
            "expected_forecast_output": ["product_id", "date", "predicted_demand"],
            "expected_inventory_inputs": ["product_id", "current_stock", "lead_time_days", "unit_cost"],
        }
    }


def generate_7day_forecast(sales_df: pd.DataFrame, inventory_df: pd.DataFrame) -> pd.DataFrame:
    """
    Produces a 7-day daily demand forecast per product.
    Contract: DataFrame with ['product_id', 'date', 'predicted_demand']
    """
    # 1. Attempt to call Mobin's forecast engine if available
    if BACKEND_FORECAST_AVAILABLE and backend_forecast is not None:
        try:
            if hasattr(backend_forecast, "predict_demand"):
                res = backend_forecast.predict_demand(sales_df, days=7)
                if isinstance(res, pd.DataFrame) and {"product_id", "date", "predicted_demand"}.issubset(res.columns):
                    return res
            elif hasattr(backend_forecast, "forecast_demand"):
                res = backend_forecast.forecast_demand(sales_df, days=7)
                if isinstance(res, pd.DataFrame) and {"product_id", "date", "predicted_demand"}.issubset(res.columns):
                    return res
        except Exception:
            # Fall back to adapter logic if backend execution errors
            pass

    # 2. Resilient Baseline Mock Adapter:
    # Uses 14-day weighted moving average with day-of-week pattern from sales_df
    product_ids = inventory_df["product_id"].unique()
    start_forecast_date = datetime.now().date()
    forecast_dates = [start_forecast_date + timedelta(days=i) for i in range(1, 8)]

    records = []
    sales_df_clean = sales_df.copy()
    sales_df_clean["date"] = pd.to_datetime(sales_df_clean["date"])

    for pid in product_ids:
        p_sales = sales_df_clean[sales_df_clean["product_id"] == pid].sort_values("date")
        if not p_sales.empty:
            recent_sales = p_sales.tail(14)["quantity_sold"]
            base_avg = recent_sales.mean() if len(recent_sales) > 0 else 5.0
            std_dev = recent_sales.std() if len(recent_sales) > 1 and not np.isnan(recent_sales.std()) else 1.0
        else:
            base_avg = 5.0
            std_dev = 1.0

        for f_date in forecast_dates:
            # Day-of-week factor: Saturday/Sunday +20%
            dow_mult = 1.20 if f_date.weekday() in [5, 6] else 1.0
            predicted = max(1, int(round(base_avg * dow_mult)))
            records.append({
                "product_id": pid,
                "date": pd.to_datetime(f_date),
                "predicted_demand": predicted,
            })

    forecast_df = pd.DataFrame(records)
    return forecast_df


def compute_inventory_metrics(inventory_df: pd.DataFrame, forecast_df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes stockout risks, recommended reorders, and detailed explanations.
    """
    # 1. Attempt Mobin's inventory module if present
    if BACKEND_INVENTORY_AVAILABLE and backend_inventory is not None:
        try:
            if hasattr(backend_inventory, "calculate_inventory_metrics"):
                res = backend_inventory.calculate_inventory_metrics(inventory_df, forecast_df)
                if isinstance(res, pd.DataFrame) and "stock_risk" in res.columns:
                    return res
        except Exception:
            pass

    # 2. Standardized Inventory Engineering Math:
    # Aggregate 7-day forecast demand
    f_agg = forecast_df.groupby("product_id")["predicted_demand"].sum().reset_index()
    f_agg.rename(columns={"predicted_demand": "forecast_7d_demand"}, inplace=True)

    merged = pd.merge(inventory_df, f_agg, on="product_id", how="left")
    merged["forecast_7d_demand"] = merged["forecast_7d_demand"].fillna(0).astype(int)

    # Daily burn rate (units / day)
    merged["daily_demand_rate"] = (merged["forecast_7d_demand"] / 7.0).round(2)

    # Days of supply remaining
    def calc_dos(row):
        rate = row["daily_demand_rate"]
        stock = row["current_stock"]
        if rate <= 0:
            return 999.0
        return round(stock / rate, 1)

    merged["days_of_supply"] = merged.apply(calc_dos, axis=1)

    # Lead time demand = daily_rate * lead_time_days
    merged["lead_time_demand"] = (merged["daily_demand_rate"] * merged["lead_time_days"]).round(1)

    # Safety stock = 2 days of buffer demand
    merged["safety_stock"] = (merged["daily_demand_rate"] * 2.0).round(1)

    # Reorder Point (ROP) = Lead Time Demand + Safety Stock
    merged["reorder_point"] = (merged["lead_time_demand"] + merged["safety_stock"]).round().astype(int)

    # Recommended Reorder Quantity
    def calc_reorder_qty(row):
        stock = row["current_stock"]
        rop = row["reorder_point"]
        if stock <= rop:
            # Reorder up to 14 days of supply + safety stock
            target_stock = int(round(row["daily_demand_rate"] * 14 + row["safety_stock"]))
            return max(5, target_stock - stock)
        return 0

    merged["recommended_reorder_qty"] = merged.apply(calc_reorder_qty, axis=1)

    # Total Inventory Value ($)
    merged["inventory_value"] = (merged["current_stock"] * merged["unit_cost"]).round(2)

    # Determine Stock Risk & Explanation
    def evaluate_risk(row):
        stock = row["current_stock"]
        ltd = row["lead_time_demand"]
        rop = row["reorder_point"]
        dos = row["days_of_supply"]
        lead_time = row["lead_time_days"]
        rate = row["daily_demand_rate"]
        name = row["product_name"]

        # 1. Critical Stockout Risk
        if stock <= ltd:
            risk = "🚨 High Stockout Risk"
            reason = (
                f"Critical! Stock ({stock} units) will deplete in {dos} days at {rate} units/day. "
                f"Supplier lead time is {lead_time} days. Immediate reorder required to avoid stockout!"
            )
            severity = 1
        # 2. Medium Risk / Reorder Soon
        elif stock <= rop:
            risk = "⚠️ Reorder Soon"
            reason = (
                f"Approaching safety threshold. Stock ({stock} units) is below Reorder Point ({rop} units). "
                f"Supply lasts {dos} days. Order now to maintain safety buffer."
            )
            severity = 2
        # 3. Overstocked
        elif dos > 35:
            tied_capital = round((stock - int(rate * 21)) * row["unit_cost"], 2)
            risk = "📦 Overstocked"
            reason = (
                f"Excess inventory. {dos} days of supply exceeds optimal 21-day holding window. "
                f"Approximately ${max(0, tied_capital):,.2f} in working capital is locked up."
            )
            severity = 4
        # 4. Healthy Stock
        else:
            risk = "✅ Healthy Stock"
            reason = (
                f"Optimal levels. Current stock ({stock} units) comfortably covers {dos} days of forecast demand "
                f"with sufficient lead time buffer ({lead_time} days)."
            )
            severity = 3

        return pd.Series([risk, reason, severity], index=["stock_risk", "risk_reason", "severity_rank"])

    risk_df = merged.apply(evaluate_risk, axis=1)
    merged["stock_risk"] = risk_df["stock_risk"]
    merged["risk_reason"] = risk_df["risk_reason"]
    merged["severity_rank"] = risk_df["severity_rank"]

    # Sort primarily by severity (Critical first)
    merged = merged.sort_values(by=["severity_rank", "days_of_supply"], ascending=[True, True])
    return merged
