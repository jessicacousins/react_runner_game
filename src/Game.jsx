import React, { useEffect, useRef, useState } from "react";
import "./Game.css";

const GRAVITY = 420;
const TOKEN_INTERVAL = 1.1;
const BUBBLE_INTERVAL = 0.35;

export default function Game() {
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    player: { x: 200, y: 225, radius: 26, vy: 0 },
    tokens: [],
    bubbles: [],
    spawnTimer: 0,
    bubbleTimer: 0,
  });
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  // localStorage
  useEffect(() => {
    const stored = localStorage.getItem("undersea_runner_bestScore");
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setBestScore(parsed);
      }
    }
  }, []);

  //  update best score + localStorage
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("undersea_runner_bestScore", String(score));
    }
  }, [score, bestScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const state = gameStateRef.current;

    state.player.x = canvas.width * 0.25;
    state.player.y = canvas.height * 0.5;

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

    window.addEventListener("keydown", handleKeyDown);

    const loop = (time) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      updateGame(delta, canvas, gameStateRef, setScore);
      drawGame(ctx, canvas, gameStateRef);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setScore(0);
    const state = gameStateRef.current;
    state.tokens = [];
    state.bubbles = [];
    state.spawnTimer = 0;
    state.bubbleTimer = 0;
    state.player.y = canvas.height * 0.5;
    state.player.vy = 0;
  };

  return (
    <div className="game-shell">
      <div className="score-bar">
        <div className="score-group">
          <div className="score-box">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-box">
            <span className="score-label">Best</span>
            <span className="score-value">{bestScore}</span>
          </div>
        </div>

        <button className="reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          width={900}
          height={480}
          className="game-canvas"
        />
        <div className="canvas-hint">
          Swim through the bubbles, catch the glowing tokens!
        </div>
      </div>
    </div>
  );
}

function updateGame(delta, canvas, stateRef, setScore) {
  const state = stateRef.current;
  const { player } = state;

  // fish
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

  //  tokens
  state.spawnTimer += delta;
  if (state.spawnTimer >= TOKEN_INTERVAL) {
    state.spawnTimer = 0;
    const margin = 90;
    const tokenY =
      margin + Math.random() * (canvas.height - margin * 2 - player.radius * 2);
    state.tokens.push({
      x: canvas.width + 40,
      y: tokenY,
      radius: 16,
      speed: 210 + Math.random() * 60,
    });
  }

  //  bubbles
  state.bubbleTimer += delta;
  if (state.bubbleTimer >= BUBBLE_INTERVAL) {
    state.bubbleTimer = 0;
    state.bubbles.push({
      x: 40 + Math.random() * (canvas.width - 80),
      y: canvas.height + 20,
      radius: 4 + Math.random() * 7,
      vy: 35 + Math.random() * 25,
      drift: (Math.random() * 40 - 20) / 30,
    });
  }

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
      setScore((prev) => prev + 1);
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
}

function drawGame(ctx, canvas, stateRef) {
  const state = stateRef.current;
  const { player, tokens, bubbles } = state;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, "#020318");
  bgGrad.addColorStop(0.45, "#031834");
  bgGrad.addColorStop(1, "#020811");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  // Player fish
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "#ff2fd0";
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(-player.radius - 10, 0);
  ctx.lineTo(-player.radius - 26, -16);
  ctx.lineTo(-player.radius - 26, 16);
  ctx.closePath();
  ctx.fill();

  const bodyGrad = ctx.createLinearGradient(
    -player.radius,
    -player.radius,
    player.radius,
    player.radius
  );
  bodyGrad.addColorStop(0, "#ff2fd0");
  bodyGrad.addColorStop(0.5, "#ff7ae0");
  bodyGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, player.radius + 10, player.radius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, player.radius + 10, player.radius, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(player.radius * 0.9, -6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#02010a";
  ctx.beginPath();
  ctx.arc(player.radius * 0.9 + 1, -6, 4.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(player.radius * 1, 4, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}
