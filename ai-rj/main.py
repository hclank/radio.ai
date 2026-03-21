import os
import spotipy
import pyttsx3
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from spotipy.oauth2 import SpotifyClientCredentials
import google.genai as genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_manager = SpotifyClientCredentials(
    client_id=os.getenv("SPOTIFY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
)
sp = spotipy.Spotify(auth_manager=auth_manager)
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

RJ_SYSTEM_PROMPT = """
You are a charismatic, high-energy late-night Radio Jockey named 'RJ GEM'. 
Your job is to introduce a song based on the metadata provided. 
- Keep it short (2-3 sentences).
- Use radio lingo (e.g., 'cranking it up', 'on the airwaves', 'stay tuned').
- Be enthusiastic about the artist and the vibe of the album.
"""


def speak_offline(text: str):
    engine = pyttsx3.init()

    engine.setProperty("rate", 175)
    engine.setProperty("volume", 0.9)

    engine.say(text)
    engine.runAndWait()


@app.get("/play-song")
def play_song(track_uri: str):
    try:
        sp.start_playback(uris=[track_uri])
        return {"status": "Playing!"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/rj-intro")
def get_track_and_intro(q: str = Query(..., description="Spotify Track Name")):
    try:
        # 1. Fetch data from Spotify
        if "open.spotify.com" in q:
            # If it's a link, get track info directly
            track = sp.track(q)
        else:
            # If it's text, search and grab the very first result
            results = sp.search(q=q, type="track", limit=1)
            if not results["tracks"]["items"]:
                raise HTTPException(status_code=404, detail="Song not found")
            track = results["tracks"]["items"][0]

        # 2. Extract info for the RJ persona
        song_name = track["name"]
        artist_name = track["artists"][0]["name"]
        album_name = track["album"]["name"]
        uri = results["uri"]

        # 2. Send facts to Gemini to generate the RJ script
        prompt = f"The next song is '{song_name}' by '{artist_name}' from the album '{album_name}'. Give me a smooth intro! Give me information about the artist and a little bit about his background aswell in an entertaining way. If the song is from a movie, give a small idea about the movie and about the actors which act in the movie aswell."

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",  # Best for speed/free tier
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=RJ_SYSTEM_PROMPT,
                temperature=0.8,  # Higher temperature = more creative/random RJ talk
            ),
        )

        return {
            "metadata": {
                "song": song_name,
                "artist": artist_name,
                "album": album_name,
                "uri": uri,
            },
            "rj_intro": response.text.strip(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/track")
def get_info_from_track(name: str):
    try:
        track = sp.search(q=name, type="track", limit=1)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid Spotify track URL. Error: ${e}"
        )

    track_info = track["tracks"]["items"][0]

    return {
        "title": track_info["name"],
        "artist": track_info["artists"][0]["name"],
        "album": track_info["album"]["name"],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
