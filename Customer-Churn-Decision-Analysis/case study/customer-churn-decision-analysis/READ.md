# Customer Churn Decision Analysis

A flagship, end-to-end data science case study focused on **understanding why customers leave and what a company should do about it**.

This project treats churn as a **decision problem**, not just a prediction task. Emphasis is placed on interpretability, business relevance, and ethical modeling rather than algorithmic complexity.

---

## Business Problem

Customer churn directly impacts revenue, growth, and long-term sustainability. Many early-stage and growing companies struggle to answer two critical questions:

1. Why are customers leaving?
2. Which actions will meaningfully reduce churn?

Due to limited access to real customer data and low response rates, this project uses a **synthetic but behaviorally realistic dataset** designed to mirror common subscription and service-based business patterns.

The goal is **decision support**, not perfect prediction accuracy.

---

## Key Objectives

* Identify behavioral drivers of customer churn
* Distinguish actionable signals from noise
* Build interpretable models that support business decisions
* Demonstrate a production-ready project structure suitable for real organizations

---

## Project Structure

```
customer-churn-decision-analysis/
│
├── app/
│   └── churn_dashboard.py          # Streamlit decision dashboard
├── data/
│   └── synthetic_customer_churn.csv # Generated dataset
├── notebooks/
│   ├── 01_data_generation.ipynb
│   ├── 02_exploratory_analysis.ipynb
│   └── 03_modeling_and_explainability.ipynb
├── reports/
│   └── executive_summary.pdf       # CEO-facing summary
├── requirements.txt
└── README.md
```

---

## Data Strategy

### Why Synthetic Data?

* Real customer data was unavailable or misaligned with the study requirements
* Synthetic data allows controlled experimentation
* Behavioral logic was designed to reflect real-world churn dynamics

### Key Features

* Customer tenure
* Usage frequency
* Payment method
* Complaint frequency
* Discount usage
* Plan type
* Monthly charges
* Churn flag (Yes/No)

Churn is **not random** — it is generated based on realistic risk factors such as early tenure, low engagement, and high complaints.

---

## Methodology

### 1. Data Generation

Synthetic data is created with explicit assumptions about customer behavior and churn risk. These assumptions are documented and transparent.

### 2. Exploratory Data Analysis (EDA)

* Distribution analysis
* Churn rate baseline
* Relationship between churn and behavioral features
* Business-oriented interpretation of patterns

### 3. Modeling

Models are chosen for **interpretability**:

* Logistic Regression (baseline, explainable)
* Decision Tree (rule-based insight)

Model evaluation prioritizes:

* Precision and recall
* Feature influence
* Decision clarity

### 4. Explainability

Rather than optimizing black-box performance, the project focuses on:

* Understanding why predictions occur
* Translating model outputs into business actions

---

## Key Insights

* Complaint frequency is the strongest predictor of churn
* Customers in early tenure are significantly more likely to leave
* Low usage frequency correlates with disengagement
* Heavy reliance on discounts indicates unstable retention

Importantly, **discounting alone does not solve churn**.

---

## Business Recommendations

* Strengthen onboarding and the first 90 days of customer experience
* Treat complaints as early churn warning signals
* Reduce dependency on discounts and focus on value delivery
* Increase meaningful customer engagement

Detailed recommendations are documented in the executive summary.

---

## Streamlit Dashboard

A lightweight Streamlit app provides a business-facing view of churn metrics and drivers.

To run locally:

```bash
pip install -r requirements.txt
streamlit run app/churn_dashboard.py
```

The app is designed to be path-safe and deployable on Streamlit Cloud.

---

## Ethics & Limitations

* Synthetic data limits direct generalization
* Results are directional, not prescriptive
* Models are interpretable by design to reduce hidden bias
* This framework should be re-applied when real customer data becomes available

Ethical considerations are treated as a first-class concern, not an afterthought.

---

## Who This Project Is For

* Recruiters evaluating real-world data science skills
* Hiring managers seeking decision-oriented analysts
* Students transitioning from notebooks to production-grade projects
* Founders interested in churn reduction strategies

---

## Final Note

This project intentionally prioritizes **thinking quality, clarity, and business alignment** over algorithmic novelty.

It reflects how data science operates in real organizations — where decisions, not models, determine outcomes.
