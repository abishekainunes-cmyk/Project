import cv2
import numpy as np
import os

def get_images_and_labels(data_folder):
    images = []
    labels = []
    for file in os.listdir(data_folder):
        if file.startswith("user"):
            path = os.path.join(data_folder, file)
            img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
            label = int(file.split(".")[1])  # Extract user ID from filename
            images.append(img)
            labels.append(label)
    return images, np.array(labels)

data_folder = r"C:\Users\lirda\OneDrive\Desktop\Open CV face detecction\Facedetection\data"

if not os.path.exists(data_folder):
    print("Error: Data folder does not exist. Please collect face data first.")
    exit()

# Initialize LBPH face recognizer
clf = cv2.face.LBPHFaceRecognizer_create()

print("Fetching images and labels...")
faces, ids = get_images_and_labels(data_folder)

if len(faces) == 0:
    print("Error: No images found for training.")
    exit()

print("Training classifier...")
clf.train(faces, ids)

# Save classifier model
classifier_path = "classifier.yml"
clf.write(classifier_path)
print(f"Classifier saved as {classifier_path}")
