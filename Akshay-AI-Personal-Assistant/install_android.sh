#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================
#  AKSHAY: Automated 1-Click Termux Setup Script for Android
# ==============================================================

echo "=========================================================="
echo " Setting up Akshay Autonomous Personal AI on Android"
echo "=========================================================="

pkg update -y && pkg upgrade -y
pkg install -y python git termux-api

# Install python requirements
pip install --upgrade pip
pip install pydantic

echo "=========================================================="
echo " Starting Akshay Core Server on Android localhost:8085"
echo "=========================================================="

python server.py &

sleep 2

# Open in mobile browser
termux-open-url http://localhost:8085

echo "[*] Akshay is running live on your phone!"
echo "[*] Tap 'Add to Home Screen' in Chrome for the native app experience."
