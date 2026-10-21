import streamlit as st
import pandas as pd

data = pd.read_csv("../data/synthetic_customer_churn.csv")

st.title("Customer Churn Decision Dashboard")

st.metric("Overall Churn Rate", f"{data['churn'].mean():.2%}")

st.subheader("Churn by Tenure")
st.line_chart(data.groupby('tenure_months')['churn'].mean())

st.subheader("High-Risk Customers")
st.dataframe(data[data['churn'] == 1].head(20))
