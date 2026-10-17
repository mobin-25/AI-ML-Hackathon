# SmartStock AI — Implementation Roadmap

## Milestone 1: Hackathon ML & Inventory Engine MVP

### Phase 1: Inspect & Define Contracts
**Goal**: Verify Git repository state, lock schema definitions, define public function signatures, and setup dependencies.
- **Tasks**:
  1. Verify branch `feature/backend-ml` and repository cleanliness.
  2. Create minimal `requirements.txt` (`pandas`, `numpy`, `scikit-learn`, `pytest`).
  3. Formalize API contracts for `src/forecast.py` and `src/inventory.py`.
- **Status**: Completed / Ready for Phase 2

### Phase 2: Implement Forecasting Baseline & Evaluation
**Goal**: Implement `src/forecast.py` with sales data processing, 7-day moving-average forecast, cold-start handling, and chronological MAE/RMSE evaluation.
- **Tasks**:
  1. `validate_sales_data(df: pd.DataFrame) -> pd.DataFrame`
  2. `forecast_demand_7days(sales_df: pd.DataFrame, window: int = 7) -> pd.DataFrame`
  3. `evaluate_forecast(sales_df: pd.DataFrame, test_days: int = 7, window: int = 7) -> dict`
- **Status**: Not Started

### Phase 3: Implement Inventory Risk Analysis & Reorder Logic
**Goal**: Implement `src/inventory.py` to analyze stockout risk, overstock risk, lead time demand, and calculate recommended reorder quantities.
- **Tasks**:
  1. `validate_inventory_data(df: pd.DataFrame) -> pd.DataFrame`
  2. `analyze_inventory_risk(inventory_df: pd.DataFrame, forecast_df: pd.DataFrame, service_level_factor: float = 1.65, overstock_buffer_days: int = 30) -> pd.DataFrame`
- **Status**: Not Started

### Phase 4: Verify & Integration Readiness
**Goal**: Build tests/verification scripts, verify imports across Windows filesystem, document usage instructions for Ajinkya (Streamlit frontend), and prepare clean Git commits.
- **Tasks**:
  1. Create `tests/test_smartstock.py` and synthetic benchmark suite.
  2. Execute pytest and resolve any regressions.
  3. Document import guide for Streamlit dashboard team.
- **Status**: Not Started
