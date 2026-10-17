# SmartStock AI — Project Specification

## Overview
SmartStock AI is an AI-powered inventory intelligence and demand forecasting system built for an 8-hour hackathon.

## Team & Responsibilities
- **Mobin (Member 1)**: Branch `feature/backend-ml` — AI/ML demand forecasting engine, chronological model evaluation, inventory risk analysis, and reorder logic.
- **Ajinkya (Member 2)**: Branch `feature/frontend` — Streamlit dashboard and user interaction.
- **Parth (Member 3)**: Branch `feature/data-testing` — Data preparation, cleaning pipelines, and verification suites.

## Repository & Branching Strategy
- **Repository**: `https://github.com/mobin-25/AI-ML-Hackathon`
- **Active Branch**: `feature/backend-ml`
- **Base/Integration Branch**: `main`

## Core Integration Contracts
1. **Sales Input Schema**:
   - `date`: Date or ISO string
   - `product_id`: String / Integer unique identifier
   - `quantity_sold`: Non-negative numeric sales volume
2. **Inventory Input Schema**:
   - `product_id`: Identifier matching sales data
   - `product_name`: Descriptive item name
   - `current_stock`: Current on-hand quantity
   - `lead_time_days`: Supplier lead time in days
   - `unit_cost`: Cost per unit
3. **Forecast Output Schema**:
   - `product_id`: Item identifier
   - `date`: Future date (7-day forecast horizon)
   - `predicted_demand`: Non-negative predicted demand

## Tech Stack
- Python 3.14 / 3.13
- Pandas & NumPy
- Scikit-learn (for evaluation metrics MAE, RMSE)
- Pytest (for test automation)
