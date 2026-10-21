import requests
import os

# Constants
WEIGHTS = {"carbon": 0.5, "aqi": 0.3, "weather": 0.2}
MAX_EXPECTED_CARBON = 2000
MAX_WIND_SPEED = 20

def get_live_environment(lat, lon, api_key):
    # Fetch AQI
    aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
    aqi = requests.get(aqi_url).json()['list'][0]['main']['aqi']

    # Fetch Weather
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    resp = requests.get(weather_url).json()
    return aqi, resp['main']['temp'], resp['wind']['speed']

def calculate_carbon(distance, fuel):
    factors = {"Diesel": 2.68, "Petrol": 2.31, "Electric": 0.5}
    return distance * factors.get(fuel, 1.0)

def calculate_risk_score(carbon, aqi, wind_speed):
    c_norm = min(carbon / MAX_EXPECTED_CARBON, 1.0)
    a_norm = (aqi - 1) / 4
    w_norm = min(wind_speed / MAX_WIND_SPEED, 1.0)
    
    score = (WEIGHTS["carbon"] * c_norm + 
             WEIGHTS["aqi"] * a_norm + 
             WEIGHTS["weather"] * w_norm)
    return round(score * 100, 2)