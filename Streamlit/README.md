# Streamlit AI Analytics & Data Science Interactive Studio 📊⚡

[![Streamlit App](https://img.shields.io/badge/Streamlit-Cloud%20Interactive%20Studio-FF4B4B?style=for-the-badge&logo=streamlit)](https://github.com/AbishekPranavGV/Streamlit)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Plotly](https://img.shields.io/badge/Visualization-Plotly%20Express-239120?style=for-the-badge&logo=plotly)](https://plotly.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **Interactive Data Science & Applied AI Decision Workbench.**  
> A high-performance Streamlit analytics application integrating asymmetric business loss modeling, econometric time-series demand forecasting (Prophet vs. ARIMA), multi-model LLM inference token estimation, and industrial instrumentation data exploration.

---

## 🎯 Studio Capabilities

1. **Machine Learning Diagnostics & Asymmetric Loss Curve:**
   - Evaluates classification thresholds ($\tau$) against real-world asymmetric business costs (where False Negatives carry a $5\times$ higher cost than False Positives).
2. **Time-Series Demand Forecasting & ROP Simulation:**
   - Visualizes historical POS sales data and projects 30-day ahead demand curves using additive seasonality decomposition.
3. **Enterprise LLM Token & Cost Estimator:**
   - Real-time pricing calculator comparing monthly token budgets across **Google Gemini 2.5 Flash**, **Claude 3.5 Sonnet**, and **GPT-4o**.
4. **Multimodal Instrumentation Explorer:**
   - Interactive database inspector for metrological sensor ranges, tolerances, and calibration standards.

---

## 🏗️ Architectural Flow

```mermaid
flowchart TD
    A[Streamlit UI Interface] --> B{Module Dispatcher}
    B -->|ML Diagnostics| C[Asymmetric Cost Curve & Confusion Matrix]
    B -->|Time-Series ROP| D[Additive Seasonality Demand Projection]
    B -->|LLM Cost Estimator| E[Token Budget Multi-Model Comparison]
    B -->|Product Explorer| F[Interactive Instrumentation Dataframe]

    C --> G[Plotly Dark Visualizer]
    D --> G
    E --> H[Real-Time Pricing Engine]
    F --> I[Dynamic Data Table]
```

---

## 💻 Local Installation & Execution

```bash
# Clone the repository
git clone https://github.com/AbishekPranavGV/Streamlit.git
cd Streamlit

# Install required dependencies
pip install -r requirements.txt

# Run the interactive studio locally
streamlit run streamlit_app.py
```

---

## 👤 Author
**Abishek Pranav G V**  
AI Engineer & Intelligent Systems Specialist  
- **Portfolio:** [abishekpranavportfolio.vercel.app](https://abishekpranavportfolio.vercel.app)  
- **GitHub:** [@AbishekPranavGV](https://github.com/AbishekPranavGV)  
- **LinkedIn:** [Abishek Pranav G V](https://www.linkedin.com/in/abishek-pranav-g-v-/)
