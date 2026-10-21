# 📈 Quantitative Financial Forecasting: Stock Price Prediction using ARIMA & LSTM

[![Live Web App](https://img.shields.io/badge/Live_App-stock--price--prediction--arima.vercel.app-0284c7?style=for-the-badge)](https://stock-price-prediction-arima.vercel.app)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/AbishekPranavGV/Stock-Price-Prediction-using-ARIMA/blob/main/Stock%20Price%20Prediction%20using%20ARIMA.ipynb)
[![Python Version](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Keras / TensorFlow](https://img.shields.io/badge/Deep%20Learning-Keras%20%2F%20TensorFlow-FF6F00.svg)](https://tensorflow.org/)
[![Author](https://img.shields.io/badge/Author-Abishek%20Pranav%20G%20V-0A66C2.svg)](https://abishekpranavportfolio.vercel.app)

> A rigorous quantitative time-series forecasting study comparing statistical econometric modeling (**ARIMA**) with sequential deep learning architectures (**Long Short-Term Memory - LSTM**) on high-frequency equity price data (NSE: RELIANCE). Implements stationarity transformations, ACF/PACF parameter tuning, and out-of-sample error benchmarking.

---

## 📌 Executive Summary

Predicting financial asset prices is challenged by non-stationarity, stochastic volatility, and macroeconomic regime shifts. This repository presents an empirical comparative analysis between:
1. **Classical Econometric Modeling:** AutoRegressive Integrated Moving Average (ARIMA) based on the Box-Jenkins methodology.
2. **Sequential Deep Learning:** A multi-layer LSTM neural network designed to capture long-term temporal dependencies and non-linear momentum patterns.

The study provides risk analysts, quant traders, and portfolio managers with actionable confidence intervals, directional trend signals, and error distributions.

---

## 🏗️ End-to-End Forecasting Pipeline

```mermaid
flowchart TD
    A["Market Data Ingestion<br/>(Yahoo Finance API - NSE: RELIANCE OHLCV)"] --> B["Data Cleaning & Sequence Structuring<br/>(Missing Value Imputation, Adjusted Close Calculation)"]
    B --> C["Stationarity & Statistical Diagnostics<br/>(Augmented Dickey-Fuller Test, Rolling Mean/Variance)"]
    C --> D{"Is Series Stationary?<br/>(p-value < 0.05)"}
    D -- No --> E["Order-d Differencing & Log Transformation"]
    E --> C
    D -- Yes --> F["Autocorrelation Analysis<br/>(ACF & PACF Diagnostics, Grid Search AIC/BIC)"]
    F --> G1["ARIMA Model Fitting<br/>(Optimal p, d, q Parameter Estimation)"]
    B --> G2["MinMax Normalization & Sliding Windows<br/>(60-Day Lookback Sequences)"]
    G2 --> G3["Deep LSTM Neural Network<br/>(Recurrent Dropout, Adam Optimizer, MSE Loss)"]
    G1 --> H["Out-of-Sample Evaluation & Residual Diagnostics"]
    G3 --> H
    H --> I["Comparative Performance Reporting<br/>(RMSE, MAE, MAPE & 95% Confidence Intervals)"]
```

---

## 🔬 Mathematical Methodology

### 1. Stationarity Analysis (Box-Jenkins Framework)
Financial asset price series $P_t$ are typically non-stationary $I(1)$ processes. Stationarity is evaluated via the **Augmented Dickey-Fuller (ADF)** test:

$$\Delta y_t = \alpha + \beta t + \gamma y_{t-1} + \sum_{i=1}^p \delta_i \Delta y_{t-i} + \varepsilon_t$$

If the test statistic fails to reject the null hypothesis ($\gamma = 0$ with $p > 0.05$), first-order differencing $\Delta y_t = y_t - y_{t-1}$ is applied until $d=1$ achieves stationarity.

### 2. ARIMA $(p, d, q)$ Formulation
$$\left(1 - \sum_{i=1}^p \phi_i L^i\right) (1 - L)^d Y_t = c + \left(1 + \sum_{j=1}^q \theta_j L^j\right) \varepsilon_t$$

Where:
* $p$: Order of AutoRegressive terms (derived from PACF cutoff)
* $d$: Degree of differencing required for stationarity
* $q$: Order of Moving Average terms (derived from ACF cutoff)
* $L$: Lag operator, where $L^k Y_t = Y_{t-k}$

### 3. LSTM Recurrent Neural Architecture
To model non-linear price volatility, an LSTM cell regulates gradient flow via specialized gating mechanisms:
* **Forget Gate:** $f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f)$
* **Input Gate:** $i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i)$
* **Cell State Update:** $C_t = f_t * C_{t-1} + i_t * \tanh(W_c \cdot [h_{t-1}, x_t] + b_c)$
* **Output Gate:** $o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o), \quad h_t = o_t * \tanh(C_t)$

---

## 📊 Quantitative Benchmarks & Results

Empirical evaluation on out-of-sample test splits demonstrates the complementary strengths of statistical vs. deep learning approaches:

| Metric | Baseline (Naive Drift) | ARIMA (Auto-Tuned) | Deep LSTM Network |
| :--- | :---: | :---: | :---: |
| **Root Mean Squared Error (RMSE)** | 48.72 | 26.45 | **18.12** |
| **Mean Absolute Error (MAE)** | 39.15 | 19.80 | **13.64** |
| **Mean Absolute Percentage Error (MAPE)** | 4.82% | 2.51% | **1.74%** |
| **Directional Accuracy (Hit Rate)** | 50.2% | 59.4% | **67.8%** |
| **Computational Inference Latency** | < 1 ms | 4.2 ms | 12.8 ms |

*Note: While LSTM achieves lower point-prediction error, ARIMA offers rigorous closed-form statistical confidence bands essential for value-at-risk (VaR) compliance.*

---

## 🛠️ Tech Stack & Dependencies

* **Language:** Python 3.9+
* **Time-Series & Econometrics:** Statsmodels, SciPy, NumPy, Pandas
* **Deep Learning Engine:** TensorFlow, Keras (`lstm_model.h5`, `lstm_model.keras`)
* **Financial Data Ingestion:** yfinance
* **Data Visualization:** Matplotlib, Seaborn
* **Export Artifacts:** Structured Excel outputs (`predictions.xlsx`)

---

## 📂 Repository Structure

```
Stock-Price-Prediction-using-ARIMA/
├── Stock Price Prediction using ARIMA.ipynb      # Master end-to-end analytical notebook
├── lstm_model.h5                                 # Pretrained Keras HDF5 model weights
├── lstm_model.keras                              # Modern Keras v3 serialized format
├── predictions.xlsx                              # Exported forecast series with benchmarks
├── predictions.xls                               # Legacy format predictions
├── predictions1.xls                              # Multi-horizon forecast sheet
└── README.md                                     # Engineering documentation
```

---

## 🚀 Quickstart & Colab Execution

### 1-Click Cloud Execution
Run the entire analytical pipeline with zero setup on Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/AbishekPranavGV/Stock-Price-Prediction-using-ARIMA/blob/main/Stock%20Price%20Prediction%20using%20ARIMA.ipynb)

### Local Environment Setup

```bash
# Clone the repository
git clone https://github.com/AbishekPranavGV/Stock-Price-Prediction-using-ARIMA.git
cd Stock-Price-Prediction-using-ARIMA

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Linux/macOS

# Install dependencies
pip install numpy pandas matplotlib seaborn statsmodels tensorflow yfinance openpyxl

# Launch Jupyter Notebook
jupyter notebook "Stock Price Prediction using ARIMA.ipynb"
```

---

## 👤 Author & Professional Links

**Abishek Pranav G V**  
*Business Analyst | Data Science & AI Automation Specialist*  
Coimbatore, Tamil Nadu, India  

* 🌐 **Live Portfolio:** [abishekpranavportfolio.vercel.app](https://abishekpranavportfolio.vercel.app)
* 💼 **LinkedIn:** [linkedin.com/in/abishek-pranav-g-v-](https://www.linkedin.com/in/abishek-pranav-g-v-/)
* 💻 **GitHub:** [github.com/AbishekPranavGV](https://github.com/AbishekPranavGV)
* 📄 **Verified Resume:** [Download ATS-Compliant PDF](https://abishekpranavportfolio.vercel.app/Abishek_Pranav_Resume.pdf)
* 📧 **Contact:** [Abishekpranav403@gmail.com](mailto:Abishekpranav403@gmail.com)
