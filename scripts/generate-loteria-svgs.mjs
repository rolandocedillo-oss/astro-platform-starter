import fs from 'node:fs';
import path from 'node:path';
import { LOTERIA_CARDS } from '../src/scripts/loteria/cards.js';

const outDir = path.resolve('public/images/loteria/cards');
fs.mkdirSync(outDir, { recursive: true });

const license = 'Loteria card art © 2026 Ideas Kids Can. All rights reserved. Use requires explicit permission.';

const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const paletteFor = (id) => {
  const hue = (id * 37) % 360;
  const hue2 = (hue + 50 + (id % 5) * 12) % 360;
  return {
    base: `hsl(${hue}, 62%, 78%)`,
    base2: `hsl(${hue2}, 60%, 70%)`,
    accent: `hsl(${(hue + 20) % 360}, 70%, 55%)`,
    accent2: `hsl(${(hue + 160) % 360}, 60%, 60%)`,
    accent3: `hsl(${(hue + 250) % 360}, 70%, 50%)`,
    accent4: `hsl(${(hue + 310) % 360}, 70%, 55%)`,
    ink: 'rgba(43, 31, 31, 0.9)'
  };
};

const outline = (palette, extra = '') =>
  `stroke=\"${palette.ink}\" stroke-width=\"8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ${extra}`;

const circle = (cx, cy, r, fill, palette) =>
  `<circle cx=\"${cx}\" cy=\"${cy}\" r=\"${r}\" fill=\"${fill}\" ${outline(palette)} />`;

const ellipse = (cx, cy, rx, ry, fill, palette) =>
  `<ellipse cx=\"${cx}\" cy=\"${cy}\" rx=\"${rx}\" ry=\"${ry}\" fill=\"${fill}\" ${outline(palette)} />`;

const rect = (x, y, w, h, rx, fill, palette) =>
  `<rect x=\"${x}\" y=\"${y}\" width=\"${w}\" height=\"${h}\" rx=\"${rx}\" fill=\"${fill}\" ${outline(palette)} />`;

const line = (x1, y1, x2, y2, palette) =>
  `<line x1=\"${x1}\" y1=\"${y1}\" x2=\"${x2}\" y2=\"${y2}\" ${outline(palette, 'fill="none"')} />`;

const pathEl = (d, fill, palette) =>
  `<path d=\"${d}\" fill=\"${fill}\" ${outline(palette, fill === 'none' ? 'fill="none"' : '')} />`;

const polygon = (points, fill, palette) =>
  `<polygon points=\"${points}\" fill=\"${fill}\" ${outline(palette)} />`;

const iconRooster = (p) => `
  ${ellipse(300, 320, 110, 70, p.accent, p)}
  ${circle(200, 230, 46, p.base2, p)}
  ${polygon('240,230 285,248 240,266', p.accent2, p)}
  ${polygon('175,175 200,150 220,178', p.accent3, p)}
  ${polygon('205,170 230,145 252,175', p.accent3, p)}
  ${polygon('235,178 260,155 280,185', p.accent3, p)}
  ${polygon('355,295 445,250 420,330', p.accent4, p)}
  ${polygon('340,320 425,290 405,365', p.accent2, p)}
  ${line(260, 360, 260, 410, p)}
  ${line(285, 360, 285, 410, p)}
`;

const iconDevil = (p) => `
  ${circle(256, 230, 70, p.accent, p)}
  ${polygon('196,170 210,110 240,170', p.accent2, p)}
  ${polygon('316,170 340,110 356,170', p.accent2, p)}
  ${circle(230, 225, 12, '#fff', p)}
  ${circle(282, 225, 12, '#fff', p)}
  ${pathEl('M 210 270 Q 256 300 302 270', 'none', p)}
  ${pathEl('M 110 340 C 150 320 190 330 220 360', 'none', p)}
  ${polygon('210,350 250,332 235,370', p.accent3, p)}
`;

const iconLady = (p) => `
  ${circle(256, 200, 46, p.base2, p)}
  ${pathEl('M 210 170 Q 256 130 302 170', p.accent3, p)}
  ${polygon('176,360 256,230 336,360', p.accent, p)}
  ${circle(230, 200, 6, p.ink, p)}
  ${circle(282, 200, 6, p.ink, p)}
  ${pathEl('M 232 220 Q 256 238 280 220', 'none', p)}
`;

const iconGentleman = (p) => `
  ${rect(210, 120, 92, 38, 8, p.accent2, p)}
  ${rect(200, 150, 112, 26, 10, p.accent2, p)}
  ${circle(256, 210, 48, p.base2, p)}
  ${rect(210, 250, 92, 120, 20, p.accent, p)}
  ${polygon('256,250 240,300 272,300', p.accent3, p)}
`;

const iconParasol = (p) => `
  ${pathEl('M 140 260 Q 256 140 372 260 Z', p.accent, p)}
  ${line(256, 260, 256, 380, p)}
  ${pathEl('M 256 380 Q 266 420 230 430', 'none', p)}
`;

const iconMermaid = (p) => `
  ${circle(256, 190, 42, p.base2, p)}
  ${rect(220, 230, 72, 80, 20, p.accent, p)}
  ${pathEl('M 256 310 C 230 340 210 370 210 400 C 240 400 256 380 256 380 C 256 380 272 400 302 400 C 302 370 282 340 256 310 Z', p.accent2, p)}
  ${polygon('210,400 170,440 220,430', p.accent3, p)}
  ${polygon('302,400 342,440 292,430', p.accent3, p)}
`;

const iconLadder = (p) => `
  ${line(190, 150, 190, 380, p)}
  ${line(322, 150, 322, 380, p)}
  ${line(190, 190, 322, 190, p)}
  ${line(190, 240, 322, 240, p)}
  ${line(190, 290, 322, 290, p)}
  ${line(190, 340, 322, 340, p)}
`;

const iconBottle = (p) => `
  ${rect(230, 120, 52, 60, 12, p.accent3, p)}
  ${rect(210, 170, 92, 220, 30, p.accent, p)}
  ${rect(228, 200, 56, 120, 18, p.base2, p)}
`;

const iconBarrel = (p) => `
  ${rect(180, 170, 152, 220, 40, p.accent, p)}
  ${pathEl('M 180 230 Q 256 200 332 230', 'none', p)}
  ${pathEl('M 180 300 Q 256 330 332 300', 'none', p)}
  ${line(180, 250, 332, 250, p)}
`;

const iconTree = (p) => `
  ${rect(236, 280, 40, 120, 12, p.accent2, p)}
  ${circle(220, 240, 60, p.accent, p)}
  ${circle(292, 240, 60, p.accent, p)}
  ${circle(256, 190, 70, p.base2, p)}
`;

const iconMelon = (p) => `
  ${ellipse(256, 260, 120, 90, p.accent, p)}
  ${line(256, 170, 256, 350, p)}
  ${pathEl('M 210 185 Q 200 260 210 335', 'none', p)}
  ${pathEl('M 302 185 Q 312 260 302 335', 'none', p)}
`;

const iconValiente = (p) => `
  ${circle(256, 200, 42, p.base2, p)}
  ${rect(220, 240, 72, 120, 18, p.accent, p)}
  ${line(320, 190, 360, 150, p)}
  ${line(320, 210, 360, 170, p)}
  ${pathEl('M 360 150 L 390 120', 'none', p)}
  ${rect(240, 280, 32, 60, 10, p.accent2, p)}
`;

const iconBonnet = (p) => `
  ${pathEl('M 170 260 Q 256 150 342 260 Z', p.accent, p)}
  ${pathEl('M 180 260 Q 256 220 332 260', 'none', p)}
  ${line(256, 260, 256, 330, p)}
`;

const iconDeath = (p) => `
  ${circle(236, 210, 50, p.base2, p)}
  ${circle(220, 210, 10, '#fff', p)}
  ${circle(252, 210, 10, '#fff', p)}
  ${rect(210, 250, 52, 50, 14, p.accent, p)}
  ${pathEl('M 330 140 Q 370 180 360 240', 'none', p)}
  ${pathEl('M 300 150 Q 360 140 380 180', 'none', p)}
`;

const iconPear = (p) => `
  ${pathEl('M 256 160 C 210 170 190 220 200 260 C 180 310 210 370 256 372 C 302 370 332 310 312 260 C 322 220 302 170 256 160 Z', p.accent, p)}
  ${line(256, 140, 256, 170, p)}
`;

const iconFlag = (p) => `
  ${line(190, 140, 190, 380, p)}
  ${pathEl('M 190 150 Q 280 140 320 180 Q 280 220 190 210 Z', p.accent, p)}
  ${pathEl('M 190 210 Q 280 200 320 240 Q 280 280 190 270 Z', p.accent2, p)}
`;

const iconMandolin = (p) => `
  ${circle(236, 280, 70, p.accent, p)}
  ${circle(236, 280, 28, p.base2, p)}
  ${rect(280, 160, 40, 160, 16, p.accent2, p)}
  ${rect(280, 130, 60, 36, 10, p.accent2, p)}
`;

const iconCello = (p) => `
  ${ellipse(256, 280, 70, 110, p.accent, p)}
  ${rect(246, 140, 20, 120, 10, p.accent2, p)}
  ${line(244, 180, 244, 360, p)}
  ${line(268, 180, 268, 360, p)}
  ${pathEl('M 226 260 Q 256 240 286 260', 'none', p)}
`;

const iconHeron = (p) => `
  ${ellipse(260, 300, 70, 50, p.accent, p)}
  ${circle(210, 240, 30, p.base2, p)}
  ${line(230, 230, 300, 200, p)}
  ${line(260, 320, 240, 400, p)}
  ${line(280, 320, 270, 400, p)}
`;

const iconBird = (p) => `
  ${pathEl('M 150 260 Q 210 200 256 240 Q 310 190 370 220', 'none', p)}
  ${pathEl('M 190 280 Q 240 250 256 270 Q 290 230 340 250', 'none', p)}
`;

const iconHand = (p) => `
  ${rect(210, 230, 92, 120, 20, p.accent, p)}
  ${rect(190, 180, 26, 90, 12, p.base2, p)}
  ${rect(220, 160, 26, 90, 12, p.base2, p)}
  ${rect(250, 150, 26, 100, 12, p.base2, p)}
  ${rect(280, 160, 26, 90, 12, p.base2, p)}
`;

const iconBoot = (p) => `
  ${pathEl('M 190 170 H 290 V 260 H 350 V 330 H 200 Q 170 330 170 300 V 210 Q 170 180 190 170 Z', p.accent, p)}
  ${line(210, 260, 340, 260, p)}
`;

const iconMoon = (p) => `
  ${circle(260, 240, 90, p.accent2, p)}
  ${circle(300, 230, 70, p.base, p)}
`;

const iconParrot = (p) => `
  ${ellipse(260, 290, 70, 90, p.accent, p)}
  ${circle(230, 210, 36, p.base2, p)}
  ${polygon('250,210 290,225 250,240', p.accent2, p)}
  ${polygon('300,320 360,360 300,380', p.accent3, p)}
  ${line(190, 350, 320, 350, p)}
`;

const iconDrunk = (p) => `
  ${circle(230, 210, 40, p.base2, p)}
  ${rect(200, 250, 100, 120, 20, p.accent, p)}
  ${rect(310, 200, 40, 140, 14, p.accent2, p)}
  ${line(310, 220, 350, 220, p)}
`;

const iconNegrito = (p) => `
  ${rect(210, 140, 92, 30, 8, p.accent2, p)}
  ${rect(200, 168, 112, 18, 8, p.accent2, p)}
  ${circle(256, 220, 46, p.base2, p)}
  ${rect(206, 260, 100, 120, 22, p.accent, p)}
  ${pathEl('M 216 300 Q 256 330 296 300', 'none', p)}
`;

const iconHeart = (p) => `
  ${pathEl('M 256 340 C 200 300 170 260 170 220 C 170 190 195 170 226 170 C 245 170 262 180 272 196 C 282 180 299 170 318 170 C 349 170 374 190 374 220 C 374 260 345 300 256 340 Z', p.accent, p)}
`;

const iconWatermelon = (p) => `
  ${polygon('170,340 256,170 342,340', p.accent, p)}
  ${polygon('190,330 256,200 322,330', p.base2, p)}
  ${circle(230, 300, 8, p.ink, p)}
  ${circle(256, 280, 8, p.ink, p)}
  ${circle(282, 300, 8, p.ink, p)}
`;

const iconDrum = (p) => `
  ${ellipse(256, 200, 90, 40, p.base2, p)}
  ${rect(166, 200, 180, 140, 30, p.accent, p)}
  ${ellipse(256, 340, 90, 40, p.base2, p)}
  ${line(190, 220, 322, 220, p)}
`;

const iconShrimp = (p) => `
  ${pathEl('M 180 300 Q 200 220 260 210 Q 340 200 330 300 Q 320 360 250 360 Q 210 360 200 330', 'none', p)}
  ${pathEl('M 210 260 Q 250 250 290 260', 'none', p)}
  ${pathEl('M 220 290 Q 260 280 300 290', 'none', p)}
  ${circle(200, 240, 6, p.ink, p)}
`;

const iconArrows = (p) => `
  ${pathEl('M 180 320 L 320 180', 'none', p)}
  ${polygon('320,180 300,176 312,196', p.accent, p)}
  ${pathEl('M 180 180 L 320 320', 'none', p)}
  ${polygon('320,320 300,324 312,304', p.accent2, p)}
`;

const iconMusician = (p) => `
  ${circle(210, 200, 42, p.base2, p)}
  ${rect(176, 240, 80, 120, 18, p.accent, p)}
  ${circle(330, 300, 50, p.accent2, p)}
  ${rect(300, 200, 30, 120, 12, p.accent2, p)}
`;

const iconSpider = (p) => `
  ${circle(256, 260, 46, p.accent, p)}
  ${circle(256, 210, 28, p.base2, p)}
  ${line(200, 230, 140, 200, p)}
  ${line(200, 250, 140, 250, p)}
  ${line(200, 280, 140, 310, p)}
  ${line(312, 230, 372, 200, p)}
  ${line(312, 250, 372, 250, p)}
  ${line(312, 280, 372, 310, p)}
`;

const iconSoldier = (p) => `
  ${rect(200, 150, 112, 40, 10, p.accent2, p)}
  ${circle(256, 220, 48, p.base2, p)}
  ${rect(206, 270, 100, 120, 20, p.accent, p)}
  ${polygon('256,160 244,178 268,178', p.accent3, p)}
`;

const iconStar = (p) => `
  ${polygon('256,150 286,220 362,230 304,280 320,350 256,310 192,350 208,280 150,230 226,220', p.accent, p)}
`;

const iconSaucepan = (p) => `
  ${circle(230, 280, 70, p.accent, p)}
  ${line(300, 260, 380, 220, p)}
  ${line(300, 300, 380, 260, p)}
  ${line(230, 350, 230, 380, p)}
`;

const iconWorld = (p) => `
  ${circle(256, 260, 100, p.base2, p)}
  ${pathEl('M 156 260 Q 256 200 356 260 Q 256 320 156 260 Z', 'none', p)}
  ${pathEl('M 256 160 Q 220 260 256 360 Q 292 260 256 160 Z', 'none', p)}
  ${line(156, 260, 356, 260, p)}
`;

const iconApache = (p) => `
  ${circle(256, 220, 46, p.base2, p)}
  ${rect(206, 260, 100, 120, 20, p.accent, p)}
  ${polygon('300,150 360,120 330,180', p.accent2, p)}
  ${line(330, 180, 340, 230, p)}
`;

const iconCactus = (p) => `
  ${rect(240, 180, 40, 200, 18, p.accent, p)}
  ${rect(180, 220, 40, 100, 18, p.accent, p)}
  ${rect(292, 240, 40, 100, 18, p.accent, p)}
`;

const iconScorpion = (p) => `
  ${ellipse(240, 290, 60, 40, p.accent, p)}
  ${ellipse(300, 270, 40, 28, p.accent2, p)}
  ${pathEl('M 320 250 Q 360 220 340 170', 'none', p)}
  ${polygon('340,170 330,150 360,160', p.accent3, p)}
  ${line(200, 300, 160, 320, p)}
  ${line(200, 320, 160, 350, p)}
  ${line(300, 300, 360, 320, p)}
  ${line(300, 320, 360, 350, p)}
`;

const iconRose = (p) => `
  ${pathEl('M 256 210 C 220 190 210 230 236 250 C 210 260 220 300 256 290 C 292 300 302 260 276 250 C 302 230 292 190 256 210 Z', p.accent, p)}
  ${line(256, 290, 256, 380, p)}
  ${polygon('256,320 220,340 256,348', p.accent2, p)}
  ${polygon('256,340 292,360 256,368', p.accent2, p)}
`;

const iconSkull = (p) => `
  ${circle(256, 220, 60, p.base2, p)}
  ${circle(230, 220, 12, '#fff', p)}
  ${circle(282, 220, 12, '#fff', p)}
  ${rect(220, 270, 72, 60, 18, p.accent, p)}
  ${line(236, 300, 276, 300, p)}
`;

const iconBell = (p) => `
  ${pathEl('M 190 320 Q 256 160 322 320 Z', p.accent, p)}
  ${circle(256, 330, 12, p.accent2, p)}
  ${line(210, 320, 302, 320, p)}
`;

const iconPitcher = (p) => `
  ${pathEl('M 200 180 H 300 V 360 Q 300 400 256 400 Q 212 400 212 360 V 180 Z', p.accent, p)}
  ${pathEl('M 300 220 Q 350 240 332 290 Q 320 320 300 320', 'none', p)}
`;

const iconDeer = (p) => `
  ${circle(256, 240, 50, p.base2, p)}
  ${pathEl('M 210 180 Q 190 140 160 120', 'none', p)}
  ${pathEl('M 302 180 Q 322 140 352 120', 'none', p)}
  ${pathEl('M 170 140 Q 190 150 200 170', 'none', p)}
  ${pathEl('M 342 140 Q 322 150 312 170', 'none', p)}
`;

const iconSun = (p) => `
  ${circle(256, 250, 70, p.accent, p)}
  ${line(256, 150, 256, 110, p)}
  ${line(256, 350, 256, 390, p)}
  ${line(160, 250, 120, 250, p)}
  ${line(352, 250, 392, 250, p)}
  ${line(190, 190, 160, 160, p)}
  ${line(322, 190, 352, 160, p)}
  ${line(190, 310, 160, 340, p)}
  ${line(322, 310, 352, 340, p)}
`;

const iconCrown = (p) => `
  ${pathEl('M 180 320 L 210 220 L 256 280 L 302 220 L 332 320 Z', p.accent, p)}
  ${rect(180, 320, 152, 40, 12, p.accent2, p)}
  ${circle(210, 220, 10, p.accent3, p)}
  ${circle(256, 280, 10, p.accent3, p)}
  ${circle(302, 220, 10, p.accent3, p)}
`;

const iconRowboat = (p) => `
  ${pathEl('M 170 320 Q 256 360 342 320 L 310 370 Q 256 400 202 370 Z', p.accent, p)}
  ${line(200, 250, 320, 200, p)}
  ${line(310, 200, 350, 220, p)}
`;

const iconPine = (p) => `
  ${polygon('256,150 180,260 332,260', p.accent, p)}
  ${polygon('256,210 170,330 342,330', p.accent2, p)}
  ${rect(236, 330, 40, 80, 10, p.accent3, p)}
`;

const iconFish = (p) => `
  ${ellipse(240, 270, 70, 40, p.accent, p)}
  ${polygon('310,270 360,240 360,300', p.accent2, p)}
  ${circle(220, 260, 6, p.ink, p)}
`;

const iconPalm = (p) => `
  ${rect(246, 220, 20, 180, 10, p.accent3, p)}
  ${pathEl('M 256 220 Q 200 180 160 190', 'none', p)}
  ${pathEl('M 256 220 Q 220 150 190 140', 'none', p)}
  ${pathEl('M 256 220 Q 300 160 340 150', 'none', p)}
  ${pathEl('M 256 220 Q 320 190 370 200', 'none', p)}
`;

const iconFlowerpot = (p) => `
  ${polygon('200,320 312,320 330,400 182,400', p.accent, p)}
  ${rect(190, 300, 140, 30, 10, p.accent2, p)}
  ${circle(256, 240, 36, p.base2, p)}
  ${polygon('256,210 240,180 270,190', p.accent3, p)}
`;

const iconHarp = (p) => `
  ${pathEl('M 210 160 Q 170 260 200 380 L 260 380 Q 290 260 250 160 Z', p.accent, p)}
  ${line(230, 200, 230, 360, p)}
  ${line(250, 200, 250, 360, p)}
  ${line(270, 210, 270, 350, p)}
`;

const iconFrog = (p) => `
  ${ellipse(256, 300, 90, 60, p.accent, p)}
  ${circle(220, 230, 22, p.base2, p)}
  ${circle(292, 230, 22, p.base2, p)}
  ${circle(220, 230, 6, p.ink, p)}
  ${circle(292, 230, 6, p.ink, p)}
  ${pathEl('M 220 320 Q 256 340 292 320', 'none', p)}
`;

const iconMap = new Map([
  [1, iconRooster],
  [2, iconDevil],
  [3, iconLady],
  [4, iconGentleman],
  [5, iconParasol],
  [6, iconMermaid],
  [7, iconLadder],
  [8, iconBottle],
  [9, iconBarrel],
  [10, iconTree],
  [11, iconMelon],
  [12, iconValiente],
  [13, iconBonnet],
  [14, iconDeath],
  [15, iconPear],
  [16, iconFlag],
  [17, iconMandolin],
  [18, iconCello],
  [19, iconHeron],
  [20, iconBird],
  [21, iconHand],
  [22, iconBoot],
  [23, iconMoon],
  [24, iconParrot],
  [25, iconDrunk],
  [26, iconNegrito],
  [27, iconHeart],
  [28, iconWatermelon],
  [29, iconDrum],
  [30, iconShrimp],
  [31, iconArrows],
  [32, iconMusician],
  [33, iconSpider],
  [34, iconSoldier],
  [35, iconStar],
  [36, iconSaucepan],
  [37, iconWorld],
  [38, iconApache],
  [39, iconCactus],
  [40, iconScorpion],
  [41, iconRose],
  [42, iconSkull],
  [43, iconBell],
  [44, iconPitcher],
  [45, iconDeer],
  [46, iconSun],
  [47, iconCrown],
  [48, iconRowboat],
  [49, iconPine],
  [50, iconFish],
  [51, iconPalm],
  [52, iconFlowerpot],
  [53, iconHarp],
  [54, iconFrog]
]);

const wrapSvg = (card, palette, iconMarkup) => `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!-- ${license} -->
<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"512\" height=\"512\" viewBox=\"0 0 512 512\">
  <defs>
    <linearGradient id=\"bg\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"1\">
      <stop offset=\"0%\" stop-color=\"${palette.base}\" />
      <stop offset=\"100%\" stop-color=\"${palette.base2}\" />
    </linearGradient>
  </defs>
  <rect width=\"512\" height=\"512\" rx=\"48\" fill=\"url(#bg)\" />
  <rect x=\"32\" y=\"32\" width=\"448\" height=\"448\" rx=\"40\" fill=\"rgba(255,255,255,0.32)\" stroke=\"rgba(30,20,20,0.12)\" stroke-width=\"4\" />
  <g>
    ${iconMarkup}
  </g>
  <text x=\"48\" y=\"462\" font-family=\"Signika, sans-serif\" font-size=\"44\" font-weight=\"700\" fill=\"rgba(30,20,20,0.75)\">#${card.id}</text>
</svg>
`;

for (const card of LOTERIA_CARDS) {
  const palette = paletteFor(card.id);
  const iconFn = iconMap.get(card.id);
  const iconMarkup = iconFn ? iconFn(palette) : '';
  const svg = wrapSvg(card, palette, iconMarkup);
  const slug = slugify(card.nameEs);
  fs.writeFileSync(path.join(outDir, `${slug}.svg`), svg, 'utf8');
}

fs.writeFileSync(
  path.resolve('public/images/loteria/LICENSE.txt'),
  `${license}\n\nNo license is granted for reuse, modification, or distribution without explicit written permission from the owner.\n`,
  'utf8'
);

console.log('Generated', LOTERIA_CARDS.length, 'illustrative SVGs.');
