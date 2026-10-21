import cv2
import os

# Define dataset path
DATA_FOLDER = r"C:\Users\lirda\OneDrive\Desktop\Open CV face detecction\Facedetection\data"

# Ensure dataset folder exists
if not os.path.exists(DATA_FOLDER):
    os.makedirs(DATA_FOLDER)

def generate_dataset(user_id):
    """Captures images from webcam and saves them in dataset."""
    video_capture = cv2.VideoCapture(0)
    faceCascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

    if faceCascade.empty():
        print("Error: Face cascade file is missing.")
        exit()

    print(f"Collecting face data for User ID: {user_id}")
    img_id = 0

    while True:
        ret, frame = video_capture.read()
        if not ret:
            print("Error: Could not read frame from webcam.")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = faceCascade.detectMultiScale(gray, 1.1, 10)

        for (x, y, w, h) in faces:
            roi_gray = gray[y:y+h, x:x+w]
            file_path = os.path.join(DATA_FOLDER, f"user.{str(user_id)}.{str(img_id)}.jpg")
            cv2.imwrite(file_path, roi_gray)
            img_id += 1
            print(f"Saved {file_path}")

            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

        cv2.imshow("Face Capture", frame)

        # Stop after collecting 500 images or press 'q' to quit
        if img_id >= 500 or cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()
    print(f"Collected {img_id} images for User ID {user_id}")

# Ask for User ID
user_id = input("Enter a unique User ID: ")
generate_dataset(user_id)
