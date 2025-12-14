import React, { useEffect, useRef, useState } from "react";
import "./Game.css";

const GRAVITY = 420;

const BASE_TOKEN_INTERVAL = 1.1;
const BASE_BUBBLE_INTERVAL = 0.35;
const BASE_HAZARD_INTERVAL = 2.8;

// difficulty multipliers
function getDifficultyConfig(id) {
  switch (id) {
    case "calm":
      return {
        tokenInterval: BASE_TOKEN_INTERVAL * 1.1,
        hazardInterval: BASE_HAZARD_INTERVAL * 1.35,
        tokenSpeedFactor: 0.9,
        hazardSpeedFactor: 0.85,
      };
    case "storm":
      return {
        tokenInterval: BASE_TOKEN_INTERVAL * 0.85,
        hazardInterval: BASE_HAZARD_INTERVAL * 0.75,
        tokenSpeedFactor: 1.15,
        hazardSpeedFactor: 1.2,
      };
    case "current":
    default:
      return {
        tokenInterval: BASE_TOKEN_INTERVAL,
        hazardInterval: BASE_HAZARD_INTERVAL,
        tokenSpeedFactor: 1,
        hazardSpeedFactor: 1,
      };
  }
}

export default function Game({
  character = "neon-comet",
  difficulty = "current",
  safeMode = false,
  mission = "collect20",
}) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    player: { x: 200, y: 225, radius: 26, vy: 0 },
    tokens: [],
    bubbles: [],
    hazards: [],
    spawnTimer: 0,
    bubbleTimer: 0,
    hazardTimer: 0,
    hitFlash: 0,

    streak: 0,
    longestStreak: 0,
    tokensCollected: 0,
    hazardsHit: 0,
    elapsed: 0,
    comboLevel: 1,
    missionCompleted: false,
    milestoneStage: 0,
    config: {
      difficulty: "current",
      safeMode: false,
      character: "neon-comet",
      mission: "collect20",
      shieldAvailable: false,
      hazardPenalty: 5,
    },
  });

  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [comboLevel, setComboLevel] = useState(1);
  const [dailyActive, setDailyActive] = useState(false);
  const dailyBonusRef = useRef(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [missionCompletedLabel, setMissionCompletedLabel] = useState("");
  const [milestoneMessage, setMilestoneMessage] = useState("");
  const milestoneTimeoutRef = useRef(null);

  useEffect(() => {
    const bestKey = safeMode
      ? "undersea_runner_bestScore_safe"
      : "undersea_runner_bestScore";

    const stored = window.localStorage.getItem(bestKey);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setBestScore(parsed);
      }
    }

    // Daily Tide bonus
    const today = new Date().toISOString().slice(0, 10);
    const last = window.localStorage.getItem("undersea_runner_dailyDate");
    if (last !== today) {
      dailyBonusRef.current = true;
      setDailyActive(true);
      window.localStorage.setItem("undersea_runner_dailyDate", today);
    } else {
      dailyBonusRef.current = false;
      setDailyActive(false);
    }

    const completedRaw = window.localStorage.getItem(
      "undersea_runner_completedMissions"
    );
    if (completedRaw) {
      try {
        const parsed = JSON.parse(completedRaw);
        const completedList = Object.keys(parsed).filter((k) => parsed[k]);
        if (completedList.length > 0) {
          setMissionCompletedLabel(
            "Missions: " + completedList.length + " done"
          );
        }
      } catch {
        // ignore
      }
    }
  }, [safeMode]);

  useEffect(() => {
    const bestKey = safeMode
      ? "undersea_runner_bestScore_safe"
      : "undersea_runner_bestScore";

    if (score > bestScore) {
      setBestScore(score);
      window.localStorage.setItem(bestKey, String(score));
    }
  }, [score, bestScore, safeMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const state = gameStateRef.current;

    const diffCfg = getDifficultyConfig(difficulty);
    const hazardPenalty = safeMode ? 0 : character === "ghost-koi" ? 3 : 5;

    state.config = {
      difficulty,
      safeMode,
      character,
      mission,
      shieldAvailable: character === "star-tetra",
      hazardPenalty,
      tokenInterval: diffCfg.tokenInterval,
      hazardInterval: diffCfg.hazardInterval,
      tokenSpeedFactor: diffCfg.tokenSpeedFactor,
      hazardSpeedFactor: diffCfg.hazardSpeedFactor,
    };

    state.player.x = canvas.width * 0.25;
    state.player.y = canvas.height * 0.5;
    state.player.vy = 0;
    state.tokens = [];
    state.bubbles = [];
    state.hazards = [];
    state.spawnTimer = 0;
    state.bubbleTimer = 0;
    state.hazardTimer = 0;
    state.hitFlash = 0;
    state.streak = 0;
    state.longestStreak = 0;
    state.tokensCollected = 0;
    state.hazardsHit = 0;
    state.elapsed = 0;
    state.comboLevel = 1;
    state.missionCompleted = false;
    state.milestoneStage = 0;

    lastTimeRef.current = 0;
    setComboLevel(1);
    setSessionSummary(null);
    setMilestoneMessage("");

    const initialScore = dailyBonusRef.current ? 5 : 0;
    setScore(initialScore);

    dailyBonusRef.current = false;

    // keyboard controls
    const handleKeyDown = (e) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        const s = gameStateRef.current;
        s.player.vy = -260;
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const s = gameStateRef.current;
        s.player.vy = 260;
      }
    };

    const applyVerticalInput = (clientY) => {
      const rect = canvas.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const s = gameStateRef.current;
      if (!s) return;
      s.player.vy = clientY < midY ? -260 : 260;
    };

    // touch controls (phones / tablets)
    const handleTouchStart = (e) => {
      if (!canvas) return;
      if (e.touches.length === 0) return;
      e.preventDefault();
      const touch = e.touches[0];
      applyVerticalInput(touch.clientY);
    };

    // controls
    const handlePointerDown = (e) => {
      if (!canvas) return;
      if (e.pointerType === "mouse") return;
      applyVerticalInput(e.clientY);
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("pointerdown", handlePointerDown);

    const loop = (time) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      updateGame(delta, canvas, gameStateRef, setScore, setComboLevel);
      drawGame(ctx, canvas, gameStateRef, character);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [character, difficulty, safeMode, mission]);

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = gameStateRef.current;

    setSessionSummary({
      tokens: state.tokensCollected,
      longestStreak: state.longestStreak,
      hazards: state.hazardsHit,
      elapsed: Math.round(state.elapsed),
    });

    if (!state.missionCompleted) {
      let completed = false;

      if (mission === "collect20") {
        completed = state.tokensCollected >= 20;
      } else if (mission === "survive45") {
        completed = state.elapsed >= 45;
      } else if (mission === "noHazard") {
        completed = state.elapsed >= 35 && state.hazardsHit === 0;
      }

      if (completed) {
        state.missionCompleted = true;
        setMissionCompletedLabel("Mission complete!");

        const raw = window.localStorage.getItem(
          "undersea_runner_completedMissions"
        );
        let obj = {};
        if (raw) {
          try {
            obj = JSON.parse(raw);
          } catch {
            obj = {};
          }
        }
        obj[mission] = true;
        window.localStorage.setItem(
          "undersea_runner_completedMissions",
          JSON.stringify(obj)
        );
      }
    }

    // reset
    setScore(0);
    state.tokens = [];
    state.bubbles = [];
    state.hazards = [];
    state.spawnTimer = 0;
    state.bubbleTimer = 0;
    state.hazardTimer = 0;
    state.hitFlash = 0;
    state.streak = 0;
    state.longestStreak = 0;
    state.tokensCollected = 0;
    state.hazardsHit = 0;
    state.elapsed = 0;
    state.comboLevel = 1;
    state.milestoneStage = 0;
    setComboLevel(1);
    setMilestoneMessage("");
    setDailyActive(false);

    state.player.y = canvas.height * 0.5;
    state.player.vy = 0;
  };

  // show milestones briefly
  const showMilestone = (text) => {
    setMilestoneMessage(text);
    if (milestoneTimeoutRef.current) {
      clearTimeout(milestoneTimeoutRef.current);
    }
    milestoneTimeoutRef.current = setTimeout(() => {
      setMilestoneMessage("");
    }, 2200);
  };

  gameStateRef.current.showMilestone = showMilestone;

  return (
    <div className="game-shell">
      <div className="score-bar">
        <div className="score-group">
          <div className="score-box">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-box">
            <span className="score-label">Best{safeMode ? " (Safe)" : ""}</span>
            <span className="score-value">{bestScore}</span>
          </div>
        </div>

        <div className="score-meta">
          {dailyActive && (
            <div className="info-pill daily-pill">Daily Tide +5</div>
          )}
          {comboLevel > 1 && (
            <div className="info-pill combo-pill">Combo x{comboLevel}</div>
          )}
          {missionCompletedLabel && (
            <div className="info-pill mission-pill">
              {missionCompletedLabel}
            </div>
          )}
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {sessionSummary && (
        <div className="session-strip">
          Run summary: <span>{sessionSummary.tokens} tokens</span>
          <span>{sessionSummary.longestStreak} max streak</span>
          <span>{sessionSummary.hazards} hazard hits</span>
          <span>{sessionSummary.elapsed}s in water</span>
        </div>
      )}

      <div className={"canvas-frame" + (comboLevel > 1 ? " combo-active" : "")}>
        <canvas
          ref={canvasRef}
          width={900}
          height={480}
          className="game-canvas"
        />
        <div className="canvas-hint">
          <div>Swim & collect tokens. Tap top / bottom on mobile.</div>
          <div className="canvas-mission-line">
            Mission: {mission === "collect20" && "Collect 20 tokens"}
            {mission === "survive45" && "Survive 45 seconds"}
            {mission === "noHazard" && "Avoid all hazards this run"}
          </div>
          {milestoneMessage && (
            <div className="canvas-milestone">{milestoneMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function updateGame(delta, canvas, stateRef, setScore, setComboLevel) {
  const state = stateRef.current;
  const { player, config } = state;

  if (state.hitFlash > 0) {
    state.hitFlash = Math.max(0, state.hitFlash - delta);
  }

  state.elapsed += delta;

  // fish physics
  player.vy += GRAVITY * delta;
  player.y += player.vy * delta;

  const topBound = 30;
  const bottomBound = canvas.height - 40;

  if (player.y < topBound + player.radius) {
    player.y = topBound + player.radius;
    player.vy = 0;
  }
  if (player.y > bottomBound - player.radius) {
    player.y = bottomBound - player.radius;
    player.vy = 0;
  }

  // tokens spawn
  state.spawnTimer += delta;
  const tokenInterval = config.tokenInterval ?? BASE_TOKEN_INTERVAL;
  if (state.spawnTimer >= tokenInterval) {
    state.spawnTimer = 0;
    const margin = 90;
    const tokenY =
      margin + Math.random() * (canvas.height - margin * 2 - player.radius * 2);
    state.tokens.push({
      x: canvas.width + 40,
      y: tokenY,
      radius: 16,
      speed: (210 + Math.random() * 60) * (config.tokenSpeedFactor ?? 1),
    });
  }

  // bubbles spawn
  state.bubbleTimer += delta;
  if (state.bubbleTimer >= BASE_BUBBLE_INTERVAL) {
    state.bubbleTimer = 0;
    state.bubbles.push({
      x: 40 + Math.random() * (canvas.width - 80),
      y: canvas.height + 20,
      radius: 4 + Math.random() * 7,
      vy: 35 + Math.random() * 25,
      drift: (Math.random() * 40 - 20) / 30,
    });
  }

  // hazards spawn
  state.hazardTimer += delta;
  const hazardInterval = config.hazardInterval ?? BASE_HAZARD_INTERVAL;
  if (state.hazardTimer >= hazardInterval) {
    state.hazardTimer = 0;
    const margin = 80;
    const hazardY =
      margin + Math.random() * (canvas.height - margin * 2 - player.radius * 2);
    const type = Math.random() < 0.6 ? "jellyfish" : "shark";
    const baseRadius = type === "jellyfish" ? 28 : 32;

    state.hazards.push({
      x: canvas.width + 80,
      y: hazardY,
      radius: baseRadius,
      speed: (230 + Math.random() * 70) * (config.hazardSpeedFactor ?? 1),
      type,
    });
  }

  // move tokens & check collection
  for (let i = state.tokens.length - 1; i >= 0; i--) {
    const token = state.tokens[i];
    token.x -= token.speed * delta;

    if (token.x < -token.radius - 20) {
      state.tokens.splice(i, 1);
      continue;
    }

    const dx = token.x - player.x;
    const dy = token.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < token.radius + player.radius - 4) {
      state.tokens.splice(i, 1);

      state.streak += 1;
      state.tokensCollected += 1;
      if (state.streak > state.longestStreak) {
        state.longestStreak = state.streak;
      }

      // combo level by streak thresholds
      let newCombo = 1;
      if (state.streak >= 20) newCombo = 3;
      else if (state.streak >= 10) newCombo = 3;
      else if (state.streak >= 5) newCombo = 2;

      if (newCombo !== state.comboLevel) {
        state.comboLevel = newCombo;
        setComboLevel(newCombo);
      }

      // base gain with combo multiplier
      const multiplier = state.comboLevel;
      let gain = 1 * multiplier;

      // Neon Comet perk: +1 every time streak hits multiples of 5
      if (config.character === "neon-comet" && state.streak % 5 === 0) {
        gain += 1;
      }

      setScore((prev) => prev + gain);

      // milestones
      if (
        state.tokensCollected >= 10 &&
        state.milestoneStage < 1 &&
        stateRef.current.showMilestone
      ) {
        state.milestoneStage = 1;
        stateRef.current.showMilestone("10 tokens reached!");
      } else if (
        state.tokensCollected >= 30 &&
        state.milestoneStage < 2 &&
        stateRef.current.showMilestone
      ) {
        state.milestoneStage = 2;
        stateRef.current.showMilestone("30 tokens – Deep Diver!");
      } else if (
        state.tokensCollected >= 60 &&
        state.milestoneStage < 3 &&
        stateRef.current.showMilestone
      ) {
        state.milestoneStage = 3;
        stateRef.current.showMilestone("60 tokens – Abyss Runner!");
      }
    }
  }

  for (let i = state.bubbles.length - 1; i >= 0; i--) {
    const b = state.bubbles[i];
    b.y -= b.vy * delta;
    b.x += b.drift;
    if (b.y < -b.radius - 10) {
      state.bubbles.splice(i, 1);
    }
  }

  for (let i = state.hazards.length - 1; i >= 0; i--) {
    const h = state.hazards[i];
    h.x -= h.speed * delta;

    if (h.x < -h.radius - 40) {
      state.hazards.splice(i, 1);
      continue;
    }

    const dx = h.x - player.x;
    const dy = h.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < h.radius + player.radius - 6) {
      state.hazards.splice(i, 1);
      state.hitFlash = 0.35;
      state.hazardsHit += 1;

      // Safe Reef: visual only
      if (config.safeMode) {
        state.streak = 0;
        state.comboLevel = 1;
        setComboLevel(1);
        continue;
      }

      // Star Tetra perk: first hit is shielded
      if (config.character === "star-tetra" && config.shieldAvailable) {
        config.shieldAvailable = false;
        state.streak = 0;
        state.comboLevel = 1;
        setComboLevel(1);
        continue;
      }

      // regular penalty (Ghost Koi - softer penalty from hazardPenalty)
      const penalty = config.hazardPenalty ?? 5;
      state.streak = 0;
      state.comboLevel = 1;
      setComboLevel(1);

      if (penalty > 0) {
        setScore((prev) => Math.max(0, prev - penalty));
      }
    }
  }
}

function drawGame(ctx, canvas, stateRef, character) {
  const state = stateRef.current;
  const { player, tokens, bubbles, hazards, hitFlash } = state;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, "#020318");
  bgGrad.addColorStop(0.45, "#031834");
  bgGrad.addColorStop(1, "#020811");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // beams
  ctx.save();
  ctx.globalAlpha = 0.35;
  const beamCount = 4;
  for (let i = 0; i < beamCount; i++) {
    const x = (canvas.width / beamCount) * i + 80;
    const grad = ctx.createLinearGradient(x - 80, 0, x + 80, canvas.height);
    grad.addColorStop(0, "rgba(255,255,255,0.08)");
    grad.addColorStop(0.2, "rgba(255,255,255,0.02)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 140, 0);
    ctx.lineTo(x + 60, 0);
    ctx.lineTo(x + 160, canvas.height);
    ctx.lineTo(x - 40, canvas.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // seafloor
  ctx.save();
  const floorY = canvas.height - 60;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, canvas.height);
  floorGrad.addColorStop(0, "#050813");
  floorGrad.addColorStop(1, "#010308");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
  ctx.restore();

  // seaweed
  ctx.save();
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (let x = 40; x < canvas.width; x += 80) {
    const height = 40 + (Math.sin(Date.now() / 900 + x * 0.07) + 1) * 25;
    ctx.strokeStyle = "rgba(19, 219, 142, 0.85)";
    ctx.beginPath();
    ctx.moveTo(x, floorY + 8);
    ctx.quadraticCurveTo(
      x - 12,
      floorY - height * 0.3,
      x + 10,
      floorY - height
    );
    ctx.stroke();
  }
  ctx.restore();

  // bubbles
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  for (const b of bubbles) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // tokens
  ctx.save();
  for (const token of tokens) {
    const g = ctx.createRadialGradient(
      token.x,
      token.y,
      2,
      token.x,
      token.y,
      token.radius + 4
    );
    g.addColorStop(0, "#ffe9ff");
    g.addColorStop(0.4, "#ffb7f2");
    g.addColorStop(1, "rgba(255,47,208,0.08)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(token.x, token.y, token.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ff2fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(token.x, token.y, token.radius - 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // hazards
  ctx.save();
  for (const h of hazards) {
    if (h.type === "jellyfish") {
      ctx.save();
      ctx.translate(h.x, h.y);

      const domeHeight = h.radius * 0.9;

      const jellyGrad = ctx.createRadialGradient(
        0,
        -domeHeight * 0.2,
        4,
        0,
        0,
        h.radius * 1.2
      );
      jellyGrad.addColorStop(0, "rgba(220,255,255,0.95)");
      jellyGrad.addColorStop(0.4, "rgba(170,240,255,0.9)");
      jellyGrad.addColorStop(1, "rgba(120,80,255,0.18)");
      ctx.fillStyle = jellyGrad;

      // smooth dome + skirt
      ctx.beginPath();
      ctx.moveTo(-h.radius, 0);
      ctx.quadraticCurveTo(0, -domeHeight, h.radius, 0);
      ctx.quadraticCurveTo(
        h.radius * 0.7,
        domeHeight * 0.35,
        0,
        domeHeight * 0.45
      );
      ctx.quadraticCurveTo(-h.radius * 0.7, domeHeight * 0.35, -h.radius, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(190,240,255,0.9)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // tentacles
      ctx.strokeStyle = "rgba(200,240,255,0.95)";
      ctx.lineWidth = 2;
      const tentacles = 4;
      const baseY = domeHeight * 0.45;
      for (let t = 0; t < tentacles; t++) {
        const offset =
          -h.radius * 0.6 + (t * (h.radius * 1.2)) / (tentacles - 1);
        ctx.beginPath();
        ctx.moveTo(offset, baseY);
        ctx.quadraticCurveTo(
          offset + (t % 2 === 0 ? -6 : 6),
          baseY + domeHeight * 0.7,
          offset + (t % 2 === 0 ? -2 : 2),
          baseY + domeHeight * 1.2
        );
        ctx.stroke();
      }

      ctx.restore();
    } else {
      // shark
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.scale(-1, 1);

      const bodyLen = h.radius + 22;

      const sharkGrad = ctx.createLinearGradient(-bodyLen, 0, bodyLen, 0);
      sharkGrad.addColorStop(0, "#0b1724");
      sharkGrad.addColorStop(0.5, "#1a293f");
      sharkGrad.addColorStop(1, "#4a6b8a");

      // main body
      ctx.fillStyle = sharkGrad;
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.moveTo(-bodyLen, 0);
      ctx.quadraticCurveTo(-h.radius * 0.2, -h.radius * 0.9, bodyLen, -2);
      ctx.quadraticCurveTo(bodyLen + 8, 0, bodyLen, 2);
      ctx.quadraticCurveTo(-h.radius * 0.2, h.radius * 0.9, -bodyLen, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // tail
      ctx.beginPath();
      ctx.moveTo(-bodyLen, 0);
      ctx.lineTo(-bodyLen - 18, -12);
      ctx.lineTo(-bodyLen - 18, 12);
      ctx.closePath();
      ctx.fill();

      // dorsal fin
      ctx.beginPath();
      ctx.moveTo(-h.radius * 0.2, -h.radius * 0.6);
      ctx.lineTo(-h.radius * 0.65, -h.radius * 1.1);
      ctx.lineTo(0, -h.radius * 0.5);
      ctx.closePath();
      ctx.fill();

      // eye
      ctx.fillStyle = "#ffdde5";
      ctx.beginPath();
      ctx.arc(h.radius * 0.6, -h.radius * 0.18, 3, 0, Math.PI * 2);
      ctx.fill();

      // gill line
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(h.radius * 0.25, -h.radius * 0.05);
      ctx.lineTo(h.radius * 0.25, h.radius * 0.15);
      ctx.stroke();

      ctx.restore();
    }
  }
  ctx.restore();

  // player fish
  ctx.save();
  ctx.translate(player.x, player.y);

  const cfg = getCharacterConfig(character, player.radius);

  // tail
  ctx.fillStyle = cfg.tailColor;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(-player.radius - 10, 0);
  ctx.lineTo(-player.radius - 26, -16);
  ctx.lineTo(-player.radius - 26, 16);
  ctx.closePath();
  ctx.fill();

  // body
  const bodyGrad = ctx.createLinearGradient(
    -player.radius,
    -player.radius,
    player.radius,
    player.radius
  );
  bodyGrad.addColorStop(0, cfg.bodyStops[0]);
  bodyGrad.addColorStop(0.5, cfg.bodyStops[1]);
  bodyGrad.addColorStop(1, cfg.bodyStops[2]);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, player.radius + 10, player.radius, 0, 0, Math.PI * 2);
  ctx.fill();

  // outline
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, player.radius + 10, player.radius, 0, 0, Math.PI * 2);
  ctx.stroke();

  // eye
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(player.radius * 0.9, -6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#02010a";
  ctx.beginPath();
  ctx.arc(player.radius * 0.9 + 1, -6, 4.9, 0, Math.PI * 2);
  ctx.fill();

  // smile
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(player.radius * 1, 4, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();

  // damage flash overlay
  if (hitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = (hitFlash / 0.35) * 0.45;
    ctx.fillStyle = "rgba(255, 47, 208, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function getCharacterConfig(character, r) {
  switch (character) {
    case "star-tetra":
      return {
        bodyStops: ["#5efff8", "#4be5ff", "#ffffff"],
        tailColor: "#4be5ff",
        eyeOffsetX: r * 0.6,
      };
    case "ghost-koi":
      return {
        bodyStops: ["#ffe9b0", "#ffb37a", "#ffffff"],
        tailColor: "#ffda9b",
        eyeOffsetX: r * 0.5,
      };
    case "neon-comet":
    default:
      return {
        bodyStops: ["#ff2fd0", "#ff7ae0", "#ffffff"],
        tailColor: "#ff2fd0",
        eyeOffsetX: r * 0.4,
      };
  }
}
