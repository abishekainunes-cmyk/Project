"""
LBPH Biometric Model Trainer
Engineered by: Abishek Pranav G V
Trains Local Binary Patterns Histograms (LBPH) on captured normalized face dataset.
"""

import cv2
import numpy as np
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FOLDER = os.path.join(BASE_DIR, "data")
MODEL_FILE = os.path.join(BASE_DIR, "classifier.yml")

def train_classifier():
    if not os.path.exists(DATA_FOLDER):
        print(f"[-] Error: Dataset directory {DATA_FOLDER} not found. Run generate_dataset.py first.")
        sys.exit(1)

    images = []
    labels = []

    files = [f for f in os.listdir(DATA_FOLDER) if f.startswith("user.")]
    if not files:
        print(f"[-] No training images found in {DATA_FOLDER}.")
        sys.exit(1)

    print(f"[+] Loading {len(files)} biometric face samples...")
    for f in files:
        path = os.path.join(DATA_FOLDER, f)
        img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            continue
        try:
            label = int(f.split(".")[1])
            images.append(img)
            labels.append(label)
        except Exception:
            continue

    if not images:
        print("[-] Error: No valid images could be parsed.")
        sys.exit(1)

    print(f"[+] Training LBPH Face Recognizer (Radius=1, Neighbors=8, Grid=8x8)...")
    clf = cv2.face.LBPHFaceRecognizer_create(radius=1, neighbors=8, grid_x=8, grid_y=8)
    clf.train(images, np.array(labels))

    clf.write(MODEL_FILE)
    print(f"[+] Training successful! Serialized weights saved to: {MODEL_FILE}")

if __name__ == "__main__":
    train_classifier()
