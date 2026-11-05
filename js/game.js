import {
  createSprites,
  drawSky,
  blit,
  drawNumber,
} from './sprites.js';
import { playFlap, playScore, playHit, playDie } from './audio.js';

export const W = 144;
export const H = 256;
export const GROUND_Y = 224;
export const GRAVITY = 0.42;
export const FLAP_V = -4.6;
export const MAX_FALL = 8;
export const PIPE_W = 22;
export const PIPE_CAP_W = 26;
export const PIPE_CAP_OFFSET = (PIPE_CAP_W - PIPE_W) / 2;
export const PIPE_GAP_START = 52;
export const PIPE_GAP_MIN = 42;
export const PIPE_SPACING = 80;
export const PIPE_GAP_STEP_MAX = 50;
export const SCROLL_SPEED = 1.2;
export const FIXED_DT = 1000 / 60;

export const State = {
  MENU: 'MENU',
  READY: 'READY',
  PLAYING: 'PLAYING',
  DYING: 'DYING',
  GAME_OVER: 'GAME_OVER',
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function medalForScore(score) {
  if (score >= 40) return 'plat';
  if (score >= 25) return 'gold';
  if (score >= 10) return 'silver';
  if (score >= 5) return 'bronze';
  return null;
}

export class Game {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = createSprites();
    this.highScore = parseInt(localStorage.getItem('flappy_high') || '0', 10) || 0;
    this.reset();
  }

  reset() {
    this.state = State.MENU;
    this.score = 0;
    this.night = false;
    this.bird = {
      x: 36,
      y: GROUND_Y / 2 - 20,
      vy: 0,
      rot: 0,
      frame: 0,
      frameT: 0,
    };
    this.pipes = [];
    this.nextPipeId = 1;
    this.gapSize = PIPE_GAP_START;
    this.cloudOff = 0;
    this.hillOff = 0;
    this.groundOff = 0;
    this.flash = 0;
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.paused = false;
    this.dieTimer = 0;
  }

  startReady() {
    this.state = State.READY;
    this.bird.y = GROUND_Y / 2 - 20;
    this.bird.vy = 0;
    this.bird.rot = 0;
    this.pipes = [];
    this.nextPipeId = 1;
    this.score = 0;
    this.gapSize = PIPE_GAP_START;
    this.night = false;
  }

  flap() {
    if (this.paused) return;
    if (this.state === State.MENU) {
      this.startReady();
      return;
    }
    if (this.state === State.GAME_OVER) {
      this.startReady();
      return;
    }
    if (this.state === State.READY) {
      this.state = State.PLAYING;
      this.bird.vy = FLAP_V;
      playFlap();
      return;
    }
    if (this.state === State.PLAYING) {
      this.bird.vy = FLAP_V;
      playFlap();
    }
  }

  togglePause() {
    if (this.state === State.PLAYING || this.state === State.READY) {
      this.paused = !this.paused;
    }
  }

  /** @param {number} dt ms */
  update(dt) {
    if (this.paused) return;

    const steps = Math.min(4, Math.floor(dt / FIXED_DT));
    const remainder = dt - steps * FIXED_DT;
    for (let i = 0; i < steps; i++) this.fixedUpdate(FIXED_DT);
    if (remainder > 0 && steps < 4) this.fixedUpdate(remainder);

    if (this.flash > 0) this.flash -= dt * 0.008;
    if (this.shake > 0) {
      this.shake -= dt * 0.012;
      this.shakeX = (Math.random() - 0.5) * this.shake * 4;
      this.shakeY = (Math.random() - 0.5) * this.shake * 4;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  /** @param {number} dt */
  fixedUpdate(dt) {
    const s = dt / FIXED_DT;
    this.bird.frameT += dt;
    if (this.bird.frameT > 100) {
      this.bird.frameT = 0;
      this.bird.frame = (this.bird.frame + 1) % 3;
    }

    const scroll = this.state === State.PLAYING || this.state === State.DYING ? SCROLL_SPEED * s : 0;
    this.cloudOff = (this.cloudOff + scroll * 0.15) % 200;
    this.hillOff = (this.hillOff + scroll * 0.35) % 200;
    this.groundOff = (this.groundOff + scroll) % 16;

    if (this.state === State.MENU || this.state === State.READY) {
      this.bird.y = GROUND_Y / 2 - 20 + Math.sin(Date.now() / 300) * 4;
      this.bird.rot = 0;
      return;
    }

    if (this.state === State.PLAYING) {
      this.bird.vy += GRAVITY * s;
      if (this.bird.vy > MAX_FALL) this.bird.vy = MAX_FALL;
      this.bird.y += this.bird.vy * s;
      this.bird.rot = lerp(this.bird.rot, Math.min(Math.PI / 2, this.bird.vy * 0.12), 0.15 * s);

      for (const p of this.pipes) {
        p.x -= SCROLL_SPEED * s;
      }
      this.pipes = this.pipes.filter((p) => p.x > -PIPE_CAP_W - 4);

      const lastPipe = this.pipes[this.pipes.length - 1];
      if (!lastPipe || lastPipe.x <= W - PIPE_SPACING) {
        this.spawnPipe();
      }

      this.checkScore();
      if (this.checkCollision()) {
        this.state = State.DYING;
        this.dieTimer = 0;
        playHit();
        this.flash = 1;
        this.shake = 1;
      }
    }

    if (this.state === State.DYING) {
      this.dieTimer += dt;
      this.bird.vy += GRAVITY * s;
      if (this.bird.vy > MAX_FALL) this.bird.vy = MAX_FALL;
      this.bird.y += this.bird.vy * s;
      this.bird.rot = lerp(this.bird.rot, Math.PI / 2, 0.08 * s);

      for (const p of this.pipes) p.x -= SCROLL_SPEED * s;

      if (this.bird.y >= GROUND_Y - 10) {
        this.bird.y = GROUND_Y - 10;
        this.state = State.GAME_OVER;
        playDie();
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('flappy_high', String(this.highScore));
        }
      }
    }
  }

  spawnPipe() {
    const margin = 28;
    const minGapY = margin;
    const maxGapY = GROUND_Y - margin - this.gapSize;
    let gapY = minGapY + Math.random() * (maxGapY - minGapY);
    const prev = this.pipes[this.pipes.length - 1];
    if (prev) {
      gapY = Math.max(
        prev.gapY - PIPE_GAP_STEP_MAX,
        Math.min(prev.gapY + PIPE_GAP_STEP_MAX, gapY)
      );
    }
    this.pipes.push({
      x: W + 4,
      gapY,
      gap: this.gapSize,
      id: this.nextPipeId++,
      scored: false,
    });
    this.gapSize = Math.max(PIPE_GAP_MIN, this.gapSize - 0.15);
  }

  checkScore() {
    for (const p of this.pipes) {
      if (!p.scored && p.x + PIPE_CAP_W < this.bird.x) {
        p.scored = true;
        this.score++;
        playScore();
        if (this.score > 0 && this.score % 10 === 0) this.night = !this.night;
      }
    }
  }

  checkCollision() {
    const bx = this.bird.x;
    const by = this.bird.y;
    const hw = 5;
    const hh = 4;

    if (by - hh < 0 || by + hh > GROUND_Y) return true;

    for (const p of this.pipes) {
      if (this.pipeHitsBird(bx, by, hw, hh, p)) return true;
    }
    return false;
  }

  pipeHitsBird(bx, by, hw, hh, p) {
    const capH = this.sprites.pipeCapTop.h;
    const bodyX = p.x;
    const capX = p.x - PIPE_CAP_OFFSET;
    const gapTop = p.gapY;
    const gapBot = p.gapY + p.gap;

    const segments = [
      { x: bodyX, w: PIPE_W, y: 0, h: Math.max(0, gapTop - capH) },
      { x: capX, w: PIPE_CAP_W, y: gapTop - capH, h: capH },
      { x: capX, w: PIPE_CAP_W, y: gapBot, h: capH },
      { x: bodyX, w: PIPE_W, y: gapBot + capH, h: GROUND_Y - gapBot - capH },
    ];

    for (const s of segments) {
      if (s.h <= 0) continue;
      if (
        bx + hw > s.x &&
        bx - hw < s.x + s.w &&
        by + hh > s.y &&
        by - hh < s.y + s.h
      ) {
        return true;
      }
    }
    return false;
  }

  drawPipe(p) {
    const { ctx, sprites } = this;
    const capH = sprites.pipeCapTop.h;
    const bodyH = sprites.pipeBody.h;
    const bodyX = Math.floor(p.x);
    const capX = Math.floor(p.x - PIPE_CAP_OFFSET);

    // top pipe
    let y = Math.floor(p.gapY - capH);
    blit(ctx, sprites.pipeCapTop, capX, y);
    y -= bodyH;
    while (y > -bodyH) {
      blit(ctx, sprites.pipeBody, bodyX, y);
      y -= bodyH;
    }

    // bottom pipe
    y = Math.floor(p.gapY + p.gap);
    blit(ctx, sprites.pipeCapBottom, capX, y);
    y += capH;
    while (y < GROUND_Y) {
      blit(ctx, sprites.pipeBody, bodyX, y);
      y += bodyH;
    }
  }

  render() {
    const { ctx, sprites } = this;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    drawSky(ctx, W, H, GROUND_Y, this.night);

    // parallax clouds
    for (let i = -1; i < 3; i++) {
      const cx = Math.floor(i * 48 - this.cloudOff % 48);
      blit(ctx, sprites.cloud, cx, 28 + (i % 2) * 12);
      blit(ctx, sprites.cloud, cx + 72, 48);
    }

    const city = this.night ? sprites.cityNight : sprites.cityDay;
    for (let i = -1; i < 4; i++) {
      const hx = Math.floor(i * 36 - this.hillOff % 36);
      blit(ctx, sprites.hill, hx, GROUND_Y - sprites.hill.h - 8);
      blit(ctx, city, hx + 8, GROUND_Y - city.h - sprites.hill.h - 4);
    }

    for (const p of this.pipes) this.drawPipe(p);

    this.drawBird();

    // ground
    const gw = sprites.ground.w;
    for (let x = -gw; x < W + gw; x += gw) {
      blit(ctx, sprites.ground, Math.floor(x - this.groundOff), GROUND_Y);
    }
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(0, GROUND_Y + sprites.ground.h, W, H - GROUND_Y - sprites.ground.h);

    if (this.state === State.PLAYING || this.state === State.DYING) {
      drawNumber(ctx, sprites.digits, String(this.score), W / 2, 24);
    }

    if (this.state === State.MENU || this.state === State.READY) {
      drawNumber(ctx, sprites.digits, 'GET READY', W / 2, 78);
      if (this.state === State.MENU) {
        drawNumber(ctx, sprites.digits, 'TAP', W / 2, 118);
      }
    }

    if (this.state === State.GAME_OVER) {
      this.drawGameOverPanel();
    }

    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, W, H);
      drawNumber(ctx, sprites.digits, 'PAUSE', W / 2, H / 2 - 4);
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.7})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  drawBird() {
    const { ctx, sprites, bird } = this;
    const spr = sprites.bird[bird.frame];
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);
    ctx.drawImage(spr.canvas, -spr.w / 2, -spr.h / 2);
    ctx.restore();
  }

  drawGameOverPanel() {
    const { ctx, sprites, score, highScore } = this;
    drawNumber(ctx, sprites.digits, 'GAME OVER', W / 2, 36);

    const panelY = 92;
    const panelH = 108;

    ctx.fillStyle = '#ded895';
    ctx.fillRect(22, panelY, W - 44, panelH);
    ctx.strokeStyle = '#543847';
    ctx.lineWidth = 1;
    ctx.strokeRect(22.5, panelY + 0.5, W - 45, panelH - 1);

    const medal = medalForScore(score);
    if (medal) {
      const m =
        medal === 'bronze'
          ? sprites.medalBronze
          : medal === 'silver'
            ? sprites.medalSilver
            : medal === 'gold'
              ? sprites.medalGold
              : sprites.medalPlat;
      blit(ctx, m, 32, 110);
    }

    drawNumber(ctx, sprites.digits, String(score), 88, 104);
    drawNumber(ctx, sprites.digits, String(highScore), 88, 124);

    drawNumber(ctx, sprites.digits, 'TAP', W / 2, 208);
  }
}
