"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Pause, Play, Send } from "lucide-react";
import "@/app/globals.css";

interface Message {
  type: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function RadioJockey() {
  const [trackName, setTrackName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSongInfo, setCurrentSongInfo] = useState<{
    title: string;
    artist: string;
    image?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synth = useRef<SpeechSynthesis>(
    typeof window !== "undefined" ? window.speechSynthesis : null,
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractSpotifyInfo = async (url: string) => {
    // Parse Spotify URL to get track ID
    const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    if (!trackMatch) {
      return null;
    }

    // For demo purposes, return mock data
    // In production, you'd use the Spotify API
    const mockSongs: Record<string, any> = {
      "3n3Ppam7vgaVa1iaRUc9Lp": {
        title: "As It Was",
        artist: "Harry Styles",
      },
      "4cOdK2wGLETKBW3PvgPWqLp": {
        title: "Levitating",
        artist: "Dua Lipa",
      },
      "2takcwFFpEpqLacADreJ7N": {
        title: "Blinding Lights",
        artist: "The Weeknd",
      },
    };

    const trackId = trackMatch[1];
    return (
      mockSongs[trackId] || { title: "Unknown Track", artist: "Unknown Artist" }
    );
  };

  const handleSubmitSong = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(trackName);

    if (!trackName.trim()) return;

    try {
      setIsLoading(true);

      // Extract song info
      const songInfo = await fetch(
        `http://127.0.0.1:8000/rj-intro?q=${trackName}`,
      ).then((res) => res.json());

      console.log(songInfo.rj_intro);

      if (songInfo) {
        setCurrentSongInfo(songInfo);
        setIsPlaying(true);

        // Add user message
        const userMessage: Message = {
          type: "user",
          text: trackName,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Generate AI response
        await generateAIResponse(songInfo.rj_intro);
        setTrackName("");
      } else {
        alert("Could not parse Spotify URL. Please provide a valid track URL.");
      }
    } catch (error) {
      console.error("Error processing song:", error);
      alert("Error processing the song. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (songInfo: any) => {
    try {
      // For demo, we'll use local text-to-speech
      // In production, you'd call an API to generate AI commentary

      // Add AI message
      const aiMessage: Message = {
        type: "ai",
        text: songInfo,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Speak the response
      speakText(songInfo);
    } catch (error) {
      console.error("Error generating AI response:", error);
    }
  };

  const speakText = (text: string) => {
    if (!synth.current) return;

    // Cancel any ongoing speech
    if (synth.current.speaking) {
      synth.current.cancel();
    }

    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    synth.current.speak(utterance);
  };

  const togglePlayback = () => {
    if (isSpeaking && synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    } else if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex h-screen flex-col gap-0 overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">RadioAI</h1>
        <p className="text-sm text-muted-foreground">
          Your personal AI radio jockey
        </p>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 overflow-hidden p-6">
        {/* Left: Song Input & Visualization */}
        <div className="flex w-full flex-col gap-6 lg:w-2/3">
          {/* Song Input Card */}
          <Card className="border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Add a Song</h2>
            <form onSubmit={handleSubmitSong} className="flex gap-3">
              <Input
                type="text"
                placeholder="Paste Spotify track URL..."
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? "Loading..." : "Submit"}
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              Try: https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
            </p>
          </Card>

          {/* Now Playing Card */}
          {currentSongInfo && (
            <Card className="border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  NOW PLAYING
                </h3>
                <div className="flex h-2 gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        isPlaying
                          ? "h-8 bg-primary animate-pulse"
                          : "h-2 bg-muted"
                      }`}
                      style={{
                        animationDelay: isPlaying ? `${i * 100}ms` : "0ms",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 h-48 w-full rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Mic className="h-16 w-16 text-primary/30" />
                </div>
                <h2 className="text-2xl font-bold text-balance">
                  {currentSongInfo.title}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {currentSongInfo.artist}
                </p>
              </div>

              <Button
                onClick={togglePlayback}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
              >
                {isSpeaking || isPlaying ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Listen
                  </>
                )}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
