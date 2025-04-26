import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import librosa
import numpy as np
import base64
import io
import soundfile as sf
from matplotlib import pyplot as plt

# Pour téléchargement Spotify/YouTube
import subprocess

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def download_audio_from_spotify(spotify_url, output_path):
    """Télécharge l'audio depuis un lien Spotify (via spotdl)."""
    # Nécessite spotdl installé et configuré
    cmd = [
        "spotdl",
        spotify_url,
        "--output",
        output_path,
        "--format",
        "wav"
    ]
    subprocess.run(cmd, check=True)
    # spotdl nomme le fichier automatiquement, on récupère le premier .wav
    for file in os.listdir(output_path):
        if file.endswith(".wav"):
            return os.path.join(output_path, file)
    return None

def analyze_audio(filepath):
    y, sr = librosa.load(filepath, sr=None)
    duration = librosa.get_duration(y=y, sr=sr)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)
    key_idx = np.argmax(chroma_mean)
    key = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][key_idx]
    # Spectrogramme
    S = librosa.stft(y)
    S_db = librosa.amplitude_to_db(np.abs(S), ref=np.max)
    fig, ax = plt.subplots(figsize=(6, 3))
    img = librosa.display.specshow(S_db, sr=sr, x_axis='time', y_axis='hz', ax=ax)
    plt.colorbar(img, ax=ax, format="%+2.0f dB")
    plt.title('Spectrogram')
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    spectro_b64 = base64.b64encode(buf.read()).decode('utf-8')
    return {
        "duration": duration,
        "bpm": tempo,
        "key": key,
        "spectrogram": spectro_b64
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'spotify_url' in request.form:
            spotify_url = request.form['spotify_url']
            with tempfile.TemporaryDirectory() as tmpdir:
                wav_path = download_audio_from_spotify(spotify_url, tmpdir)
                if not wav_path:
                    return jsonify({"error": "Audio download failed."}), 400
                result = analyze_audio(wav_path)
        elif 'audio' in request.files:
            audio_file = request.files['audio']
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                audio_file.save(tmp.name)
                result = analyze_audio(tmp.name)
                os.unlink(tmp.name)
        else:
            return jsonify({"error": "No audio or Spotify URL provided."}), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
