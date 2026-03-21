import requests
from gtts import gTTS
import os
import pygame
import time


def get_rj_intro_and_play(spotify_url):
    # 1. Request data from your FastAPI REST API
    api_url = "http://127.0.0.1:8000/rj-intro"
    params = {"url": spotify_url}

    print(f"--- Fetching intro for: {spotify_url} ---")
    response = requests.get(api_url, params=params)

    if response.status_code == 200:
        data = response.json()
        rj_script = data["rj_intro"]
        song_info = data["metadata"]

        print(f"Song: {song_info['song']} by {song_info['artist']}")
        print(f"RJ Script: {rj_script}")

        # 2. Convert Text to Speech (TTS)
        tts = gTTS(text=rj_script, lang="en", tld="com")
        filename = "intro.mp3"
        tts.save(filename)

        # 3. Play the audio
        play_audio(filename)
    else:
        print(f"Error: {response.status_code} - {response.text}")


def play_audio(file_path):
    pygame.mixer.init()
    pygame.mixer.music.load(file_path)
    pygame.mixer.music.play()

    # Wait for the audio to finish playing
    while pygame.mixer.music.get_busy():
        time.sleep(1)

    # Cleanup file so we can overwrite it next time
    pygame.mixer.quit()
    os.remove(file_path)


if __name__ == "__main__":
    test_url = input("Enter the Spotify track URL: ")
    get_rj_intro_and_play(test_url)
