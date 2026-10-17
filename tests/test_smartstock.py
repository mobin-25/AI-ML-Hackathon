"""
SmartStock AI - Unit & Integration Test Suite
Tests forecasting baseline, chronological evaluation, inventory risk, and reorder logic.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from src.forecast import validate_sales_data, forecast_demand_7days, evaluate_forecast
from src.inventory import validate_inventory_data, analyze_inventory_risk


@pytest.fixture
def sample_sales_data():
    """Generates synthetic multi-product 21-day sales history."""
    records = []
    base_date = datetime(2026, 10, 1)
    for day in range(21):
        dt_str = (base_date + timedelta(days=day)).strftime("%Y-%m-%d")
        # Product A: Steady daily sales (~10 units)
        records.append({"date": dt_str, "product_id": "PROD-A", "quantity_sold": 10 + (day % 3)})
        # Product B: Weekend spikes, intermittent zeros
        qty_b = 25 if (day % 7 >= 5) else (5 if day % 2 == 0 else 0)
        records.append({"date": dt_str, "product_id": "PROD-B", "quantity_sold": qty_b})
        # Product C: Sparse sales
        if day in [2, 8, 15]:
            records.append({"date": dt_str, "product_id": "PROD-C", "quantity_sold": 4})
    return pd.DataFrame(records)


@pytest.fixture
def sample_inventory_data():
    """Generates sample inventory state for testing risk scenarios."""
    return pd.DataFrame([
        {
            "product_id": "PROD-A",
            "product_name": "Premium Wireless Mouse",
            "current_stock": 15.0,     # Below lead time demand (lead=3, daily=11 -> D_lead=33) -> HIGH stockout
            "lead_time_days": 3,
            "unit_cost": 25.0
        },
        {
            "product_id": "PROD-B",
            "product_name": "Mechanical Keyboard",
            "current_stock": 400.0,    # Very high stock (~43 days of supply) -> Overstock (>30 days supply)
            "lead_time_days": 5,
            "unit_cost": 75.0
        },
        {
            "product_id": "PROD-C",
            "product_name": "USB-C Hub",
            "current_stock": 5.0,      # Low demand, modest stock
            "lead_time_days": 2,
            "unit_cost": 15.0
        }
    ])


# ============================================================================
# 1. Sales Validation Tests
# ============================================================================

def test_validate_sales_valid(sample_sales_data):
    cleaned = validate_sales_data(sample_sales_data)
    assert not cleaned.empty
    assert set(cleaned.columns) == {"product_id", "date", "quantity_sold"}
    assert cleaned["quantity_sold"].min() >= 0


def test_validate_sales_missing_columns():
    invalid_df = pd.DataFrame({"date": ["2026-10-01"], "quantity_sold": [5]})
    with pytest.raises(ValueError, match="missing required columns"):
        validate_sales_data(invalid_df)


def test_validate_sales_negative_quantity():
    invalid_df = pd.DataFrame({
        "date": ["2026-10-01"],
        "product_id": ["P1"],
        "quantity_sold": [-10]
    })
    with pytest.raises(ValueError, match="negative value"):
        validate_sales_data(invalid_df)


def test_validate_sales_corrupted_dates():
    invalid_df = pd.DataFrame({
        "date": ["not-a-valid-date"],
        "product_id": ["P1"],
        "quantity_sold": [10]
    })
    with pytest.raises(ValueError, match="invalid or unparseable dates"):
        validate_sales_data(invalid_df)


# ============================================================================
# 2. Forecasting Engine Tests
# ============================================================================

def test_forecast_7days_generation(sample_sales_data):
    forecast_df = forecast_demand_7days(sample_sales_data, window=7)
    
    # Must produce exactly 7 days per product (3 products * 7 = 21 records)
    assert len(forecast_df) == 21
    assert set(forecast_df.columns) == {"product_id", "date", "predicted_demand"}
    assert set(forecast_df["product_id"].unique()) == {"PROD-A", "PROD-B", "PROD-C"}
    
    # All predictions must be non-negative
    assert (forecast_df["predicted_demand"] >= 0.0).all()


def test_forecast_cold_start_product():
    # Only 1 day of sales history
    sparse_sales = pd.DataFrame({
        "date": ["2026-10-01"],
        "product_id": ["NEW-ITEM"],
        "quantity_sold": [8]
    })
    fc = forecast_demand_7days(sparse_sales, window=7)
    assert len(fc) == 7
    assert (fc["predicted_demand"] == 8.0).all()


def test_forecast_missing_dates_handled():
    # Sales on Day 1 and Day 5 only. Days 2, 3, 4 missing.
    sparse_sales = pd.DataFrame({
        "date": ["2026-10-01", "2026-10-05"],
        "product_id": ["SPARSE-1", "SPARSE-1"],
        "quantity_sold": [10, 10]
    })
    fc = forecast_demand_7days(sparse_sales, window=7)
    # Total sales = 20 over 5 days -> average should reflect padded zeroes
    assert len(fc) == 7
    assert fc["predicted_demand"].iloc[0] == 4.0  # (10 + 0 + 0 + 0 + 10) / 5 = 4.0


# ============================================================================
# 3. Model Evaluation Tests
# ============================================================================

def test_evaluate_forecast_success(sample_sales_data):
    # 21 days is ample for 7-day test + 7-day train window
    result = evaluate_forecast(sample_sales_data, test_days=7, window=7)
    assert result["status"] == "success"
    assert result["mae"] is not None
    assert result["rmse"] is not None
    assert result["mae"] >= 0.0
    assert result["rmse"] >= result["mae"]  # Mathematical property: RMSE >= MAE
    assert "PROD-A" in result["product_metrics"]


def test_evaluate_forecast_insufficient_data():
    short_df = pd.DataFrame({
        "date": ["2026-10-01", "2026-10-02"],
        "product_id": ["P1", "P1"],
        "quantity_sold": [5, 6]
    })
    result = evaluate_forecast(short_df, test_days=7, window=7)
    assert result["status"] == "insufficient_data"
    assert result["mae"] is None
    assert "Insufficient historical timeline" in result["message"]


# ============================================================================
# 4. Inventory Risk & Decision Logic Tests
# ============================================================================

def test_validate_inventory_valid(sample_inventory_data):
    cleaned = validate_inventory_data(sample_inventory_data)
    assert len(cleaned) == 3
    assert (cleaned["current_stock"] >= 0).all()


def test_validate_inventory_negative_stock():
    bad_df = pd.DataFrame([{
        "product_id": "P1",
        "product_name": "Widget",
        "current_stock": -5,
        "lead_time_days": 3,
        "unit_cost": 10
    }])
    with pytest.raises(ValueError, match="negative value"):
        validate_inventory_data(bad_df)


def test_inventory_risk_stockout_and_reorder(sample_sales_data, sample_inventory_data):
    forecast_df = forecast_demand_7days(sample_sales_data, window=7)
    decision_df = analyze_inventory_risk(
        sample_inventory_data,
        forecast_df,
        service_level_factor=1.65,
        overstock_buffer_days=30
    )

    assert len(decision_df) == 3

    # PROD-A has 15 in stock, daily demand is ~11, lead time is 3 -> D_lead = 33
    # Therefore stock (15) < D_lead (33) -> HIGH stockout risk
    prod_a = decision_df[decision_df["product_id"] == "PROD-A"].iloc[0]
    assert prod_a["stockout_risk"] == "HIGH"
    assert prod_a["recommended_reorder_qty"] > 0
    assert not prod_a["overstock_risk"]

    # PROD-B has 250 in stock -> Overstock (> 30 days of supply)
    prod_b = decision_df[decision_df["product_id"] == "PROD-B"].iloc[0]
    assert bool(prod_b["overstock_risk"])
    assert prod_b["recommended_reorder_qty"] == 0.0

    # Ensure all reorder quantities are strictly non-negative
    assert (decision_df["recommended_reorder_qty"] >= 0.0).all()
    assert (decision_df["estimated_reorder_cost"] >= 0.0).all()
