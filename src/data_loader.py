"""
SmartStock AI - Data Loader & CSV Validator
Handles file upload parsing, schema validation, type conversions,
and downloadable template generation for Sales and Inventory files.
"""

from typing import Tuple, Optional
import io
import pandas as pd


REQUIRED_INVENTORY_COLUMNS = [
    "product_id",
    "product_name",
    "current_stock",
    "lead_time_days",
    "unit_cost",
]

REQUIRED_SALES_COLUMNS = [
    "date",
    "product_id",
    "quantity_sold",
]


def validate_inventory_df(df: pd.DataFrame) -> Tuple[bool, Optional[str], Optional[pd.DataFrame]]:
    """
    Validates uploaded inventory DataFrame against the contract.
    Returns:
        (is_valid: bool, error_message: str | None, cleaned_df: pd.DataFrame | None)
    """
    if df.empty:
        return False, "The uploaded Inventory CSV file is empty.", None

    # Standardize column names (lowercase, stripped)
    df = df.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]

    missing = [c for c in REQUIRED_INVENTORY_COLUMNS if c not in df.columns]
    if missing:
        return (
            False,
            f"Missing required inventory column(s): {', '.join(missing)}. "
            f"Expected columns: {', '.join(REQUIRED_INVENTORY_COLUMNS)}.",
            None,
        )

    # Validate and clean data types
    try:
        df["product_id"] = df["product_id"].astype(str).str.strip()
        df["product_name"] = df["product_name"].astype(str).str.strip()

        # Check for empty product IDs
        if (df["product_id"] == "").any() or df["product_id"].isna().any():
            return False, "Inventory file contains blank or null `product_id` values.", None

        # Check for duplicates in product_id
        if df["product_id"].duplicated().any():
            dupes = df["product_id"][df["product_id"].duplicated()].tolist()
            return False, f"Duplicate `product_id` found in inventory: {', '.join(map(str, dupes[:5]))}.", None

        df["current_stock"] = pd.to_numeric(df["current_stock"], errors="coerce")
        df["lead_time_days"] = pd.to_numeric(df["lead_time_days"], errors="coerce")
        df["unit_cost"] = pd.to_numeric(df["unit_cost"], errors="coerce")

        if df["current_stock"].isna().any():
            return False, "Some rows in `current_stock` could not be converted to numbers or are empty.", None
        if df["lead_time_days"].isna().any():
            return False, "Some rows in `lead_time_days` could not be converted to numbers or are empty.", None
        if df["unit_cost"].isna().any():
            return False, "Some rows in `unit_cost` could not be converted to numbers or are empty.", None

        if (df["current_stock"] < 0).any():
            return False, "`current_stock` cannot contain negative numbers.", None
        if (df["lead_time_days"] < 1).any():
            return False, "`lead_time_days` must be at least 1 day.", None
        if (df["unit_cost"] < 0).any():
            return False, "`unit_cost` cannot be negative.", None

        df["current_stock"] = df["current_stock"].round().astype(int)
        df["lead_time_days"] = df["lead_time_days"].round().astype(int)
        df["unit_cost"] = df["unit_cost"].astype(float)

        return True, None, df

    except Exception as e:
        return False, f"Error validating inventory data: {str(e)}", None


def validate_sales_df(df: pd.DataFrame) -> Tuple[bool, Optional[str], Optional[pd.DataFrame]]:
    """
    Validates uploaded sales history DataFrame against the contract.
    Returns:
        (is_valid: bool, error_message: str | None, cleaned_df: pd.DataFrame | None)
    """
    if df.empty:
        return False, "The uploaded Sales CSV file is empty.", None

    df = df.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]

    missing = [c for c in REQUIRED_SALES_COLUMNS if c not in df.columns]
    if missing:
        return (
            False,
            f"Missing required sales column(s): {', '.join(missing)}. "
            f"Expected columns: {', '.join(REQUIRED_SALES_COLUMNS)}.",
            None,
        )

    try:
        df["product_id"] = df["product_id"].astype(str).str.strip()
        if (df["product_id"] == "").any() or df["product_id"].isna().any():
            return False, "Sales file contains blank or null `product_id` entries.", None

        # Parse date
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        if df["date"].isna().any():
            return False, "Some date values in `date` column could not be parsed. Use YYYY-MM-DD format.", None

        df["quantity_sold"] = pd.to_numeric(df["quantity_sold"], errors="coerce")
        if df["quantity_sold"].isna().any():
            return False, "Some values in `quantity_sold` are not valid numbers.", None

        if (df["quantity_sold"] < 0).any():
            return False, "`quantity_sold` cannot contain negative values.", None

        df["quantity_sold"] = df["quantity_sold"].round().astype(int)
        return True, None, df

    except Exception as e:
        return False, f"Error validating sales data: {str(e)}", None


def generate_sample_inventory_csv() -> str:
    """Generates sample inventory CSV template text for download."""
    sample = (
        "product_id,product_name,current_stock,lead_time_days,unit_cost\n"
        "SKU-101,Ergonomic Mechanical Keyboard,14,7,65.00\n"
        "SKU-102,USB-C Dual 4K Docking Station,8,10,89.50\n"
        "SKU-103,Ultra-Fast Wireless Charger 15W,32,5,18.00\n"
        "SKU-104,Active Noise-Cancelling Headphones,58,6,120.00\n"
        "SKU-105,Artisan Colombian Coffee Beans 1kg,19,4,14.50\n"
    )
    return sample


def generate_sample_sales_csv() -> str:
    """Generates sample sales CSV template text for download."""
    sample = (
        "date,product_id,quantity_sold\n"
        "2026-10-10,SKU-101,5\n"
        "2026-10-11,SKU-101,7\n"
        "2026-10-12,SKU-101,4\n"
        "2026-10-10,SKU-102,3\n"
        "2026-10-11,SKU-102,4\n"
        "2026-10-12,SKU-102,5\n"
    )
    return sample
