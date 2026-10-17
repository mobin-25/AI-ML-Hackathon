# SmartStock AI — Requirements Specification

## 1. Sales Data Ingestion & Validation
- **REQ-SALES-01**: Accept sales data with columns `date`, `product_id`, `quantity_sold`.
- **REQ-SALES-02**: Parse and standardize date format.
- **REQ-SALES-03**: Validate non-negative quantities; handle missing or corrupt records gracefully with descriptive error messages.
- **REQ-SALES-04**: Handle multiple transactions per product per day by aggregating daily sales.

## 2. Seven-Day Demand Forecasting
- **REQ-FC-01**: Implement baseline 7-day daily demand forecasting per product in `src/forecast.py`.
- **REQ-FC-02**: Fill missing calendar dates in historical sales with zero demand.
- **REQ-FC-03**: Compute rolling moving-average forecast forward for 7 consecutive days.
- **REQ-FC-04**: Ensure all predicted quantities are strictly non-negative ($\ge 0$).
- **REQ-FC-05**: Safely handle cold-start products with sparse or zero historical records.
- **REQ-FC-06**: Return standard DataFrame with columns `product_id`, `date`, `predicted_demand`.

## 3. Model Evaluation
- **REQ-EVAL-01**: Implement chronological train/test split (default 7 days holdout).
- **REQ-EVAL-02**: Prevent temporal data leakage (test set must not leak into historical rolling windows).
- **REQ-EVAL-03**: Compute and report MAE (Mean Absolute Error) and RMSE (Root Mean Squared Error).
- **REQ-EVAL-04**: Provide clear status indicators and explanations when historical observations are insufficient.

## 4. Inventory Risk & Reorder Optimization
- **REQ-INV-01**: Accept inventory input with `product_id`, `product_name`, `current_stock`, `lead_time_days`, `unit_cost`.
- **REQ-INV-02**: Estimate lead-time demand using the forecast demand profile.
- **REQ-INV-03**: Compute safety stock buffer using configurable service factor and demand variability.
- **REQ-INV-04**: Calculate recommended reorder quantity; ensure recommendations are strictly non-negative ($\ge 0$).
- **REQ-INV-05**: Classify stockout risk and overstock risk with transparent, configurable thresholds.

## 5. Integration & Modularity
- **REQ-INT-01**: Expose clean public Python API in `src/forecast.py` and `src/inventory.py` importable from project root.
- **REQ-INT-02**: Clean separation of concerns — no Streamlit UI code in backend ML engine.
- **REQ-INT-03**: Provide verification suite covering standard, edge-case, and sparse data scenarios.
