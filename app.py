"""
SmartStock AI - AI-Powered Inventory Management & Demand Forecasting Dashboard
Hackathon Project - Lead UI/Dashboard (Member 2: Ajinkya)
Stack: Streamlit, Pandas, Plotly
"""

import sys
import os
from datetime import datetime
import pandas as pd
import streamlit as st

# Ensure local imports work reliably
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.demo_data import get_demo_inventory_df, get_demo_sales_df, get_demo_evaluation_df
from src.data_loader import (
    validate_inventory_df,
    validate_sales_df,
    generate_sample_inventory_csv,
    generate_sample_sales_csv,
)
from src.ml_adapter import (
    get_backend_status,
    generate_7day_forecast,
    compute_inventory_metrics,
)
from src.ui_components import (
    render_kpi_cards,
    build_stock_risk_donut_chart,
    build_historical_sales_chart,
    build_forecast_chart,
    build_actual_vs_predicted_chart,
    render_alert_cards,
)

# ---------------------------------------------------------
# Page Configuration & Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="SmartStock AI | Demand Forecasting & Inventory",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom High-End CSS Styling
st.markdown(
    """
    <style>
    /* Global layout tweaks */
    .block-container {
        padding-top: 1.8rem;
        padding-bottom: 2rem;
    }
    /* Brand Header styling */
    .brand-title {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.1rem;
    }
    .brand-subtitle {
        color: #94a3b8;
        font-size: 0.95rem;
        margin-bottom: 1.2rem;
    }
    /* Demo Badge */
    .demo-badge {
        display: inline-block;
        padding: 4px 10px;
        background-color: rgba(245, 158, 11, 0.15);
        border: 1px solid #f59e0b;
        color: #fbbf24;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-left: 10px;
    }
    .live-badge {
        display: inline-block;
        padding: 4px 10px;
        background-color: rgba(16, 185, 129, 0.15);
        border: 1px solid #10b981;
        color: #34d399;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-left: 10px;
    }
    /* Integration Status Box in Sidebar */
    .status-card {
        background-color: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 12px;
        font-size: 0.82rem;
        margin-top: 10px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------
# Sidebar: Data Source & CSV Uploads
# ---------------------------------------------------------
st.sidebar.markdown("## ⚙️ SmartStock Control")

data_mode = st.sidebar.radio(
    "Data Source Mode:",
    ["⚡ Demo Retail Catalog (Ready to use)", "📂 Upload Custom CSV Files"],
    index=0,
    help="Demo mode pre-loads realistic inventory and sales history. Choose Upload mode to load your own CSV files.",
)

is_demo_mode = "Demo" in data_mode

inventory_df: pd.DataFrame = None
sales_df: pd.DataFrame = None
eval_df: pd.DataFrame = None
data_errors = []

if is_demo_mode:
    inventory_df = get_demo_inventory_df()
    sales_df = get_demo_sales_df(days_history=60)
    eval_df = get_demo_evaluation_df()
else:
    st.sidebar.markdown("### 📤 Upload Datasets")

    uploaded_inv = st.sidebar.file_uploader(
        "1. Inventory CSV",
        type=["csv"],
        help="Required columns: product_id, product_name, current_stock, lead_time_days, unit_cost",
    )

    uploaded_sales = st.sidebar.file_uploader(
        "2. Sales History CSV",
        type=["csv"],
        help="Required columns: date, product_id, quantity_sold",
    )

    # Downloadable CSV templates
    col_t1, col_t2 = st.sidebar.columns(2)
    with col_t1:
        st.download_button(
            "📄 Inv. Template",
            data=generate_sample_inventory_csv(),
            file_name="sample_inventory.csv",
            mime="text/csv",
            use_container_width=True,
        )
    with col_t2:
        st.download_button(
            "📄 Sales Template",
            data=generate_sample_sales_csv(),
            file_name="sample_sales.csv",
            mime="text/csv",
            use_container_width=True,
        )

    # Validate Inventory CSV
    if uploaded_inv is not None:
        try:
            raw_inv = pd.read_csv(uploaded_inv)
            valid_inv, inv_err, cleaned_inv = validate_inventory_df(raw_inv)
            if valid_inv:
                inventory_df = cleaned_inv
                st.sidebar.success(f"✓ Inventory loaded ({len(inventory_df)} products)")
            else:
                data_errors.append(f"**Inventory CSV Error:** {inv_err}")
        except Exception as e:
            data_errors.append(f"**Inventory CSV Read Error:** {str(e)}")

    # Validate Sales CSV
    if uploaded_sales is not None:
        try:
            raw_sales = pd.read_csv(uploaded_sales)
            valid_sales, sales_err, cleaned_sales = validate_sales_df(raw_sales)
            if valid_sales:
                sales_df = cleaned_sales
                st.sidebar.success(f"✓ Sales loaded ({len(sales_df):,} records)")
            else:
                data_errors.append(f"**Sales CSV Error:** {sales_err}")
        except Exception as e:
            data_errors.append(f"**Sales CSV Read Error:** {str(e)}")

    # Fallback to demo data if upload incomplete
    if inventory_df is None or sales_df is None:
        st.sidebar.warning("Upload both CSVs to run on custom data. Currently falling back to Demo Mode.")
        inventory_df = get_demo_inventory_df()
        sales_df = get_demo_sales_df(days_history=60)
        eval_df = get_demo_evaluation_df()
        is_demo_mode = True

# ---------------------------------------------------------
# Sidebar: Backend Integration Contract Health
# ---------------------------------------------------------
st.sidebar.markdown("---")
st.sidebar.markdown("### 🔌 Team Integration Health")
backend_status = get_backend_status()

if backend_status["forecast_module_loaded"] and backend_status["inventory_module_loaded"]:
    st.sidebar.success("🟢 ML Backend: Connected (`src/forecast.py`)")
else:
    st.sidebar.info("🟡 ML Backend: Mock Adapter Active\n\n*(Ready to connect to Mobin's `src/forecast.py` and `src/inventory.py`)*")

# ---------------------------------------------------------
# Forecasting & Inventory Computation
# ---------------------------------------------------------
forecast_df = generate_7day_forecast(sales_df, inventory_df)
metrics_df = compute_inventory_metrics(inventory_df, forecast_df)

# Top Header Bar
badge_html = (
    '<span class="demo-badge">⚡ DEMO DATASET ACTIVE</span>'
    if is_demo_mode
    else '<span class="live-badge">🟢 CUSTOM USER DATA</span>'
)

st.markdown(
    f"""
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div>
            <div class="brand-title">SmartStock AI {badge_html}</div>
            <div class="brand-subtitle">AI-Powered Demand Forecasting & Predictive Inventory Replenishment for Retail</div>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# Display CSV upload errors if any
if data_errors:
    for err in data_errors:
        st.error(err)

# ---------------------------------------------------------
# KPI Metric Cards
# ---------------------------------------------------------
total_products = len(metrics_df)
total_inv_val = float(metrics_df["inventory_value"].sum())
stockout_risk_count = int((metrics_df["stock_risk"] == "🚨 High Stockout Risk").sum())
total_7d_forecast = int(forecast_df["predicted_demand"].sum())

render_kpi_cards(
    total_products=total_products,
    total_inventory_value=total_inv_val,
    stockout_risk_count=stockout_risk_count,
    total_forecast_demand=total_7d_forecast,
)

st.markdown("<div style='height: 18px;'></div>", unsafe_allow_html=True)

# ---------------------------------------------------------
# Main Tabs Navigation
# ---------------------------------------------------------
tab_inventory, tab_forecast, tab_alerts, tab_integration = st.tabs([
    "📋 Inventory Management & Reorders",
    "📈 Demand Forecasting & Visualizations",
    "🚨 Risk & Alerts Center",
    "🔌 Backend Contract & Architecture",
])

# =========================================================
# TAB 1: Inventory Table & Reorder Management
# =========================================================
with tab_inventory:
    st.markdown("### 📦 Stock Catalog & Reorder Recommendations")

    # Filters Row
    f_col1, f_col2, f_col3 = st.columns([2, 2, 2])
    with f_col1:
        risk_filter = st.selectbox(
            "Filter by Stock Risk:",
            ["All Risk Levels", "🚨 High Stockout Risk", "⚠️ Reorder Soon", "✅ Healthy Stock", "📦 Overstocked"],
            index=0,
        )
    with f_col2:
        search_query = st.text_input("🔍 Search Product Name or ID:", placeholder="e.g. Keyboard, SKU-101").strip().lower()
    with f_col3:
        sort_by = st.selectbox(
            "Sort Inventory By:",
            ["Urgency (Highest Risk First)", "Current Stock (Ascending)", "7-Day Forecast (Descending)", "Inventory Value (Descending)"],
            index=0,
        )

    # Filter DataFrame
    filtered_df = metrics_df.copy()
    if risk_filter != "All Risk Levels":
        filtered_df = filtered_df[filtered_df["stock_risk"] == risk_filter]

    if search_query:
        filtered_df = filtered_df[
            filtered_df["product_name"].str.lower().str.contains(search_query)
            | filtered_df["product_id"].str.lower().str.contains(search_query)
        ]

    # Apply Sorting
    if sort_by == "Urgency (Highest Risk First)":
        filtered_df = filtered_df.sort_values(by=["severity_rank", "days_of_supply"], ascending=[True, True])
    elif sort_by == "Current Stock (Ascending)":
        filtered_df = filtered_df.sort_values(by="current_stock", ascending=True)
    elif sort_by == "7-Day Forecast (Descending)":
        filtered_df = filtered_df.sort_values(by="forecast_7d_demand", ascending=False)
    elif sort_by == "Inventory Value (Descending)":
        filtered_df = filtered_df.sort_values(by="inventory_value", ascending=False)

    # Display Columns Formatted Table
    display_cols = [
        "product_id",
        "product_name",
        "current_stock",
        "forecast_7d_demand",
        "lead_time_days",
        "days_of_supply",
        "stock_risk",
        "recommended_reorder_qty",
        "unit_cost",
        "inventory_value",
    ]

    rename_map = {
        "product_id": "Product ID",
        "product_name": "Product Name",
        "current_stock": "Current Stock",
        "forecast_7d_demand": "7-Day Forecast",
        "lead_time_days": "Lead Time (Days)",
        "days_of_supply": "Days of Supply",
        "stock_risk": "Stock Risk Status",
        "recommended_reorder_qty": "Reorder Qty",
        "unit_cost": "Unit Cost ($)",
        "inventory_value": "Inventory Value ($)",
    }

    styled_table = filtered_df[display_cols].rename(columns=rename_map)

    st.dataframe(
        styled_table,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Current Stock": st.column_config.NumberColumn(format="%d units"),
            "7-Day Forecast": st.column_config.NumberColumn(format="%d units"),
            "Lead Time (Days)": st.column_config.NumberColumn(format="%d days"),
            "Days of Supply": st.column_config.NumberColumn(format="%.1f days"),
            "Reorder Qty": st.column_config.NumberColumn(format="%d units"),
            "Unit Cost ($)": st.column_config.NumberColumn(format="$%.2f"),
            "Inventory Value ($)": st.column_config.NumberColumn(format="$%.2f"),
        },
    )

    # Quick Action: Export Purchase Order CSV
    reorder_needed_df = metrics_df[metrics_df["recommended_reorder_qty"] > 0].copy()
    if not reorder_needed_df.empty:
        reorder_export = reorder_needed_df[[
            "product_id",
            "product_name",
            "current_stock",
            "recommended_reorder_qty",
            "unit_cost",
            "lead_time_days",
        ]].copy()
        reorder_export["estimated_cost"] = reorder_export["recommended_reorder_qty"] * reorder_export["unit_cost"]
        reorder_csv = reorder_export.to_csv(index=False)

        col_po1, col_po2 = st.columns([4, 2])
        with col_po1:
            st.info(
                f"🛒 **Purchase Order Ready:** {len(reorder_needed_df)} items need replenishment. "
                f"Total Reorder Value: **${reorder_export['estimated_cost'].sum():,.2f}**"
            )
        with col_po2:
            st.download_button(
                label="📥 Download Purchase Order (CSV)",
                data=reorder_csv,
                file_name=f"SmartStock_PO_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv",
                use_container_width=True,
            )

# =========================================================
# TAB 2: Forecast Visualizations
# =========================================================
with tab_forecast:
    st.markdown("### 📊 Interactive Demand Forecast & Velocity")

    row1_c1, row1_c2 = st.columns([3, 2])

    with row1_c1:
        # Product Selector for deep dive
        product_options = metrics_df["product_id"].tolist()
        product_name_map = dict(zip(metrics_df["product_id"], metrics_df["product_name"]))

        selected_pid = st.selectbox(
            "Select Target Product for 7-Day Forecast & Evaluation:",
            product_options,
            format_func=lambda pid: f"{pid} - {product_name_map.get(pid, '')}",
            index=0,
        )
        p_name = product_name_map.get(selected_pid, "")

        # 7-Day Forecast Chart
        fc_chart = build_forecast_chart(forecast_df, selected_pid, p_name)
        st.plotly_chart(fc_chart, use_container_width=True)

    with row1_c2:
        # Stock Risk Distribution Donut Chart
        donut_chart = build_stock_risk_donut_chart(metrics_df)
        st.plotly_chart(donut_chart, use_container_width=True)

    st.markdown("---")

    # Historical Sales Trendline
    st.markdown("#### 📅 Historical Sales Trends")
    multi_selected = st.multiselect(
        "Select Products to Compare History:",
        product_options,
        default=product_options[:4] if len(product_options) >= 4 else product_options,
        format_func=lambda pid: f"{pid} - {product_name_map.get(pid, '')}",
    )

    if multi_selected:
        history_chart = build_historical_sales_chart(sales_df, multi_selected, product_name_map)
        st.plotly_chart(history_chart, use_container_width=True)
    else:
        st.warning("Please select at least one product to display the historical sales chart.")

    # Model Evaluation (Actual vs Predicted)
    st.markdown("---")
    st.markdown("#### 🎯 Model Accuracy & Validation (Actual vs Predicted)")
    if eval_df is not None and not eval_df.empty:
        eval_chart = build_actual_vs_predicted_chart(eval_df, selected_pid)
        st.plotly_chart(eval_chart, use_container_width=True)
    else:
        st.info("Upload sales data containing backtest evaluation to view the Actual vs Predicted demand chart.")

# =========================================================
# TAB 3: Risk & Alerts Center
# =========================================================
with tab_alerts:
    st.markdown("### 🔔 Intelligent Inventory Risk Alerts")
    st.caption("SmartStock AI evaluates lead times, daily burn rates, and safety buffers to generate actionable warnings with explicit business explanations.")

    render_alert_cards(metrics_df)

# =========================================================
# TAB 4: Backend Contract & Architecture
# =========================================================
with tab_integration:
    st.markdown("### 🔌 Team Integration Contract & Status")

    st.markdown(
        """
        SmartStock AI is built with an **isolated, modular contract** to guarantee seamless collaboration across team members:
        - **Member 2 (Ajinkya - Frontend Lead):** Dashboard UI, interactive Plotly visualizations, CSV validator, and mock adapter.
        - **Member 1 (Mobin - Backend & ML Lead):** Demand forecasting models in `src/forecast.py` and inventory math in `src/inventory.py`.
        - **Member 3 (Parth - Data & Testing Lead):** Data cleaning pipelines, mock test suites, and schema tests on `feature/data-testing`.
        """
    )

    st.markdown("#### 📋 Contract Interface Specification for Mobin (`feature/backend-ml`)")
    st.code(
        '''
# Expected in src/forecast.py:
def predict_demand(sales_df: pd.DataFrame, days: int = 7) -> pd.DataFrame:
    """
    Inputs:
        sales_df: ['date', 'product_id', 'quantity_sold']
    Returns:
        pd.DataFrame with: ['product_id', 'date', 'predicted_demand']
    """
    pass

# Expected in src/inventory.py:
def calculate_inventory_metrics(inventory_df: pd.DataFrame, forecast_df: pd.DataFrame) -> pd.DataFrame:
    """
    Inputs:
        inventory_df: ['product_id', 'product_name', 'current_stock', 'lead_time_days', 'unit_cost']
        forecast_df: ['product_id', 'date', 'predicted_demand']
    Returns:
        pd.DataFrame with added columns:
            ['forecast_7d_demand', 'days_of_supply', 'reorder_point',
             'recommended_reorder_qty', 'stock_risk', 'risk_reason']
    """
    pass
        ''',
        language="python",
    )

    st.markdown("#### ⚡ Live Integration Health Check")
    status = get_backend_status()
    c_s1, c_s2 = st.columns(2)
    with c_s1:
        st.write(f"**Forecasting Module (`src/forecast.py`):** {'✅ Loaded' if status['forecast_module_loaded'] else '⏳ Waiting for Mobin (Using Mock Adapter)'}")
    with c_s2:
        st.write(f"**Inventory Module (`src/inventory.py`):** {'✅ Loaded' if status['inventory_module_loaded'] else '⏳ Waiting for Mobin (Using Mock Adapter)'}")
