// Comprobación de maquetación vía Chrome DevTools Protocol.
// Uso: node tools/probe.mjs <url> [ancho] [alto]
// Imprime geometría y detecta desbordes/solapamientos del HUD.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9335;
const PROFILE = 'C:\\Users\\crcam\\AppData\\Local\\Temp\\opencode\\edge-probe';

const url = process.argv[2] ?? 'http://127.0.0.1:5173/';
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);

mkdirSync(PROFILE, { recursive: true });

const child = spawn(
  EDGE,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    `--window-size=${width},${height}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let nextId = 1;
const pending = new Map();

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`Timeout: ${method}`));
      }
    }, 30000);
  });
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}

try {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) break;
    } catch {
      /* esperando */
    }
    await sleep(150);
  }

  const target = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  ).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 760,
  });
  await send('Page.navigate', { url });
  await sleep(4000);

  const report = await evaluate(`(() => {
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height),
               bottom: Math.round(b.bottom), right: Math.round(b.right) };
    };
    const q = (s) => document.querySelector(s);
    const screen = [...document.querySelectorAll('.screen')].find((s) => s.classList.contains('is-active'));
    const out = {
      pantalla: screen ? screen.id : null,
      viewport: { w: innerWidth, h: innerHeight },
      fuentes: { estado: document.fonts.status, baloo: document.fonts.check('700 20px "Baloo 2"'), nunito: document.fonts.check('400 14px Nunito') },
      desbordeX: document.documentElement.scrollWidth > innerWidth,
      desbordeY: document.documentElement.scrollHeight > innerHeight,
    };
    if (q('.menu')) {
      out.menu = { ...r(q('.menu')), scroll: q('.menu').scrollHeight, client: q('.menu').clientHeight };
      out.cards = [...document.querySelectorAll('.level-card')].map((c) => ({ ...r(c), texto: c.querySelector('h3')?.textContent?.trim() }));
      out.footer = r(q('.menu__footer'));
      out.brand = r(q('.brand'));
      out.menuScroll = q('.menu').scrollHeight - q('.menu').clientHeight;
    }
    if (q('.hud')) {
      out.pills = [...document.querySelectorAll('.hud .pill')].map(r);
      out.meter = r(q('.meter'));
      out.tools = [...document.querySelectorAll('.hud .icon-btn')].map(r);
      out.pista = r(q('.hint-btn'));
      out.card = r(q('.inspect__card'));
      out.hudOverlaps = (() => {
        const els = [...document.querySelectorAll('.hud .pill, .meter')].map((el) => el.getBoundingClientRect());
        const hits = [];
        for (let i = 0; i < els.length; i += 1) {
          for (let j = i + 1; j < els.length; j += 1) {
            const a = els[i], b = els[j];
            if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) hits.push([i, j]);
          }
        }
        return hits;
      })();
    }
    return out;
  })()`);

  console.log(JSON.stringify(report, null, 2));
} finally {
  try {
    if (ws) ws.close();
  } catch {
    /* nada */
  }
  child.kill();
  await sleep(200);
}
