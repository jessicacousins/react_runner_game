import React, { useState, useEffect, useRef } from "react";
import Game from "./Game.jsx";
import "./index.css";

const CHARACTERS = [
  {
    id: "neon-comet",
    name: "Neon Comet",
    subtitle: "Combo hunter",
  },
  {
    id: "star-tetra",
    name: "Star Tetra",
    subtitle: "Shielded first hit",
  },
  {
    id: "ghost-koi",
    name: "Ghost Koi",
    subtitle: "Gentle hazards",
  },
];

const DIFFICULTIES = [
  {
    id: "calm",
    label: "Calm Reef",
    subtitle: "Fewer hazards, slower pace",
  },
  {
    id: "current",
    label: "Open Current",
    subtitle: "Balanced default",
  },
  {
    id: "storm",
    label: "Storm Trench",
    subtitle: "Fast & busy",
  },
];

const MISSIONS = [
  {
    id: "collect20",
    label: "Collect 20 tokens",
    subtitle: "Token Collector",
  },
  {
    id: "survive45",
    label: "Survive 45 seconds",
    subtitle: "Deep Breath",
  },
  {
    id: "noHazard",
    label: "Avoid all hazards",
    subtitle: "Flawless Run",
  },
];

// --- Music config ----------------------------------------------------

const MUSIC_TRACK_IDS = ["song1", "song2", "song3", "song4"];

const MUSIC_SOURCES = {
  song1: "/song1.mp3",
  song2: "/song2.mp3",
  song3: "/song3.mp3",
  song4: "/song4.mp3",
};

const MUSIC_OPTIONS = [
  { id: "playlist", label: "All Songs (Loop)" },
  { id: "song1", label: "Song 1" },
  { id: "song2", label: "Song 2" },
  { id: "song3", label: "Song 3" },
  { id: "song4", label: "Song 4" },
  { id: "off", label: "Mute" },
];

const THEME_KEY = "undersea_runner_theme";

export default function App() {
  const [selectedCharacter, setSelectedCharacter] = useState("neon-comet");

  const [difficulty, setDifficulty] = useState(() => {
    if (typeof window === "undefined") return "current";
    const stored = window.localStorage.getItem("undersea_runner_difficulty");
    return stored === "calm" || stored === "storm" ? stored : "current";
  });

  const [safeMode, setSafeMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("undersea_runner_safeMode") === "true";
  });

  const [mission, setMission] = useState(() => {
    if (typeof window === "undefined") return "collect20";
    const stored = window.localStorage.getItem("undersea_runner_mission");
    return MISSIONS.some((m) => m.id === stored) ? stored : "collect20";
  });

  // --- Theme state (dark / light) ------------------------------------

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // --- Music state ---------------------------------------------------

  const [musicMode, setMusicMode] = useState(() => {
    if (typeof window === "undefined") return "playlist";
    const stored = window.localStorage.getItem("undersea_runner_musicMode");
    const validIds = MUSIC_OPTIONS.map((m) => m.id);
    return validIds.includes(stored) ? stored : "playlist";
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const audioRef = useRef(null);
  const musicModeRef = useRef(musicMode);
  const isMusicPlayingRef = useRef(isMusicPlaying);

  // keep localStorage in sync when user changes choices
  useEffect(() => {
    window.localStorage.setItem("undersea_runner_difficulty", difficulty);
  }, [difficulty]);

  useEffect(() => {
    window.localStorage.setItem(
      "undersea_runner_safeMode",
      safeMode ? "true" : "false"
    );
  }, [safeMode]);

  useEffect(() => {
    window.localStorage.setItem("undersea_runner_mission", mission);
  }, [mission]);

  useEffect(() => {
    window.localStorage.setItem("undersea_runner_musicMode", musicMode);
    musicModeRef.current = musicMode;
  }, [musicMode]);

  useEffect(() => {
    isMusicPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  const handleToggleSafeMode = () => {
    setSafeMode((prev) => !prev);
  };

  // music
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.volume = 0.6;
    audio.loop = false;
    audioRef.current = audio;

    const handleEnded = () => {
      if (!isMusicPlayingRef.current) return;
      if (musicModeRef.current !== "playlist") return;

      setCurrentTrackIndex((prev) => (prev + 1) % MUSIC_TRACK_IDS.length);
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // paused or muted: stop audio
    if (!isMusicPlaying || musicMode === "off") {
      audio.pause();
      return;
    }

    let trackId;

    if (musicMode === "playlist") {
      // walk through all four songs
      trackId = MUSIC_TRACK_IDS[currentTrackIndex];
      audio.loop = false;
    } else {
      trackId = musicMode;
      audio.loop = true;
    }

    const src = MUSIC_SOURCES[trackId];
    if (!src) return;

    const fullUrl = new URL(src, window.location.origin).href;

    if (audio.src !== fullUrl) {
      audio.src = fullUrl;
      audio.currentTime = 0;
    }

    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {});
    }
  }, [musicMode, currentTrackIndex, isMusicPlaying]);

  const handleToggleMusicPlayback = () => {
    setIsMusicPlaying((prev) => {
      const next = !prev;

      if (next && musicMode === "off") {
        setMusicMode("playlist");
        setCurrentTrackIndex(0);
      }

      if (!next && audioRef.current) {
        audioRef.current.pause();
      }

      return next;
    });
  };

  const isDark = theme === "dark";

  return (
    <div className={`app-root ${isDark ? "theme-dark" : "theme-light"}`}>
      <header className="app-header">
        <div className="brand-mark">
          <span className="brand-dot" />
          <span className="brand-text">Undersea Runner</span>
        </div>

        <div className="header-right">
          <div className="accent-pill">FISH Edition</div>
          <div className="theme-toggle" aria-label="Theme">
            <button
              type="button"
              className={"theme-chip" + (isDark ? " is-active" : "")}
              onClick={() => setTheme("dark")}
            >
              Night
            </button>
            <button
              type="button"
              className={"theme-chip" + (!isDark ? " is-active" : "")}
              onClick={() => setTheme("light")}
            >
              Day
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="shell-panel">
          <div className="shell-header">
            <h1>Swim Through the Deep</h1>
            <p>
              Guide your fish through a glowing underwater lane, pick up tokens,
              and dodge jellyfish and sharks. Your best scores are saved locally
              in this browser for both regular and Safe Reef modes.
            </p>
          </div>

          {/* loop  */}
          <div className="ambient-video-panel">
            <video
              className="ambient-video"
              src="/bubblesloop.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>

          {/* Character picker */}
          <div className="character-row">
            <span className="character-label">Choose your fish</span>
            <div className="character-options">
              {CHARACTERS.map((ch) => (
                <button
                  key={ch.id}
                  className={
                    "character-chip" +
                    (selectedCharacter === ch.id ? " is-active" : "")
                  }
                  onClick={() => setSelectedCharacter(ch.id)}
                >
                  <span className={`character-swatch ${ch.id}`} />
                  <span className="character-chip-text">
                    <span className="character-chip-name">{ch.name}</span>
                    <span className="character-chip-sub">{ch.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty picker */}
          <div className="mode-row">
            <span className="mode-label">Tides difficulty</span>
            <div className="mode-options">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={
                    "mode-chip" + (difficulty === d.id ? " is-active" : "")
                  }
                  onClick={() => setDifficulty(d.id)}
                >
                  <span className="mode-chip-main">{d.label}</span>
                  <span className="mode-chip-sub">{d.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mission picker */}
          <div className="mission-row">
            <span className="mission-label">Reef mission</span>
            <div className="mission-options">
              {MISSIONS.map((m) => (
                <button
                  key={m.id}
                  className={
                    "mission-chip" + (mission === m.id ? " is-active" : "")
                  }
                  onClick={() => setMission(m.id)}
                >
                  <span className="mission-chip-main">{m.label}</span>
                  <span className="mission-chip-sub">{m.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Music controls */}
          <div className="music-row">
            <span className="music-label">Music</span>
            <div className="music-options">
              {/* Play / Pause */}
              <button
                type="button"
                className={
                  "music-chip music-chip-control" +
                  (isMusicPlaying && musicMode !== "off" ? " is-active" : "")
                }
                onClick={handleToggleMusicPlayback}
              >
                {isMusicPlaying && musicMode !== "off" ? "Pause" : "Play"}
              </button>

              {/* Modes / tracks */}
              {MUSIC_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={
                    "music-chip" + (musicMode === opt.id ? " is-active" : "")
                  }
                  onClick={() => {
                    if (opt.id === "playlist") {
                      setCurrentTrackIndex(0);
                    }
                    setMusicMode(opt.id);

                    if (opt.id === "off") {
                      setIsMusicPlaying(false);
                      if (audioRef.current) {
                        audioRef.current.pause();
                      }
                    } else {
                      setIsMusicPlaying(true);
                    }
                  }}
                >
                  <span className="music-chip-main">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Game
            key={`${selectedCharacter}|${difficulty}|${safeMode}|${mission}`}
            character={selectedCharacter}
            difficulty={difficulty}
            safeMode={safeMode}
            mission={mission}
          />

          <footer className="shell-footer">
            <p>
              <span className="kbd">Space</span> /{" "}
              <span className="kbd">↑</span> to swim up.{" "}
              <span className="kbd">↓</span> to glide down. On touch devices,
              tap the top or bottom half of the game area to move. In regular
              mode, hazards subtract points; in{" "}
              <span className="accent">Safe Reef</span> mode, hazards are visual
              only.
            </p>
            <button
              type="button"
              className={"safe-toggle" + (safeMode ? " is-active" : "")}
              onClick={handleToggleSafeMode}
            >
              <span className="safe-toggle-dot" />
              Safe Reef Mode
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}
