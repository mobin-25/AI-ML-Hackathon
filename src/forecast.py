"""
SmartStock AI - Forecasting Engine
Module: src.forecast

Provides:
- validate_sales_data: Ingestion, validation, and normalization of sales transactions.
- forecast_demand_7days: Multi-product 7-day demand forecasting using a calendar-aware moving average.
- evaluate_forecast: Chronological, leakage-free train/test evaluation reporting MAE and RMSE.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, root_mean_squared_error


REQUIRED_SALES_COLUMNS = ["date", "product_id", "quantity_sold"]


def validate_sales_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Validates and normalizes sales data.

    Expected Schema:
        - date: String or datetime
        - product_id: Any hashable identifier (string, int)
        - quantity_sold: Non-negative numeric value

    Returns:
        pd.DataFrame: Cleaned DataFrame with parsed dates, non-negative quantities,
                      aggregated per product-day.

    Raises:
        ValueError: If required columns are missing, data is empty, or values are invalid.
    """
    if df is None or not isinstance(df, pd.DataFrame):
        raise ValueError("Sales data must be a valid pandas DataFrame.")

    if df.empty:
        raise ValueError("Sales data is empty. At least one record is required.")

    missing_cols = [col for col in REQUIRED_SALES_COLUMNS if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Sales data missing required columns: {missing_cols}. Expected: {REQUIRED_SALES_COLUMNS}")

    cleaned = df.copy()

    # Validate and parse dates
    try:
        cleaned["date"] = pd.to_datetime(cleaned["date"], errors="coerce")
    except Exception as exc:
        raise ValueError(f"Failed to parse dates in sales data: {exc}")

    if cleaned["date"].isna().any():
        invalid_count = cleaned["date"].isna().sum()
        raise ValueError(f"Found {invalid_count} record(s) with invalid or unparseable dates in sales data.")

    # Validate product_id
    if cleaned["product_id"].isna().any():
        raise ValueError("Product ID cannot contain null or NaN values.")

    cleaned["product_id"] = cleaned["product_id"].astype(str).str.strip()
    if (cleaned["product_id"] == "").any():
        raise ValueError("Product ID cannot be empty strings.")

    # Validate quantity_sold
    cleaned["quantity_sold"] = pd.to_numeric(cleaned["quantity_sold"], errors="coerce")
    if cleaned["quantity_sold"].isna().any():
        raise ValueError("quantity_sold contains non-numeric or NaN values.")

    if (cleaned["quantity_sold"] < 0).any():
        neg_count = (cleaned["quantity_sold"] < 0).sum()
        raise ValueError(f"quantity_sold contains {neg_count} negative value(s). Sales quantities must be >= 0.")

    # Normalize date to date only (strip timestamp if present)
    cleaned["date"] = cleaned["date"].dt.normalize()

    # Aggregate duplicate transactions for same product on same date
    cleaned = (
        cleaned.groupby(["product_id", "date"], as_index=False)["quantity_sold"]
        .sum()
        .sort_values(by=["product_id", "date"])
        .reset_index(drop=True)
    )

    return cleaned


def forecast_demand_7days(sales_df: pd.DataFrame, window: int = 7) -> pd.DataFrame:
    """
    Generates a 7-day daily demand forecast per product using a moving-average baseline.

    Features:
    - Automatically handles missing calendar dates by padding with zero sales.
    - Prevents negative predictions by clipping at 0.0.
    - Handles sparse histories and cold-start items safely.
    - Returns standardized DataFrame: ['product_id', 'date', 'predicted_demand'].

    Parameters:
        sales_df: Validated or raw sales DataFrame.
        window: Historical moving average window in days (default: 7).

    Returns:
        pd.DataFrame: 7-day future predictions per product.
    """
    cleaned = validate_sales_data(sales_df)

    forecast_records: List[Dict[str, Any]] = []

    # Process each product independently
    for product_id, group in cleaned.groupby("product_id"):
        group = group.sort_values("date")
        min_date = group["date"].min()
        max_date = group["date"].max()

        # Build full continuous calendar index to account for zero-sales days
        full_date_idx = pd.date_range(start=min_date, end=max_date, freq="D")
        product_series = (
            group.set_index("date")["quantity_sold"]
            .reindex(full_date_idx, fill_value=0.0)
        )

        # Baseline demand estimation using recent window
        if len(product_series) >= window:
            recent_sales = product_series.iloc[-window:]
            daily_forecast = float(recent_sales.mean())
        elif len(product_series) > 0:
            daily_forecast = float(product_series.mean())
        else:
            daily_forecast = 0.0

        # Enforce non-negativity and round for clean explainable presentation
        daily_forecast = max(0.0, round(daily_forecast, 2))

        # Project for the next 7 calendar days
        future_dates = pd.date_range(start=max_date + pd.Timedelta(days=1), periods=7, freq="D")

        for f_date in future_dates:
            forecast_records.append({
                "product_id": product_id,
                "date": f_date.strftime("%Y-%m-%d"),
                "predicted_demand": daily_forecast
            })

    result_df = pd.DataFrame(forecast_records, columns=["product_id", "date", "predicted_demand"])
    return result_df


def evaluate_forecast(sales_df: pd.DataFrame, test_days: int = 7, window: int = 7) -> Dict[str, Any]:
    """
    Performs chronological train/test validation without data leakage.

    Splits historical timeline:
        - Train: Days up to (max_date - test_days)
        - Test: Last test_days (holdout set)

    Computes:
        - MAE (Mean Absolute Error)
        - RMSE (Root Mean Squared Error)

    Returns:
        Dict[str, Any]: Detailed evaluation metrics and validation report.
    """
    cleaned = validate_sales_data(sales_df)

    overall_max_date = cleaned["date"].max()
    overall_min_date = cleaned["date"].min()
    total_days = (overall_max_date - overall_min_date).days + 1

    min_required_days = window + test_days
    if total_days < min_required_days:
        return {
            "status": "insufficient_data",
            "message": (
                f"Insufficient historical timeline for evaluation. Total span is {total_days} day(s), "
                f"but at least {min_required_days} days are required ({window} train window + {test_days} test holdout)."
            ),
            "mae": None,
            "rmse": None,
            "product_metrics": {},
            "evaluation_period": None
        }

    cutoff_date = overall_max_date - pd.Timedelta(days=test_days)

    y_true_all: List[float] = []
    y_pred_all: List[float] = []
    product_metrics: Dict[str, Dict[str, Any]] = {}

    for product_id, group in cleaned.groupby("product_id"):
        group = group.sort_values("date")

        # Train data strictly before or on cutoff_date
        train_data = group[group["date"] <= cutoff_date]
        test_data = group[group["date"] > cutoff_date]

        if train_data.empty:
            product_metrics[product_id] = {
                "status": "skipped",
                "reason": "No training observations prior to cutoff date."
            }
            continue

        # Reindex train data with calendar continuity
        train_min = train_data["date"].min()
        train_calendar = pd.date_range(start=train_min, end=cutoff_date, freq="D")
        train_series = (
            train_data.set_index("date")["quantity_sold"]
            .reindex(train_calendar, fill_value=0.0)
        )

        # Baseline prediction from training observations only (zero leakage)
        if len(train_series) >= window:
            pred_demand = max(0.0, float(train_series.iloc[-window:].mean()))
        else:
            pred_demand = max(0.0, float(train_series.mean()))

        # Reindex test data across the full test holdout calendar
        test_calendar = pd.date_range(start=cutoff_date + pd.Timedelta(days=1), end=overall_max_date, freq="D")
        test_series = (
            test_data.set_index("date")["quantity_sold"]
            .reindex(test_calendar, fill_value=0.0)
        )

        actuals = test_series.values.tolist()
        predictions = [pred_demand] * len(actuals)

        p_mae = float(mean_absolute_error(actuals, predictions))
        p_rmse = float(root_mean_squared_error(actuals, predictions))

        product_metrics[product_id] = {
            "status": "evaluated",
            "test_days": len(actuals),
            "mae": round(p_mae, 3),
            "rmse": round(p_rmse, 3),
            "baseline_daily_forecast": round(pred_demand, 2)
        }

        y_true_all.extend(actuals)
        y_pred_all.extend(predictions)

    if not y_true_all:
        return {
            "status": "no_evaluable_products",
            "message": "None of the products had sufficient historical train/test split coverage.",
            "mae": None,
            "rmse": None,
            "product_metrics": product_metrics,
            "evaluation_period": f"{cutoff_date.strftime('%Y-%m-%d')} to {overall_max_date.strftime('%Y-%m-%d')}"
        }

    overall_mae = float(mean_absolute_error(y_true_all, y_pred_all))
    overall_rmse = float(root_mean_squared_error(y_true_all, y_pred_all))

    return {
        "status": "success",
        "message": f"Successfully evaluated forecast over {test_days}-day chronological holdout.",
        "mae": round(overall_mae, 3),
        "rmse": round(overall_rmse, 3),
        "total_test_samples": len(y_true_all),
        "evaluation_period": {
            "train_cutoff": cutoff_date.strftime("%Y-%m-%d"),
            "test_end": overall_max_date.strftime("%Y-%m-%d")
        },
        "product_metrics": product_metrics
    }
