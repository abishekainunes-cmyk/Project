"""
Real-Time Biometric Facial Recognition: Edge Pipeline
Engineered by: Abishek Pranav G V
Supports: OpenCV 4.8+, Multi-Stage Haar Cascades & LBPH Face Recognizer
"""

import cv2
import os
import sys

# Dynamic relative paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FOLDER = os.path.join(BASE_DIR, "data")
MODEL_FILE = os.path.join(BASE_DIR, "classifier.yml")
CASCADE_FACE = os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml")
CASCADE_EYES = os.path.join(BASE_DIR, "haarcascade_eye.xml")
CASCADE_NOSE = os.path.join(BASE_DIR, "haarcascade_mcs_nose.xml")
CASCADE_MOUTH = os.path.join(BASE_DIR, "haarcascade_mcs_mouth.xml")

# Enrolled users directory mapping
USER_NAMES = {
    1: "Abishek Pranav G V (Omega)",
    2: "Operator 04 (Beta)",
    3: "Engineer 09 (Alpha)",
    4: "Security Personnel"
}

def load_cascades():
    cascades = {
        'face': cv2.CascadeClassifier(CASCADE_FACE),
        'eyes': cv2.CascadeClassifier(CASCADE_EYES) if os.path.exists(CASCADE_EYES) else None,
        'nose': cv2.CascadeClassifier(CASCADE_NOSE) if os.path.exists(CASCADE_NOSE) else None,
        'mouth': cv2.CascadeClassifier(CASCADE_MOUTH) if os.path.exists(CASCADE_MOUTH) else None
    }
    if cascades['face'].empty():
        print(f"[-] Error: Face cascade missing at {CASCADE_FACE}")
        sys.exit(1)
    return cascades

def run_recognition():
    cascades = load_cascades()

    # Load trained LBPH model if present
    clf = None
    if os.path.exists(MODEL_FILE):
        try:
            clf = cv2.face.LBPHFaceRecognizer_create()
            clf.read(MODEL_FILE)
            print(f"[+] Loaded trained LBPH biometric weights from {MODEL_FILE}")
        except Exception as e:
            print(f"[!] Warning: Could not initialize cv2.face ({e}). Running in pure landmark detection mode.")
    else:
        print(f"[!] Model {MODEL_FILE} not found. Running multi-stage cascade detection.")

    # Open Camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[-] Error: Could not access video capture hardware (Camera 0).")
        return

    print("[+] Biometric Recognition Terminal Active. Press 'q' to exit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray) # Histogram equalization for illumination invariance

        faces = cascades['face'].detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(60, 60))

        for (x, y, w, h) in faces:
            roi_gray = gray[y:y+h, x:x+w]
            roi_color = frame[y:y+h, x:x+w]

            # LBPH Prediction
            name = "Verifying..."
            conf_str = ""
            box_color = (0, 255, 0)

            if clf is not None:
                try:
                    pred_id, confidence = clf.predict(roi_gray)
                    conf_str = f"chi2: {round(confidence, 1)}"
                    if confidence < 50: # Chi-square distance threshold
                        name = USER_NAMES.get(pred_id, f"Subject #{pred_id}")
                        box_color = (0, 255, 0) # Green for verified
                    else:
                        name = "Alert: Intruder"
                        box_color = (0, 0, 255) # Red for alert
                except Exception:
                    pass

            # Draw Frontal Face Box
            cv2.rectangle(frame, (x, y), (x+w, y+h), box_color, 2)
            cv2.rectangle(frame, (x, y - 30), (x + w, y), box_color, -1)
            cv2.putText(frame, f"{name} {conf_str}", (x + 6, y - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2, cv2.LINE_AA)

            # Secondary Ocular Cascade
            if cascades['eyes']:
                eyes = cascades['eyes'].detectMultiScale(roi_gray, 1.1, 4)
                for (ex, ey, ew, eh) in eyes:
                    cv2.rectangle(roi_color, (ex, ey), (ex+ew, ey+eh), (255, 255, 0), 1)

            # Secondary Nasal Cascade
            if cascades['nose']:
                noses = cascades['nose'].detectMultiScale(roi_gray, 1.1, 4)
                for (nx, ny, nw, nh) in noses:
                    cv2.rectangle(roi_color, (nx, ny), (nx+nw, ny+nh), (0, 255, 255), 1)

            # Secondary Oral Cascade
            if cascades['mouth']:
                mouths = cascades['mouth'].detectMultiScale(roi_gray, 1.1, 8)
                for (mx, my, mw, mh) in mouths:
                    if my > h / 2: # Mouth should be in bottom half of face
                        cv2.rectangle(roi_color, (mx, my), (mx+mw, my+mh), (255, 0, 255), 1)

        cv2.imshow("AERO-BIO // Quantum Biometric Terminal (OpenCV Edge)", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_recognition()
