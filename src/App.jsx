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

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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

  const [showGate, setShowGate] = useState(true);
  const [gateAccepted, setGateAccepted] = useState(false);

  const [showHowTo, setShowHowTo] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          </div>

          <Game
            key={`${selectedCharacter}|${difficulty}|${safeMode}|${mission}`}
            character={selectedCharacter}
            difficulty={difficulty}
            safeMode={safeMode}
            mission={mission}
          />

          <footer className="shell-footer">
            <button
              type="button"
              className="howto-pill"
              onClick={() => setShowHowTo(true)}
            >
              How to play &amp; movement
            </button>

            <div className="shell-footer-actions">
              <button
                type="button"
                className="options-pill"
                onClick={() => setIsSettingsOpen(true)}
              >
                Settings / Options
              </button>

              <button
                type="button"
                className={"safe-toggle" + (safeMode ? " is-active" : "")}
                onClick={handleToggleSafeMode}
              >
                <span className="safe-toggle-dot" />
                Safe Reef Mode
              </button>
            </div>
          </footer>
        </section>
      </main>

      {showHowTo && (
        <div
          className="overlay-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="How to play"
          onClick={() => setShowHowTo(false)}
        >
          <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="overlay-close"
              aria-label="Close"
              onClick={() => setShowHowTo(false)}
            >
              ×
            </button>
            <h2 className="overlay-title">How to play</h2>
            <p className="howto-body">
              <span className="kbd">Space</span> /{" "}
              <span className="kbd">↑</span> to swim up.{" "}
              <span className="kbd">↓</span> to glide down. On touch devices,
              tap the top or bottom half of the game area to move. In regular
              mode, hazards subtract points; in{" "}
              <span className="accent">Safe Reef</span> mode, hazards are visual
              only.
            </p>
            <ul className="howto-list">
              <li>
                <strong>Fish:</strong> pick one of the three fish at the top for
                different perks.
              </li>
              <li>
                <strong>Tides difficulty:</strong> Calm, Open Current, or Storm
                Trench adjust speed and hazard frequency.
              </li>
              <li>
                <strong>Reef mission:</strong> choose a run goal (tokens,
                survival, or no-hits).
              </li>
              <li>
                <strong>Music:</strong> play/pause, loop all four tracks, or
                select a single song, or mute.
              </li>
              <li>
                <strong>Safe Reef Mode:</strong> toggle in the footer to turn
                hazards into visuals only.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* options overlay */}
      {isSettingsOpen && (
        <div
          className="overlay-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Game settings and options"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="overlay-panel overlay-panel-settings"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overlay-settings-header">
              <h2 className="overlay-settings-title">Game options</h2>
              <button
                type="button"
                className="overlay-settings-close"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>

            <p className="overlay-settings-lede">
              Guide your fish through a glowing underwater lane, pick up tokens,
              and dodge jellyfish and sharks. Your best scores are saved locally
              in this browser for both regular and Safe Reef modes.
            </p>

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
          </div>
        </div>
      )}

      {/* legal gate */}
      {showGate && (
        <div
          className="gate-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Before you enter the reef"
        >
          <div className="gate-modal">
            <div className="gate-media">
              <video
                className="gate-video"
                src="/bubblesloop.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="gate-mediaShade" />
              <div className="gate-mediaBadge">
                <div className="gate-badgeTitle">Undersea Runner Game</div>
                <div className="gate-badgeSub">
                  Browser arcade • local-only scores
                </div>
              </div>
            </div>

            <div className="gate-content">
              <div className="gate-top">
                <h2 className="gate-title">WARNING: Before you enter the reef</h2>
                <p className="gate-sub">
                  Bright effects + quick motion. Take breaks if you feel
                  discomfort.
                </p>
              </div>

              <div className="gate-copy" role="note" aria-label="Legal summary">
                <p>
                  <strong>Privacy:</strong> High scores are saved locally in
                  your browser storage. No accounts, logins, or personal data
                  are collected or sent.
                </p>

                <p>
                  <strong>Copyright:</strong> Undersea Runner and all related
                  content (gameplay, code, UI, visuals, audio, and text) are
                  protected by intellectual property laws. © 2026. All rights
                  reserved.
                </p>

                <p>
                  <strong>License to play:</strong> You may play this game for
                  personal, non-commercial entertainment only. You may not copy,
                  reproduce, redistribute, publish, upload elsewhere, sell,
                  reverse engineer, or create derivative works from any part of
                  the game without prior written permission.
                </p>
              </div>

              <div className="gate-miniActions">
                <button
                  type="button"
                  className="gate-linkBtn"
                  onClick={() => {
                    const dlg = document.getElementById("gateLegalDialog");
                    if (dlg && typeof dlg.showModal === "function")
                      dlg.showModal();
                  }}
                >
                  Read full Legal / Disclaimer
                </button>
              </div>

              <label className="gate-checkbox">
                <input
                  type="checkbox"
                  checked={gateAccepted}
                  onChange={(e) => setGateAccepted(e.target.checked)}
                />
                <span>
                  I understand and agree to the Legal / Disclaimer, including
                  the no-copy / no-redistribution terms.
                </span>
              </label>

              <button
                type="button"
                className={
                  "gate-button" +
                  (gateAccepted ? " is-enabled" : " is-disabled")
                }
                disabled={!gateAccepted}
                onClick={() => setShowGate(false)}
              >
                Enter the reef
              </button>

              <p className="gate-legal-note">
                © 2026 Undersea Runner. All rights reserved.
              </p>
            </div>
          </div>

          {/* Full legal popup (no extra React state needed) */}
          <dialog id="gateLegalDialog" className="gate-dialog">
            <div className="gate-dialogHead">
              <div className="gate-dialogTitle">Legal / Disclaimer</div>
              <button
                type="button"
                className="gate-dialogClose"
                aria-label="Close legal"
                onClick={(e) => {
                  const dlg = e.currentTarget.closest("dialog");
                  if (dlg) dlg.close();
                }}
              >
                ✕
              </button>
            </div>

            <div className="gate-dialogBody">
              <p>
                <strong>Ownership.</strong> Undersea Runner and all associated
                content (including gameplay, code, UI, visuals, audio, and text)
                are owned by the creator and protected by copyright and other
                intellectual property laws. © 2026. All rights reserved.
              </p>

              <p>
                <strong>Permitted use.</strong> You may access and play the game
                for personal, non-commercial entertainment.
              </p>

              <p>
                <strong>Prohibited.</strong> You may not copy, reproduce,
                distribute, publicly display, publish, upload to other sites,
                sell, license, rent, reverse engineer, decompile, scrape, or
                create derivative works from any portion of the game or its
                assets, except as expressly permitted by applicable law or by
                prior written permission.
              </p>

              <p>
                <strong>Disclaimer.</strong> The game is provided “as is” and
                “as available” without warranties of any kind. To the maximum
                extent permitted by law, the creator is not liable for any
                indirect, incidental, special, consequential, or punitive
                damages arising from or related to the use of the game.
              </p>

              <p>
                <strong>Privacy.</strong> Scores are stored locally in your
                browser. No personal data is intentionally collected or
                transmitted.
              </p>

              <p>
                <strong>Agreement.</strong> By continuing to play, you agree to
                these terms. If you do not agree, do not play.
              </p>
            </div>

            <form method="dialog" className="gate-dialogFooter">
              <button className="gate-dialogOk" type="submit">
                Done
              </button>
            </form>
          </dialog>
        </div>
      )}
    </div>
  );
}
