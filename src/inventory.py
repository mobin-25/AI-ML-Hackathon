"""
SmartStock AI - Inventory Intelligence & Risk Engine
Module: src.inventory

Provides:
- validate_inventory_data: Schema and value validation for inventory data.
- analyze_inventory_risk: Lead-time demand estimation, safety stock, stockout/overstock
                          risk detection, and non-negative reorder recommendations.
"""

from typing import Optional, List, Dict, Any
import numpy as np
import pandas as pd


REQUIRED_INVENTORY_COLUMNS = [
    "product_id",
    "product_name",
    "current_stock",
    "lead_time_days",
    "unit_cost"
]


def validate_inventory_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Validates and normalizes inventory records.

    Expected Schema:
        - product_id: Hashable identifier (string, int)
        - product_name: String descriptive title
        - current_stock: Non-negative numeric stock on hand
        - lead_time_days: Non-negative supplier replenishment lead time
        - unit_cost: Non-negative unit acquisition cost

    Returns:
        pd.DataFrame: Cleaned and normalized inventory DataFrame.

    Raises:
        ValueError: If required columns are missing, data is empty, or constraints are violated.
    """
    if df is None or not isinstance(df, pd.DataFrame):
        raise ValueError("Inventory data must be a valid pandas DataFrame.")

    if df.empty:
        raise ValueError("Inventory data is empty. At least one product is required.")

    missing_cols = [col for col in REQUIRED_INVENTORY_COLUMNS if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Inventory data missing required columns: {missing_cols}. Expected: {REQUIRED_INVENTORY_COLUMNS}")

    cleaned = df.copy()

    # Normalize identifiers and text
    if cleaned["product_id"].isna().any():
        raise ValueError("product_id contains null or NaN values in inventory data.")
    cleaned["product_id"] = cleaned["product_id"].astype(str).str.strip()
    if (cleaned["product_id"] == "").any():
        raise ValueError("product_id cannot contain empty strings.")

    cleaned["product_name"] = cleaned["product_name"].fillna("Unknown Product").astype(str).str.strip()

    # Validate current_stock
    cleaned["current_stock"] = pd.to_numeric(cleaned["current_stock"], errors="coerce")
    if cleaned["current_stock"].isna().any():
        raise ValueError("current_stock contains non-numeric or NaN values.")
    if (cleaned["current_stock"] < 0).any():
        neg_count = (cleaned["current_stock"] < 0).sum()
        raise ValueError(f"current_stock contains {neg_count} negative value(s). Stock on hand must be >= 0.")

    # Validate lead_time_days
    cleaned["lead_time_days"] = pd.to_numeric(cleaned["lead_time_days"], errors="coerce")
    if cleaned["lead_time_days"].isna().any():
        raise ValueError("lead_time_days contains non-numeric or NaN values.")
    if (cleaned["lead_time_days"] < 0).any():
        raise ValueError("lead_time_days cannot be negative.")

    # Validate unit_cost
    cleaned["unit_cost"] = pd.to_numeric(cleaned["unit_cost"], errors="coerce")
    if cleaned["unit_cost"].isna().any():
        raise ValueError("unit_cost contains non-numeric or NaN values.")
    if (cleaned["unit_cost"] < 0).any():
        raise ValueError("unit_cost cannot be negative.")

    return cleaned


def analyze_inventory_risk(
    inventory_df: pd.DataFrame,
    forecast_df: pd.DataFrame,
    service_level_factor: float = 1.65,
    overstock_buffer_days: int = 30,
    review_period_days: int = 7,
    incoming_stock_col: Optional[str] = None
) -> pd.DataFrame:
    """
    Performs stockout/overstock risk analysis and computes recommended reorder quantities.

    Logic & Formulas:
    1. Average Daily Demand (D_daily):
       Derived from the 7-day predicted demand forecast for each product.
    2. Lead-Time Demand (D_lead):
       D_lead = D_daily * lead_time_days
       The total expected demand consumed while waiting for supplier replenishment.
    3. Safety Stock Buffer (SS):
       SS = service_level_factor * sqrt(lead_time_days) * max(D_daily * 0.25, 1.0)
       Where service_level_factor defaults to 1.65 (standard normal Z for ~95% service level).
    4. Reorder Point (ROP):
       ROP = D_lead + SS
       If current_stock <= ROP, a replenishment order should be placed.
    5. Stockout Risk:
       - HIGH: current_stock < D_lead (stock will exhaust before delivery arrives).
       - MEDIUM: D_lead <= current_stock <= ROP (stock is within safety buffer).
       - LOW: current_stock > ROP.
    6. Overstock Risk:
       Days of Supply = current_stock / D_daily (if D_daily > 0).
       Flagged as True if Days of Supply > overstock_buffer_days (default: 30 days).
    7. Recommended Reorder Quantity (Q):
       Target Stock (Order-Up-To Level) = ROP + (D_daily * review_period_days)
       Available Stock = current_stock + incoming_stock
       Q = max(0.0, Target Stock - Available Stock) if current_stock <= ROP else 0.0
       Never negative.

    Parameters:
        inventory_df: Validated inventory DataFrame.
        forecast_df: 7-day forecast DataFrame with ['product_id', 'predicted_demand'].
        service_level_factor: Configurable Z-score buffer (default: 1.65 for 95% service level).
        overstock_buffer_days: Threshold days of supply to classify overstock (default: 30).
        review_period_days: Review cycle in days between order placements (default: 7).
        incoming_stock_col: Optional column name in inventory_df representing confirmed incoming POs.

    Returns:
        pd.DataFrame: Augmented inventory intelligence decision matrix.
    """
    inv_clean = validate_inventory_data(inventory_df)

    if forecast_df is None or not isinstance(forecast_df, pd.DataFrame):
        raise ValueError("forecast_df must be a valid pandas DataFrame.")

    # Calculate average daily demand per product from forecast
    fc = forecast_df.copy()
    if "product_id" not in fc.columns or "predicted_demand" not in fc.columns:
        raise ValueError("forecast_df must contain 'product_id' and 'predicted_demand' columns.")

    fc["product_id"] = fc["product_id"].astype(str).str.strip()
    fc["predicted_demand"] = pd.to_numeric(fc["predicted_demand"], errors="coerce").fillna(0.0)
    fc["predicted_demand"] = fc["predicted_demand"].clip(lower=0.0)

    daily_demand_map = fc.groupby("product_id")["predicted_demand"].mean().to_dict()

    results: List[Dict[str, Any]] = []

    for _, row in inv_clean.iterrows():
        p_id = str(row["product_id"])
        p_name = str(row["product_name"])
        stock = float(row["current_stock"])
        lead_time = float(row["lead_time_days"])
        cost = float(row["unit_cost"])

        incoming = 0.0
        if incoming_stock_col and incoming_stock_col in inv_clean.columns:
            incoming = max(0.0, float(pd.to_numeric(row[incoming_stock_col], errors="coerce") or 0.0))

        # 1. Daily forecast demand
        d_daily = max(0.0, float(daily_demand_map.get(p_id, 0.0)))

        # 2. Lead time demand
        d_lead = round(d_daily * lead_time, 2)

        # 3. Safety Stock: Z * sqrt(L) * demand buffer
        # In a deterministic 7-day hackathon baseline, we use standard 25% coefficient of variation
        # with a minimum 1.0 unit buffer when demand is non-zero.
        if d_daily > 0 and lead_time > 0:
            sigma_d = max(d_daily * 0.25, 0.5)
            safety_stock = round(service_level_factor * np.sqrt(lead_time) * sigma_d, 2)
        else:
            safety_stock = 0.0

        # 4. Reorder Point (ROP)
        reorder_point = round(d_lead + safety_stock, 2)

        # 5. Days of Supply
        if d_daily > 0:
            days_of_supply = round(stock / d_daily, 1)
        else:
            days_of_supply = 999.0 if stock > 0 else 0.0

        # 6. Risk classification
        if stock < d_lead:
            stockout_risk = "HIGH"
            risk_reason = (
                f"Critical: Current stock ({stock:.0f}) is below expected lead-time demand "
                f"({d_lead:.1f} units across {lead_time:.0f} days)."
            )
        elif stock <= reorder_point:
            stockout_risk = "MEDIUM"
            risk_reason = (
                f"Warning: Current stock ({stock:.0f}) is below reorder point ({reorder_point:.1f}); "
                f"consuming safety buffer."
            )
        else:
            stockout_risk = "LOW"
            risk_reason = "Healthy: Current stock comfortably satisfies lead-time demand and buffer."

        # Overstock check
        is_overstock = bool(days_of_supply > overstock_buffer_days and stock > 0)
        if is_overstock:
            if stockout_risk == "LOW":
                risk_reason = (
                    f"Overstock Alert: Estimated {days_of_supply:.0f} days of supply exceeds "
                    f"configured limit ({overstock_buffer_days} days)."
                )

        # 7. Recommended Reorder Quantity
        effective_stock = stock + incoming
        if stock <= reorder_point:
            target_stock = reorder_point + (d_daily * review_period_days)
            raw_reorder = target_stock - effective_stock
            reorder_qty = max(0.0, round(raw_reorder, 0))
        else:
            reorder_qty = 0.0

        # Reorder investment
        reorder_cost = round(reorder_qty * cost, 2)

        results.append({
            "product_id": p_id,
            "product_name": p_name,
            "current_stock": stock,
            "lead_time_days": lead_time,
            "unit_cost": cost,
            "avg_daily_demand": round(d_daily, 2),
            "lead_time_demand": d_lead,
            "safety_stock": safety_stock,
            "reorder_point": reorder_point,
            "days_of_supply": days_of_supply,
            "stockout_risk": stockout_risk,
            "overstock_risk": is_overstock,
            "recommended_reorder_qty": reorder_qty,
            "estimated_reorder_cost": reorder_cost,
            "risk_reason": risk_reason
        })

    return pd.DataFrame(results)
