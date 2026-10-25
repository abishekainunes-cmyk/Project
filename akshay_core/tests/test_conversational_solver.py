"""Unit tests for the non-parroting Conversational Solver Engine."""

import pytest
from akshay_core.workflows.conversational_solver import solve_user_request


def test_solver_tax_intent_direct_solution():
    res = solve_user_request("Compare tax for 16 Lakhs CTC under new regime")
    assert res["type"] == "tax_solution"
    assert "Recommended:" in res["solution"]
    assert "Net Monthly In-Hand:" in res["solution"]
    # Verify it does NOT parrot back the user prompt
    assert "Executing command:" not in res["solution"]
    assert "Compare tax for 16 Lakhs CTC" not in res["solution"]


def test_solver_runway_intent_direct_solution():
    res = solve_user_request("How long can I survive with 81750 if I spend 15000 a month?")
    assert res["type"] == "runway_solution"
    assert "Financial Runway:" in res["solution"]
    assert "Months" in res["solution"]
    assert "How long can I survive" not in res["solution"]


def test_solver_sip_intent_direct_solution():
    res = solve_user_request("Calculate SIP compounding for 15000 monthly for 10 years")
    assert res["type"] == "sip_solution"
    assert "Compounding Projection" in res["solution"]
    assert "Projected Wealth Corpus:" in res["solution"]


def test_solver_drug_safety_direct_solution():
    res = solve_user_request("Can I take sildenafil with nitroglycerin?")
    assert res["type"] == "medical_solution"
    assert "CONTRAINDICATED" in res["solution"]
    assert "hypotension" in res["solution"].lower()
    assert "Can I take sildenafil" not in res["solution"]


def test_solver_job_intent_direct_solution():
    res = solve_user_request("Apply to software engineer jobs")
    assert res["type"] == "job_bot_solution"
    assert "Auto-Apply Pipeline Completed" in res["solution"]


def test_solver_braindump_direct_solution():
    res = solve_user_request("Meet Dr. Sharma tomorrow at 4 PM to review blood test reports")
    assert res["type"] == "braindump_solution"
    assert "Calendar Event:" in res["solution"]
    assert "Action Tasks:" in res["solution"]
    assert ".ICS calendar file ready" in res["solution"]
