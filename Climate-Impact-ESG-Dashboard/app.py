import os
from dotenv import load_dotenv

# This looks for a .env file and loads the variables into the environment
load_dotenv()

# Now you can access it securely
API_KEY = os.getenv("OPENWEATHER_API_KEY")

import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime
import os

# Import our custom modules
from database_utils import init_db, save_log, load_history
import engine

# Config
API_KEY = os.getenv("OPENWEATHER_API_KEY", "YOUR_API_KEY")
LAT, LON = "11.0168", "76.9558"

st.set_page_config(page_title="ESG Monitor", layout="wide")
init_db()

# --- Sidebar ---
with st.sidebar:
    st.header("Shipment Parameters")
    dist = st.number_input("Distance (km)", min_value=10, value=500)
    fuel = st.selectbox("Vehicle", ["Diesel", "Petrol", "Electric"])
    threshold = st.slider("Risk Threshold", 30, 90, 60)
    fetch_btn = st.button("Analyze Shipment")

# --- Main Logic ---
if fetch_btn:
    aqi, temp, wind = engine.get_live_environment(LAT, LON, API_KEY)
    carbon = engine.calculate_carbon(dist, fuel)
    risk = engine.calculate_risk_score(carbon, aqi, wind)
    decision = "Delay" if risk > threshold else "Proceed"
    
    # Save to DB
    log = {"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 
           "distance": dist, "fuel": fuel, "aqi": aqi, "temperature": temp, 
           "wind_speed": wind, "carbon": carbon, "risk_score": risk, "decision": decision}
    save_log(log)

    # UI Metrics
    m1, m2, m3 = st.columns(3)
    m1.metric("Risk Score", f"{risk}%")
    m2.metric("CO2", f"{carbon}kg")
    m3.metric("Decision", decision)

# --- History ---
st.divider()
history_df = load_history()
if not history_df.empty:
    fig = px.line(history_df, x="timestamp", y="risk_score", title="Risk Trend")
    st.plotly_chart(fig, use_container_width=True)
    st.dataframe(history_df)
