/** @typedef {{ canvas: HTMLCanvasElement, w: number, h: number }} Sprite */

/**
 * @param {string[]} rows
 * @param {Record<string, string>} palette
 * @returns {Sprite}
 */
export function buildSprite(rows, palette) {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return { canvas, w, h };
}

export const PAL = {
  bird: {
    '.': 'transparent',
    Y: '#f8d030',
    y: '#e0a820',
    O: '#f87818',
    W: '#ffffff',
    B: '#181818',
    R: '#d82800',
  },
  pipe: {
    '.': 'transparent',
    G: '#4caf50',
    g: '#388e3c',
    D: '#2e7d32',
    L: '#81c784',
    E: '#1a3a1a',
    K: '#0d1f0d',
  },
  cloud: {
    '.': 'transparent',
    W: '#ffffff',
    w: '#e8f4ff',
  },
  hill: {
    '.': 'transparent',
    H: '#9ccfb0',
    h: '#b8dcc8',
    D: '#7ab896',
  },
  city: {
    '.': 'transparent',
    S: '#a8b8c8',
    s: '#c8d4e0',
    W: '#ffe878',
    w: '#d8e0e8',
    D: '#8898a8',
  },
  ground: {
    '.': 'transparent',
    T: '#de9c4a',
    t: '#c8843a',
    G: '#5cb85c',
    g: '#4a9a4a',
    D: '#8a5a2a',
  },
  ui: {
    '.': 'transparent',
    W: '#ffffff',
    O: '#f87818',
    Y: '#f8d030',
    R: '#d82800',
    G: '#5cb85c',
    B: '#181818',
    S: '#c0c0c0',
    s: '#808080',
    P: '#e8e8f0',
    p: '#a0a0b0',
    C: '#cd7f32',
    c: '#8b4513',
    E: '#ffffff',
    T: '#ffffff',
    A: '#ffffff',
    D: '#ffffff',
    M: '#ffffff',
    V: '#ffffff',
  },
};

/** Bird frames: 17x12, facing right — wing up / mid / down */
const BIRD_FRAMES = [
  [
    '.................',
    '....BBBBB........',
    '...BYYYYYB.......',
    '..BYYYYYYYB......',
    '.BYYYYYYYYYB.....',
    'BYYYYYYYYYYYB....',
    'BYYYWBBYYYYYB....',
    'BYYYYBYYYYYYB....',
    'BYYYYYYYYYOOB....',
    '.BYYYYYYOOBB.....',
    '..BYYYOOB........',
    '...BOO...........',
  ],
  [
    '.................',
    '....BBBBB........',
    '...BYYYYYB.......',
    '..BYYYYYYYB......',
    '.BYYYYYYYYYB.....',
    'BYYYYYYYYYYYB....',
    'BYYYWBBYYYYYB....',
    'BYYYYBWWYYYYB....',
    'BYYYYYYYYYOOB....',
    '.BYYYYOOOOB......',
    '..BYOOOB.........',
    '...BO............',
  ],
  [
    '.................',
    '....BBBBB........',
    '...BYYYYYB.......',
    '..BYYYYYYYB......',
    '.BYYYYYYYYYB.....',
    'BYYYYYYYYYYYB....',
    'BYYYWBBYYYYYB....',
    'BYYYYBYYYYYYB....',
    'BYYYYYYYYYOOB....',
    '.BYYYYYYOOBB.....',
    '..BYYYYOOB.......',
    '...BYOO..........',
  ],
];

const G14 = 'G'.repeat(14);
const G16 = 'G'.repeat(16);
const G17 = 'G'.repeat(17);
const LIP26 = (ch) => `..${ch.repeat(22)}..`;

/** Pipe body 22px — E=outline, L/G/g/D=shading */
const PIPE_BODY = [
  `EEEL${G14}gDEE`,
  `EL${G16}gDEE`,
  `L${G17}gDEE`,
  `L${G17}gDEE`,
  `L${G17}gDEE`,
  `L${G17}gDEE`,
  `EL${G16}gDEE`,
  `EEEL${G14}gDEE`,
];

/** Pipe cap 26px x 12 — top: dark lip on bottom (gap side) */
const PIPE_CAP_TOP = [
  `..EEEL${G14}gDEE..`,
  `..EL${G16}gDEE..`,
  `..L${G17}gDEE..`,
  `..L${G17}gDEE..`,
  `..L${G17}gDEE..`,
  `..L${G17}gDEE..`,
  `..L${G17}gDEE..`,
  `..EL${G16}gDEE..`,
  LIP26('E'),
  LIP26('K'),
  LIP26('E'),
  LIP26('E'),
];

/** Pipe cap 26px x 12 — bottom: dark lip on top (gap side) */
const PIPE_CAP_BOTTOM = [
  LIP26('E'),
  LIP26('K'),
  LIP26('E'),
  `..EEEL${G14}gDEE..`,
  `..EL${G16}gDEE..`,
  `..L${G17}gDEE..`,
  `..L${G17}gDEE..`,
  `..L${G17}gDEE..`,
  `..L${G17}gDEE..`,
  `..EL${G16}gDEE..`,
  `..EEEL${G14}gDEE..`,
  LIP26('E'),
];

const CLOUD = [
  '......wwww......',
  '....wwWWWWww....',
  '..wwWWWWWWWWww..',
  '.wwWWWWWWWWWWww.',
  'wwWWWWWWWWWWWWww',
  'wwWWWWWWWWWWWWww',
  '.wwWWWWWWWWWWww.',
  '..wwWWWWWWWWww..',
  '....wwWWWWww....',
];

const HILL = [
  '................',
  '................',
  '......hhhh......',
  '....hhhhHHhh....',
  '..hhhhHHHHHHhh..',
  '.hhhHHHHHHHHHHh.',
  'hhHHHHHHHHHHHHHh',
  'hHHHHHHHHHHHHHHH',
];

const CITY_DAY = [
  '................',
  '....ss....ss....',
  '....ss....ss....',
  '...sSS...sSS....',
  '...sSS...sSS....',
  '..sSSS..sSSS....',
  '..sSSS..sSSS....',
  '.sSSSS.sSSSS....',
];

const CITY_NIGHT = [
  '................',
  '....ss....ss....',
  '....ssW...ss....',
  '...sSS...sSSW...',
  '...sSSW..sSS....',
  '..sSSS..sSSS....',
  '..sSSS.WsSSS....',
  '.sSSSS.sSSSS....',
];

const GROUND_TILE = [
  'GGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGG',
  'TTTTTTTTTTTTTTTT',
  'TtTtTtTtTtTtTtTt',
  'tTtTtTtTtTtTtTt',
  'DDDDDDDDDDDDDDDD',
];

const LETTERS = {
  T: ['WWW.', '..W.', '..W.', '..W.', '..W.', '..W.'],
  A: ['WWW.', 'W.W.', 'WWW.', 'W.W.', 'W.W.', 'W.W.'],
  P: ['WWW.', 'W.W.', 'WWW.', 'W...', 'W...', 'W...'],
  U: ['W.W.', 'W.W.', 'W.W.', 'W.W.', 'W.W.', 'WWW.'],
  S: ['WWW.', 'W...', 'WWW.', '..W.', '..W.', 'WWW.'],
  E: ['WWW.', 'W...', 'WWW.', 'W...', 'W...', 'WWW.'],
  G: ['WWW.', 'W...', 'W.W.', 'W.W.', 'W.W.', 'WWW.'],
  R: ['WWW.', 'W.W.', 'WWW.', 'W.W.', 'W.W.', 'W.W.'],
  D: ['WWW.', 'W.W.', 'W.W.', 'W.W.', 'W.W.', 'WWW.'],
  Y: ['W.W.', 'W.W.', '.W..', '.W..', '.W..', '.W..'],
  M: ['W.W.', 'WWW.', 'W.W.', 'W.W.', 'W.W.', 'W.W.'],
  O: ['WWW.', 'W.W.', 'W.W.', 'W.W.', 'W.W.', 'WWW.'],
  V: ['W.W.', 'W.W.', 'W.W.', 'W.W.', '.W..', '.W..'],
};

const DIGITS = {
  '0': ['WWWW', 'W..W', 'W..W', 'W..W', 'W..W', 'WWWW'],
  '1': ['..W.', '.WW.', '..W.', '..W.', '..W.', 'WWW.'],
  '2': ['WWW.', '..W.', '..W.', 'WWW.', 'W...', 'WWWW'],
  '3': ['WWW.', '..W.', 'WWW.', '..W.', '..W.', 'WWW.'],
  '4': ['W..W', 'W..W', 'WWWW', '..W.', '..W.', '..W.'],
  '5': ['WWWW', 'W...', 'WWW.', '..W.', '..W.', 'WWW.'],
  '6': ['WWW.', 'W...', 'WWW.', 'W..W', 'W..W', 'WWW.'],
  '7': ['WWWW', '..W.', '..W.', '..W.', '..W.', '..W.'],
  '8': ['WWW.', 'W..W', 'WWW.', 'W..W', 'W..W', 'WWW.'],
  '9': ['WWW.', 'W..W', 'WWW.', '..W.', '..W.', 'WWW.'],
};

const MEDAL_BRONZE = [
  '....CCCC....',
  '...CccccC...',
  '...CcCcCc...',
  '...CccccC...',
  '....CCCC....',
  '....WWWW....',
  '...WW..WW...',
  '..WW....WW..',
];

const MEDAL_SILVER = [
  '....SSSS....',
  '...SssssS...',
  '...SsSsSs...',
  '...SssssS...',
  '....SSSS....',
  '....WWWW....',
  '...WW..WW...',
  '..WW....WW..',
];

const MEDAL_GOLD = [
  '....YYYY....',
  '...YyyyyY...',
  '...YyYyYy...',
  '...YyyyyY...',
  '....YYYY....',
  '....WWWW....',
  '...WW..WW...',
  '..WW....WW..',
];

const MEDAL_PLAT = [
  '....PPPP....',
  '...PppppP...',
  '...PpPpPp...',
  '...PppppP...',
  '....PPPP....',
  '....WWWW....',
  '...WW..WW...',
  '..WW....WW..',
];

export function createSprites() {
  return {
    bird: BIRD_FRAMES.map((f) => buildSprite(f, PAL.bird)),
    pipeCapTop: buildSprite(PIPE_CAP_TOP, PAL.pipe),
    pipeCapBottom: buildSprite(PIPE_CAP_BOTTOM, PAL.pipe),
    pipeBody: buildSprite(PIPE_BODY, PAL.pipe),
    cloud: buildSprite(CLOUD, PAL.cloud),
    hill: buildSprite(HILL, PAL.hill),
    cityDay: buildSprite(CITY_DAY, PAL.city),
    cityNight: buildSprite(CITY_NIGHT, PAL.city),
    ground: buildSprite(GROUND_TILE, PAL.ground),
    medalBronze: buildSprite(MEDAL_BRONZE, { ...PAL.ui, C: '#cd7f32', c: '#8b4513' }),
    medalSilver: buildSprite(MEDAL_SILVER, PAL.ui),
    medalGold: buildSprite(MEDAL_GOLD, PAL.ui),
    medalPlat: buildSprite(MEDAL_PLAT, PAL.ui),
    digits: Object.fromEntries(
      Object.entries({ ...DIGITS, ...LETTERS }).map(([k, v]) => [k, buildSprite(v, PAL.ui)])
    ),
  };
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawSky(ctx, w, h, groundY, night) {
  const bands = night
    ? ['#0a0a28', '#121238', '#1a1a48', '#222258']
    : ['#4ec0e9', '#58c8f0', '#62d0f5', '#6cd8fa'];
  const bandH = Math.ceil((groundY + 8) / bands.length);
  for (let i = 0; i < bands.length; i++) {
    ctx.fillStyle = bands[i];
    ctx.fillRect(0, i * bandH, w, bandH + 1);
  }
  if (night) {
    ctx.fillStyle = '#ffffff';
    const stars = [
      [12, 18], [28, 42], [45, 12], [72, 28], [98, 15], [118, 38], [88, 55], [35, 62],
    ];
    for (const [sx, sy] of stars) {
      ctx.fillRect(sx, sy, 1, 1);
      if (sx % 3 === 0) ctx.fillRect(sx + 1, sy, 1, 1);
    }
  }
}

/** @param {import('./sprites.js').Sprite} sprite */
export function blit(ctx, sprite, x, y, flipX = false) {
  ctx.save();
  if (flipX) {
    ctx.translate(x + sprite.w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite.canvas, 0, 0);
  } else {
    ctx.drawImage(sprite.canvas, x, y);
  }
  ctx.restore();
}

/** @param {import('./sprites.js').Sprite} sprite */
export function blitScaled(ctx, sprite, x, y, scale = 1) {
  ctx.drawImage(sprite.canvas, x, y, sprite.w * scale, sprite.h * scale);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Record<string, import('./sprites.js').Sprite>} digits
 * @param {string} text
 * @param {number} cx
 * @param {number} y
 */
export function drawNumber(ctx, digits, text, cx, y) {
  const chars = text.split('');
  const spaceW = 3;
  let totalW = 0;
  for (const c of chars) {
    if (c === ' ') totalW += spaceW;
    else totalW += (digits[c]?.w ?? 4) + 1;
  }
  if (totalW > 0) totalW -= 1;
  let x = Math.floor(cx - totalW / 2);
  for (const c of chars) {
    if (c === ' ') {
      x += spaceW;
      continue;
    }
    const d = digits[c];
    if (d) {
      blit(ctx, d, x, y);
      x += d.w + 1;
    }
  }
}
