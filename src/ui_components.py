"""
SmartStock AI - UI Components & Plotly Chart Builders
Constructs high-polish, interactive Plotly visualizations, styled metrics,
and contextual inventory risk cards.
"""

from typing import List, Optional
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import streamlit as st


# Color Palette
COLOR_CRITICAL = "#EF4444"    # Red / Rose
COLOR_WARNING = "#F59E0B"     # Amber / Orange
COLOR_HEALTHY = "#10B981"     # Emerald Green
COLOR_OVERSTOCK = "#6366F1"   # Indigo / Blue
COLOR_ACCENT = "#3B82F6"      # Primary Blue
COLOR_BG_DARK = "#1E293B"

RISK_COLOR_MAP = {
    "🚨 High Stockout Risk": COLOR_CRITICAL,
    "⚠️ Reorder Soon": COLOR_WARNING,
    "✅ Healthy Stock": COLOR_HEALTHY,
    "📦 Overstocked": COLOR_OVERSTOCK,
}


def render_kpi_cards(
    total_products: int,
    total_inventory_value: float,
    stockout_risk_count: int,
    total_forecast_demand: int,
):
    """Renders sleek, modern KPI cards with status accents."""
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        st.markdown(
            f"""
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        padding: 18px 20px; border-radius: 12px; border: 1px solid #334155;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="color: #94a3b8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Products</div>
                <div style="color: #f8fafc; font-size: 2.1rem; font-weight: 700; margin-top: 4px;">{total_products:,}</div>
                <div style="color: #38bdf8; font-size: 0.8rem; margin-top: 4px;">Active Tracked Catalog</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c2:
        st.markdown(
            f"""
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        padding: 18px 20px; border-radius: 12px; border: 1px solid #334155;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="color: #94a3b8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Inventory Value</div>
                <div style="color: #f8fafc; font-size: 2.1rem; font-weight: 700; margin-top: 4px;">${total_inventory_value:,.2f}</div>
                <div style="color: #10b981; font-size: 0.8rem; margin-top: 4px;">Across all warehouse stock</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c3:
        risk_color = "#ef4444" if stockout_risk_count > 0 else "#10b981"
        sub_text = "Requires urgent reordering" if stockout_risk_count > 0 else "All stocks healthy"
        st.markdown(
            f"""
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        padding: 18px 20px; border-radius: 12px; border: 1px solid {risk_color}55;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="color: #94a3b8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Stockout Risk</div>
                <div style="color: {risk_color}; font-size: 2.1rem; font-weight: 700; margin-top: 4px;">{stockout_risk_count} SKU{'s' if stockout_risk_count != 1 else ''}</div>
                <div style="color: {risk_color}; font-size: 0.8rem; margin-top: 4px;">{sub_text}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c4:
        st.markdown(
            f"""
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        padding: 18px 20px; border-radius: 12px; border: 1px solid #334155;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="color: #94a3b8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">7-Day Forecast Demand</div>
                <div style="color: #f8fafc; font-size: 2.1rem; font-weight: 700; margin-top: 4px;">{total_forecast_demand:,} units</div>
                <div style="color: #a855f7; font-size: 0.8rem; margin-top: 4px;">Projected next 7 days</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


def build_stock_risk_donut_chart(metrics_df: pd.DataFrame) -> go.Figure:
    """Builds an interactive donut chart summarizing stock risk distribution."""
    risk_counts = metrics_df["stock_risk"].value_counts().reset_index()
    risk_counts.columns = ["Risk Category", "Count"]

    colors = [RISK_COLOR_MAP.get(cat, "#94a3b8") for cat in risk_counts["Risk Category"]]

    fig = go.Figure(
        data=[
            go.Pie(
                labels=risk_counts["Risk Category"],
                values=risk_counts["Count"],
                hole=0.55,
                marker=dict(colors=colors, line=dict(color="#0f172a", width=2)),
                textinfo="label+value",
                hoverinfo="label+value+percent",
            )
        ]
    )
    fig.update_layout(
        title="<b>Inventory Health & Risk Breakdown</b>",
        title_font=dict(size=16, color="#f8fafc"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        legend=dict(font=dict(color="#cbd5e1"), orientation="h", yanchor="bottom", y=-0.2),
        margin=dict(l=20, r=20, t=50, b=30),
        height=320,
    )
    return fig


def build_historical_sales_chart(sales_df: pd.DataFrame, selected_products: List[str], product_names: dict) -> go.Figure:
    """Builds interactive multi-line chart for historical sales."""
    filtered_sales = sales_df[sales_df["product_id"].isin(selected_products)].copy()
    filtered_sales["product_label"] = filtered_sales["product_id"].map(lambda pid: f"{pid} - {product_names.get(pid, pid)}")

    fig = px.line(
        filtered_sales,
        x="date",
        y="quantity_sold",
        color="product_label",
        title="<b>Historical Daily Sales Velocity</b>",
        labels={"date": "Date", "quantity_sold": "Units Sold", "product_label": "Product"},
    )
    fig.update_traces(mode="lines+markers", marker=dict(size=4), line=dict(width=2))
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(15, 23, 42, 0.6)",
        font=dict(color="#cbd5e1"),
        hovermode="x unified",
        xaxis=dict(gridcolor="#334155", showgrid=True),
        yaxis=dict(gridcolor="#334155", showgrid=True),
        legend=dict(orientation="h", yanchor="bottom", y=-0.35),
        margin=dict(l=20, r=20, t=50, b=50),
        height=380,
    )
    return fig


def build_forecast_chart(forecast_df: pd.DataFrame, selected_product: str, product_name: str) -> go.Figure:
    """Builds the 7-day demand forecast chart for a selected product."""
    p_fc = forecast_df[forecast_df["product_id"] == selected_product].sort_values("date")

    fig = go.Figure()
    # Forecast line
    fig.add_trace(
        go.Scatter(
            x=p_fc["date"],
            y=p_fc["predicted_demand"],
            mode="lines+markers+text",
            name="Forecast Demand",
            text=p_fc["predicted_demand"],
            textposition="top center",
            line=dict(color="#38bdf8", width=3),
            marker=dict(size=8, color="#0284c7"),
        )
    )
    # Highlight area
    fig.add_trace(
        go.Bar(
            x=p_fc["date"],
            y=p_fc["predicted_demand"],
            name="Daily Units",
            marker=dict(color="rgba(56, 189, 248, 0.25)"),
            hoverinfo="x+y",
        )
    )

    fig.update_layout(
        title=f"<b>7-Day Demand Forecast:</b> {selected_product} ({product_name})",
        title_font=dict(size=16, color="#f8fafc"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(15, 23, 42, 0.6)",
        font=dict(color="#cbd5e1"),
        xaxis=dict(gridcolor="#334155", title="Forecast Date"),
        yaxis=dict(gridcolor="#334155", title="Predicted Units Demand"),
        legend=dict(orientation="h", yanchor="bottom", y=-0.25),
        margin=dict(l=20, r=20, t=50, b=40),
        height=360,
    )
    return fig


def build_actual_vs_predicted_chart(eval_df: pd.DataFrame, selected_product: str) -> go.Figure:
    """Builds Actual vs Predicted evaluation chart with error metrics."""
    p_eval = eval_df[eval_df["product_id"] == selected_product].sort_values("date")

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=p_eval["date"],
            y=p_eval["actual_demand"],
            name="Actual Demand",
            marker=dict(color="#10b981"),
        )
    )
    fig.add_trace(
        go.Bar(
            x=p_eval["date"],
            y=p_eval["predicted_demand"],
            name="Model Predicted",
            marker=dict(color="#38bdf8"),
        )
    )

    # Compute MAE
    mae = (p_eval["actual_demand"] - p_eval["predicted_demand"]).abs().mean()

    fig.update_layout(
        barmode="group",
        title=f"<b>Model Evaluation (Last 7 Days):</b> Actual vs Predicted [MAE: {mae:.2f} units]",
        title_font=dict(size=15, color="#f8fafc"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(15, 23, 42, 0.6)",
        font=dict(color="#cbd5e1"),
        xaxis=dict(gridcolor="#334155", title="Date"),
        yaxis=dict(gridcolor="#334155", title="Units"),
        legend=dict(orientation="h", yanchor="bottom", y=-0.25),
        margin=dict(l=20, r=20, t=50, b=40),
        height=360,
    )
    return fig


def render_alert_cards(metrics_df: pd.DataFrame):
    """Renders contextual stockout and overstock alerts with plain-English reasoning."""
    critical_items = metrics_df[metrics_df["stock_risk"] == "🚨 High Stockout Risk"]
    warning_items = metrics_df[metrics_df["stock_risk"] == "⚠️ Reorder Soon"]
    overstock_items = metrics_df[metrics_df["stock_risk"] == "📦 Overstocked"]

    if critical_items.empty and warning_items.empty and overstock_items.empty:
        st.success("🎉 All inventory levels are balanced! No stockout or overstock risks detected.")
        return

    # Critical Alerts
    if not critical_items.empty:
        st.markdown("#### 🚨 Critical Stockout Risks (Immediate Action Required)")
        for _, row in critical_items.iterrows():
            st.error(
                f"**{row['product_id']} — {row['product_name']}**\n\n"
                f"• **Current Stock:** `{row['current_stock']} units` | **Lead Time:** `{row['lead_time_days']} days`\n\n"
                f"• **Reason:** {row['risk_reason']}\n\n"
                f"• **Action:** Reorder **{row['recommended_reorder_qty']} units** immediately (Est. Cost: `${row['recommended_reorder_qty'] * row['unit_cost']:,.2f}`)."
            )

    # Warning Alerts
    if not warning_items.empty:
        with st.expander(f"⚠️ Reorder Soon Warnings ({len(warning_items)} products)"):
            for _, row in warning_items.iterrows():
                st.warning(
                    f"**{row['product_id']} — {row['product_name']}**\n\n"
                    f"• **Stock:** `{row['current_stock']} units` (Reorder Point: `{row['reorder_point']} units`)\n\n"
                    f"• **Reason:** {row['risk_reason']}\n\n"
                    f"• **Suggested Reorder:** **{row['recommended_reorder_qty']} units**."
                )

    # Overstock Alerts
    if not overstock_items.empty:
        with st.expander(f"📦 Overstock & Capital Optimization ({len(overstock_items)} products)"):
            for _, row in overstock_items.iterrows():
                st.info(
                    f"**{row['product_id']} — {row['product_name']}**\n\n"
                    f"• **Stock:** `{row['current_stock']} units` (Days of Supply: `{row['days_of_supply']} days`)\n\n"
                    f"• **Reason:** {row['risk_reason']}\n\n"
                    f"• **Recommendation:** Pause purchase orders or consider a promotional discount."
                )
