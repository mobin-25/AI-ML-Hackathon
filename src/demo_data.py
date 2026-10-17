"""
SmartStock AI - Demo Data Generator
Generates realistic, reproducible synthetic retail inventory, sales history,
and model evaluation benchmarks for demo mode.
"""

from datetime import datetime, timedelta
import numpy as np
import pandas as pd


DEMO_PRODUCTS = [
    {
        "product_id": "SKU-101",
        "product_name": "Ergonomic Mechanical Keyboard",
        "current_stock": 14,
        "lead_time_days": 7,
        "unit_cost": 65.00,
        "category": "Electronics",
        "base_daily_sales": 5.2,
    },
    {
        "product_id": "SKU-102",
        "product_name": "USB-C Dual 4K Docking Station",
        "current_stock": 8,
        "lead_time_days": 10,
        "unit_cost": 89.50,
        "category": "Electronics",
        "base_daily_sales": 3.8,
    },
    {
        "product_id": "SKU-103",
        "product_name": "Ultra-Fast Wireless Charger 15W",
        "current_stock": 32,
        "lead_time_days": 5,
        "unit_cost": 18.00,
        "category": "Accessories",
        "base_daily_sales": 6.5,
    },
    {
        "product_id": "SKU-104",
        "product_name": "Active Noise-Cancelling Headphones",
        "current_stock": 58,
        "lead_time_days": 6,
        "unit_cost": 120.00,
        "category": "Audio",
        "base_daily_sales": 4.1,
    },
    {
        "product_id": "SKU-105",
        "product_name": "Artisan Colombian Coffee Beans 1kg",
        "current_stock": 19,
        "lead_time_days": 4,
        "unit_cost": 14.50,
        "category": "Pantry",
        "base_daily_sales": 8.0,
    },
    {
        "product_id": "SKU-106",
        "product_name": "Ceramic Thermal Tumbler 500ml",
        "current_stock": 95,
        "lead_time_days": 5,
        "unit_cost": 12.00,
        "category": "Lifestyle",
        "base_daily_sales": 4.5,
    },
    {
        "product_id": "SKU-107",
        "product_name": "Organic Japanese Matcha Powder 100g",
        "current_stock": 70,
        "lead_time_days": 8,
        "unit_cost": 22.00,
        "category": "Pantry",
        "base_daily_sales": 3.2,
    },
    {
        "product_id": "SKU-108",
        "product_name": "Aluminum Ergonomic Laptop Stand",
        "current_stock": 390,
        "lead_time_days": 5,
        "unit_cost": 28.00,
        "category": "Office",
        "base_daily_sales": 4.0,
    },
    {
        "product_id": "SKU-109",
        "product_name": "1080p Ultra-Clear Webcam Pro",
        "current_stock": 5,
        "lead_time_days": 5,
        "unit_cost": 45.00,
        "category": "Electronics",
        "base_daily_sales": 4.2,
    },
    {
        "product_id": "SKU-110",
        "product_name": "Braided Nylon USB-C Cable (2m)",
        "current_stock": 550,
        "lead_time_days": 3,
        "unit_cost": 4.50,
        "category": "Accessories",
        "base_daily_sales": 7.0,
    },
]


def get_demo_inventory_df() -> pd.DataFrame:
    """Returns the standardized demo inventory DataFrame."""
    rows = []
    for p in DEMO_PRODUCTS:
        rows.append({
            "product_id": p["product_id"],
            "product_name": p["product_name"],
            "current_stock": int(p["current_stock"]),
            "lead_time_days": int(p["lead_time_days"]),
            "unit_cost": float(p["unit_cost"]),
            "category": p.get("category", "General"),
        })
    return pd.DataFrame(rows)


def get_demo_sales_df(days_history: int = 60) -> pd.DataFrame:
    """Generates realistic daily historical sales data up to yesterday."""
    np.random.seed(42)
    end_date = datetime.now().date() - timedelta(days=1)
    start_date = end_date - timedelta(days=days_history - 1)
    date_range = pd.date_range(start=start_date, end=end_date, freq="D")

    records = []
    for p in DEMO_PRODUCTS:
        base = p["base_daily_sales"]
        for dt in date_range:
            # Weekend lift of 25% on Saturday and Sunday
            day_mult = 1.25 if dt.weekday() in [5, 6] else 1.0
            # Slight random seasonality wave
            day_of_year = dt.timetuple().tm_yday
            seasonality = 1.0 + 0.15 * np.sin(2 * np.pi * day_of_year / 365)
            # Poisson-like demand with normal noise
            mean_demand = base * day_mult * seasonality
            noise = np.random.normal(0, max(1.0, mean_demand * 0.2))
            qty = max(0, int(round(mean_demand + noise)))
            records.append({
                "date": dt.strftime("%Y-%m-%d"),
                "product_id": p["product_id"],
                "quantity_sold": qty,
            })

    sales_df = pd.DataFrame(records)
    sales_df["date"] = pd.to_datetime(sales_df["date"])
    return sales_df


def get_demo_evaluation_df() -> pd.DataFrame:
    """
    Returns actual vs predicted comparison data for the last 7 days
    to demonstrate model accuracy / evaluation charts.
    """
    np.random.seed(101)
    end_date = datetime.now().date() - timedelta(days=1)
    start_date = end_date - timedelta(days=6)
    date_range = pd.date_range(start=start_date, end=end_date, freq="D")

    records = []
    for p in DEMO_PRODUCTS:
        base = p["base_daily_sales"]
        for dt in date_range:
            day_mult = 1.25 if dt.weekday() in [5, 6] else 1.0
            actual = max(0, int(round(np.random.normal(base * day_mult, 1.2))))
            predicted = max(0, int(round(actual + np.random.normal(0, 0.8))))
            records.append({
                "product_id": p["product_id"],
                "product_name": p["product_name"],
                "date": dt.strftime("%Y-%m-%d"),
                "actual_demand": actual,
                "predicted_demand": predicted,
            })

    eval_df = pd.DataFrame(records)
    eval_df["date"] = pd.to_datetime(eval_df["date"])
    return eval_df
