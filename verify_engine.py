"""
SmartStock AI - Demo & Verification Runner
Run this script to verify the backend forecasting and inventory intelligence engine.
Usage:
    python verify_engine.py
"""

import sys
import pandas as pd
from datetime import datetime, timedelta

from src.forecast import validate_sales_data, forecast_demand_7days, evaluate_forecast
from src.inventory import validate_inventory_data, analyze_inventory_risk


def generate_hackathon_demo_data():
    """Generates synthetic, labeled demo data for a live hackathon demonstration."""
    base_date = datetime(2026, 10, 1)
    sales_rows = []

    # 1. High Velocity item: Gaming Laptop
    for i in range(25):
        dt = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        sales_rows.append({"date": dt, "product_id": "SKU-101", "quantity_sold": 15 + (i % 4)})

    # 2. Medium Velocity with weekend surge: Wireless Headset
    for i in range(25):
        dt = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        qty = 28 if (i % 7 in [5, 6]) else 8
        sales_rows.append({"date": dt, "product_id": "SKU-202", "quantity_sold": qty})

    # 3. Intermittent / Slow-moving item: Ergonomic Chair
    for i in range(25):
        dt = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        qty = 3 if i in [3, 9, 14, 21] else 0
        sales_rows.append({"date": dt, "product_id": "SKU-303", "quantity_sold": qty})

    sales_df = pd.DataFrame(sales_rows)

    inventory_df = pd.DataFrame([
        {
            "product_id": "SKU-101",
            "product_name": "Pro Gaming Laptop",
            "current_stock": 25.0,    # Lead time is 5 days, demand is ~16/day (D_lead = 80) -> Critical stockout risk
            "lead_time_days": 5,
            "unit_cost": 850.0
        },
        {
            "product_id": "SKU-202",
            "product_name": "Noise Cancelling Headset",
            "current_stock": 180.0,   # Moderate stock
            "lead_time_days": 4,
            "unit_cost": 65.0
        },
        {
            "product_id": "SKU-303",
            "product_name": "Ergonomic Office Chair",
            "current_stock": 120.0,   # Slow demand, huge stock -> Overstock alert
            "lead_time_days": 7,
            "unit_cost": 140.0
        }
    ])

    return sales_df, inventory_df


def main():
    print("=" * 70)
    print(" SmartStock AI — Backend ML & Inventory Intelligence Engine Demo")
    print("=" * 70)

    print("\n[Step 1] Loading synthetic demo data...")
    sales_df, inventory_df = generate_hackathon_demo_data()
    print(f"Loaded {len(sales_df)} sales records across {sales_df['product_id'].nunique()} products.")
    print(f"Loaded {len(inventory_df)} inventory items.")

    print("\n[Step 2] Validating sales transactions...")
    cleaned_sales = validate_sales_data(sales_df)
    print("[OK] Sales validation passed successfully.")

    print("\n[Step 3] Generating 7-day daily demand forecasts...")
    forecast_df = forecast_demand_7days(cleaned_sales, window=7)
    print("\nSample 7-Day Forecast:")
    print(forecast_df.to_string(index=False))

    print("\n[Step 4] Running chronological model evaluation (no data leakage)...")
    eval_metrics = evaluate_forecast(cleaned_sales, test_days=7, window=7)
    print(f"Status: {eval_metrics['status']}")
    print(f"Overall MAE  : {eval_metrics['mae']}")
    print(f"Overall RMSE : {eval_metrics['rmse']}")
    print(f"Train/Test split window: {eval_metrics['evaluation_period']}")
    print("Product-level metrics:")
    for pid, pdata in eval_metrics.get("product_metrics", {}).items():
        print(f"  - {pid}: MAE={pdata.get('mae')} | RMSE={pdata.get('rmse')} | Daily Baseline={pdata.get('baseline_daily_forecast')}")

    print("\n[Step 5] Running inventory risk analysis & reorder recommendations...")
    inventory_decisions = analyze_inventory_risk(
        inventory_df,
        forecast_df,
        service_level_factor=1.65,
        overstock_buffer_days=30
    )

    print("\nInventory Intelligence Summary:")
    display_cols = [
        "product_id", "product_name", "current_stock", "avg_daily_demand",
        "lead_time_demand", "reorder_point", "stockout_risk",
        "overstock_risk", "recommended_reorder_qty", "estimated_reorder_cost"
    ]
    print(inventory_decisions[display_cols].to_string(index=False))

    print("\nRisk Explanations:")
    for _, row in inventory_decisions.iterrows():
        print(f"  [{row['product_id']}] {row['product_name']}: {row['risk_reason']}")

    print("\n" + "=" * 70)
    print("[OK] All SmartStock AI engine checks completed successfully!")
    print("=" * 70)


if __name__ == "__main__":
    main()
