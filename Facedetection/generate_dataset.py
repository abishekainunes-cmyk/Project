"""
Automated Facial Biometric Sample Capture & Augmentation
Engineered by: Abishek Pranav G V
Captures grayscale normalized face crops for training LBPH classifiers.
"""

import cv2
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FOLDER = os.path.join(BASE_DIR, "data")
CASCADE_FACE = os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml")

if not os.path.exists(DATA_FOLDER):
    os.makedirs(DATA_FOLDER, exist_ok=True)

def generate_dataset(user_id, max_samples=100):
    face_cascade = cv2.CascadeClassifier(CASCADE_FACE)
    if face_cascade.empty():
        print(f"[-] Error: Face cascade missing at {CASCADE_FACE}")
        sys.exit(1)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[-] Error: Camera hardware inaccessible.")
        sys.exit(1)

    print(f"[+] Commencing biometric signature enrollment for User ID: {user_id}")
    print(f"[+] Target: {max_samples} normalized samples. Press 'q' to abort.")

    img_id = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(80, 80))

        for (x, y, w, h) in faces:
            roi_gray = gray[y:y+h, x:x+w]
            # Standardize face crop dimensions for LBPH
            roi_resized = cv2.resize(roi_gray, (200, 200))
            
            file_path = os.path.join(DATA_FOLDER, f"user.{user_id}.{img_id}.jpg")
            cv2.imwrite(file_path, roi_resized)
            img_id += 1

            # Progress overlay
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f"Samples: {img_id}/{max_samples}", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        cv2.imshow("Biometric Enrollment Capture", frame)
        if img_id >= max_samples or (cv2.waitKey(1) & 0xFF == ord('q')):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"[+] Enrollment complete. Captured {img_id} samples in {DATA_FOLDER}")

if __name__ == "__main__":
    uid = input("Enter Numeric User ID (e.g. 1 for Admin, 2 for Operator): ").strip()
    if not uid.isdigit():
        print("[-] Invalid user ID. Must be integer.")
        sys.exit(1)
    generate_dataset(int(uid))
