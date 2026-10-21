import cv2
import os

# Directory to store dataset images
DATA_FOLDER = r"C:\Users\lirda\OneDrive\Desktop\Open CV face detecction\Facedetection\data"

# Ensure dataset folder exists
if not os.path.exists(DATA_FOLDER):
    os.makedirs(DATA_FOLDER)

# Dictionary to store user ID to name mapping
USER_NAMES = {
    1: "Andiee",
    2: "Shriyans",
    3: "Mehraj",
    4: "Sir"
    # Add more user IDs and names as needed
}

def generate_dataset(img, user_id, img_id):
    """Save captured images for training the face recognizer."""
    file_path = os.path.join(DATA_FOLDER, f"user.{str(user_id)}.{str(img_id)}.jpg")
    cv2.imwrite(file_path, img)
    print(f"Image saved to {file_path}")

def draw_boundary(img, classifier, scaleFactor, minNeighbors, color, clf):
    """Detect faces and predict identity based on trained classifier."""
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    features = classifier.detectMultiScale(gray_img, scaleFactor, minNeighbors)
    coords = []

    for (x, y, w, h) in features:
        cv2.rectangle(img, (x, y), (x+w, y+h), color, 2)

        id, confidence = clf.predict(gray_img[y:y+h, x:x+w])
        confidence_text = f"{round(100 - confidence, 2)}%"

        if confidence < 50:  # Higher confidence = better match
            name = USER_NAMES.get(id, f"User {id}")
        else:
            name = "Unknown"

        cv2.putText(img, f"{name} ({confidence_text})", (x, y-4), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 1, cv2.LINE_AA)
        coords = [x, y, w, h]

    return coords

def recognize(img, clf, faceCascade):
    """Recognize faces using trained model."""
    colors = {"white": (255, 255, 255)}
    draw_boundary(img, faceCascade, 1.1, 10, colors["white"], clf)
    return img

# Load face detection classifiers
faceCascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

# Load trained face recognizer model
clf = cv2.face.LBPHFaceRecognizer_create()
clf.read("classifier.yml")

if faceCascade.empty():
    print("Error: Face cascade file is missing.")
    exit()

# Initialize webcam
video_capture = cv2.VideoCapture(0)

if not video_capture.isOpened():
    print("Error: Could not open webcam.")
    exit()

img_id = 0

while True:
    ret, img = video_capture.read()
    if not ret:
        print("Error: Could not read frame from webcam.")
        break

    img = recognize(img, clf, faceCascade)
    cv2.imshow("Face Recognition", img)
    img_id += 1

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()
