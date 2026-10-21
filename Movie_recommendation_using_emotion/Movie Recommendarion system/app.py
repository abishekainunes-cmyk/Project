from flask import Flask, render_template, request, redirect, url_for
import os
from deepface import DeepFace
import random
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)

# Configuration for file uploads
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Dictionary to map emotions to IMDb URLs
URLS = {
    "angry": 'https://www.imdb.com/search/title/?title_type=feature&genres=action',
    "disgust": 'https://www.imdb.com/search/title/?title_type=feature&genres=horror',
    "fear": 'https://www.imdb.com/search/title/?title_type=feature&genres=horror',
    "happy": 'https://www.imdb.com/search/title/?title_type=feature&genres=comedy',
    "sad": 'https://www.imdb.com/search/title/?title_type=feature&genres=drama',
    "surprise": 'https://www.imdb.com/search/title/?title_type=feature&genres=drama',
    "neutral": 'https://www.imdb.com/search/title/?title_type=feature&genres=drama',
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_emotion_from_image(image_location):
    try:
        result = DeepFace.analyze(image_location, actions=['emotion'])
        emotion = str(max(zip(result[0]['emotion'].values(), result[0]['emotion'].keys()))[1])
        print(f"Detected emotion: {emotion}")
    except Exception as e:
        print(f"Error detecting emotion: {e}")
        emotion = "neutral"  # Default to "neutral" if emotion detection fails
    return emotion

def get_movie_titles(emotion, url=None):
    url = URLS.get(emotion) if not url else url
    if not url:
        print("Invalid emotion.")
        return []
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Check for HTTP errors
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []

    soup = BeautifulSoup(response.text, "lxml")
    titles = [a.get_text() for a in soup.find_all('a', href=re.compile(r'/title/tt\d+/'))]
    return titles

def get_movies_for_emotion(image_location, limit=10):
    emotion = get_emotion_from_image(image_location)
    
    if emotion not in URLS:
        print(f"Emotion '{emotion}' not mapped, defaulting to 'neutral'.")
        emotion = "neutral"

    movie_titles = get_movie_titles(emotion)
    
    if not movie_titles:
        print("No titles found.")
        return []
    
    random.shuffle(movie_titles)
    return movie_titles[:limit]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return redirect(url_for('home'))

    file = request.files['image']
    if file.filename == '':
        return redirect(url_for('home'))

    if file and allowed_file(file.filename):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        emotion = get_emotion_from_image(filepath)
        movies = get_movies_for_emotion(filepath, limit=10)

        return render_template('result.html', emotion=emotion, movies=movies)

    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)