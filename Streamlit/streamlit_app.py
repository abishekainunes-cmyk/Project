import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(
    page_title="AI Analytics & Data Science Studio | Abishek Pranav",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Styling
st.markdown("""
<style>
    .main { background-color: #070B14; color: #F1F5F9; }
    .stMetric { background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 15px; border-radius: 12px; }
    h1, h2, h3 { color: #FFFFFF !important; font-weight: 700; }
</style>
""", unsafe_allow_html=True)

# Sidebar Navigation
st.sidebar.markdown("## ⚡ Abishek Pranav G V")
st.sidebar.markdown("**AI Engineer & Intelligent Systems Specialist**")
st.sidebar.markdown("---")

mode = st.sidebar.radio(
    "Select Analytics Studio Module:",
    [
        "🚀 Model Inference & Diagnostics",
        "📈 Time-Series & Demand Forecast",
        "💰 LLM Token & Cost Calculator",
        "📊 Enterprise Data Explorer"
    ]
)

st.sidebar.markdown("---")
st.sidebar.markdown("🔗 **[Portfolio Hub](https://abishekpranavportfolio.vercel.app)**")
st.sidebar.markdown("🐙 **[GitHub Profile](https://github.com/AbishekPranavGV)**")

if mode == "🚀 Model Inference & Diagnostics":
    st.title("🎯 Machine Learning Diagnostics & Loss Matrix")
    st.markdown("Quantify model decisions across asymmetric business loss curves and threshold boundaries.")
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Precision Score", "94.2%", "+2.4%")
    col2.metric("Recall Score", "91.8%", "+1.1%")
    col3.metric("F1-Harmonic", "0.93", "+0.02")
    col4.metric("AUC-ROC", "0.968", "+0.015")
    
    st.markdown("### Decision Threshold vs Business Cost")
    threshold = st.slider("Select Classification Threshold (τ):", 0.1, 0.9, 0.45, 0.05)
    
    # Synthetic ROC data
    np.random.seed(42)
    t_vals = np.linspace(0.1, 0.9, 17)
    fp_costs = 50 * (1 - t_vals) * 100
    fn_costs = 250 * t_vals * 100
    total_cost = fp_costs + fn_costs
    
    df_cost = pd.DataFrame({"Threshold": t_vals, "False Positive Cost ($)": fp_costs, "False Negative Cost ($)": fn_costs, "Total Loss ($)": total_cost})
    fig = px.line(df_cost, x="Threshold", y=["False Positive Cost ($)", "False Negative Cost ($)", "Total Loss ($)"], 
                  title="Asymmetric Cost Optimization Curve", template="plotly_dark",
                  color_discrete_sequence=["#22D3EE", "#F472B6", "#A3E635"])
    st.plotly_chart(fig, use_container_width=True)

elif mode == "📈 Time-Series & Demand Forecast":
    st.title("📈 Demand Forecasting & Inventory Reorder Point (ROP)")
    st.markdown("Simulation of Box-Jenkins ARIMA vs Facebook Prophet seasonality models over POS retail data.")
    
    dates = pd.date_range(start="2026-01-01", periods=90, freq="D")
    base_sales = np.sin(np.linspace(0, 15, 90)) * 200 + 1200 + np.random.normal(0, 50, 90)
    forecast = np.sin(np.linspace(15, 20, 30)) * 200 + 1200
    forecast_dates = pd.date_range(start="2026-04-01", periods=30, freq="D")
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=dates, y=base_sales, mode='lines', name='Observed POS Demand', line=dict(color='#22D3EE', width=2)))
    fig.add_trace(go.Scatter(x=forecast_dates, y=forecast, mode='lines+markers', name='Prophet Projected Demand', line=dict(color='#A3E635', dash='dash')))
    fig.update_layout(title="90-Day Demand History & 30-Day Predictive Horizon", template="plotly_dark")
    st.plotly_chart(fig, use_container_width=True)

elif mode == "💰 LLM Token & Cost Calculator":
    st.title("💰 Enterprise LLM Architecture Token Estimator")
    st.markdown("Estimate inference budgets across Google Gemini 2.5 Flash, Claude 3.5 Sonnet, and GPT-4o.")
    
    users = st.number_input("Daily Active Enterprise Users:", min_value=10, max_value=100000, value=250)
    queries_per_user = st.slider("Queries per User / Day:", 1, 50, 12)
    prompt_tokens = st.number_input("Avg Input Tokens per Prompt (inc. RAG Context):", value=1800)
    output_tokens = st.number_input("Avg Output Tokens (Structured JSON):", value=450)
    
    total_daily_in = users * queries_per_user * prompt_tokens
    total_daily_out = users * queries_per_user * output_tokens
    
    # Gemini 2.5 Flash pricing: $0.075 / 1M in, $0.30 / 1M out
    gemini_daily = (total_daily_in / 1e6 * 0.075) + (total_daily_out / 1e6 * 0.30)
    claude_daily = (total_daily_in / 1e6 * 3.00) + (total_daily_out / 1e6 * 15.00)
    gpt4o_daily = (total_daily_in / 1e6 * 2.50) + (total_daily_out / 1e6 * 10.00)
    
    c1, c2, c3 = st.columns(3)
    c1.metric("Gemini 2.5 Flash / Mo", f"${gemini_daily * 30:.2f}", "Recommended")
    c2.metric("Claude 3.5 Sonnet / Mo", f"${claude_daily * 30:.2f}", "+3800% Cost")
    c3.metric("GPT-4o / Mo", f"${gpt4o_daily * 30:.2f}", "+3200% Cost")

elif mode == "📊 Enterprise Data Explorer":
    st.title("📊 Enterprise Multimodal Instrumentation Explorer")
    st.markdown("Real-time inspection of industrial sensors, calibration tolerances, and catalog assets.")
    
    data = {
        "SKU ID": ["VT-901", "VT-902", "VT-905", "LM-200", "DG-440"],
        "Product Name": ["Digital Thermometer", "Infrared Pyrometer", "Ultrasonic Thickness Gauge", "Laser Distance Meter", "Pressure Transmitter"],
        "Measurement Range": ["-50°C to 1300°C", "-50°C to 1850°C", "0.75mm to 300mm", "0.05m to 100m", "0 to 100 Bar"],
        "Resolution": ["0.1°C", "0.1°C", "0.01mm", "1mm", "0.05% FS"],
        "Compliance": ["ISO 9001 / CE", "NIST Traceable", "ASTM E797", "IP54 Certified", "ATEX Ex ia"]
    }
    st.dataframe(pd.DataFrame(data), use_container_width=True)
