// Captura de pantalla fiable vía Chrome DevTools Protocol.
// Uso: node tools/shot.mjs <url> <salida.png> [ancho] [alto] [esperaMs]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9333;
const PROFILE = 'C:\\Users\\crcam\\AppData\\Local\\Temp\\opencode\\edge-cdp';

const url = process.argv[2] ?? 'http://127.0.0.1:5173/';
const out = resolve(process.argv[3] ?? 'shot.png');
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
const waitMs = Number(process.argv[6] ?? 3500);

mkdirSync(PROFILE, { recursive: true });
mkdirSync(dirname(out), { recursive: true });

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
    '--disable-background-timer-throttling',
    `--window-size=${width},${height}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDevtools() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      /* todavía no está listo */
    }
    await sleep(150);
  }
  throw new Error('DevTools no respondió');
}

let ws;
let nextId = 1;
const pending = new Map();
const logs = [];

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve2, reject) => {
    pending.set(id, { resolve: resolve2, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`Timeout: ${method}`));
      }
    }, 30000);
  });
}

try {
  await waitForDevtools();

  const targetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
  });
  const target = await targetRes.json();

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else res(msg.result);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(`[${msg.params.type}] ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push(`[exception] ${msg.params.exceptionDetails.text}`);
    }
    if (msg.method === 'Log.entryAdded') {
      logs.push(`[${msg.params.entry.level}] ${msg.params.entry.text}`);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url });
  await sleep(waitMs);

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));

  const fonts = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector('.pill, .brand h1, body');
      if (!el) return 'sin elemento';
      return getComputedStyle(el).fontFamily;
    })()`,
    returnByValue: true,
  });

  console.log(`OK ${out}`);
  console.log(`font-family: ${fonts.result.value}`);
  if (logs.length) console.log('consola:\n' + logs.join('\n'));
} finally {
  try {
    if (ws) ws.close();
  } catch {
    /* nada */
  }
  child.kill();
  await sleep(200);
}
