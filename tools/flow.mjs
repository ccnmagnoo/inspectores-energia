// Recorrido automático de un nivel para QA: inspecciona, decide, completa y captura.
// Uso: node tools/flow.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9334;
const PROFILE = 'C:\\Users\\crcam\\AppData\\Local\\Temp\\opencode\\edge-flow';
const URL = 'http://127.0.0.1:5173/?level=home&play=1';
const VW = Number(process.argv[2] ?? 1440);
const VH = Number(process.argv[3] ?? 900);

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
    `--window-size=${VW},${VH}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let nextId = 1;
const pending = new Map();
const logs = [];

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
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''));
  return r.result.value;
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`D:\\Dev\\vive-energia\\${name}`, Buffer.from(r.data, 'base64'));
  console.log(`  → ${name}`);
}

const plan = [
  ['home-lamp', 'waste'],
  ['home-nook', 'ok'],
  ['home-tv', 'waste'],
  ['home-charger', 'waste'],
  ['home-fridge', 'waste'],
  ['home-ac', 'waste'],
  ['home-coffee', 'ok'],
  ['home-iron', 'waste'],
];

try {
  let ready = false;
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      /* esperando */
    }
    await sleep(150);
  }
  if (!ready) throw new Error('DevTools no respondió');

  const targetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL)}`, {
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
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      logs.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push(`EXCEPCIÓN: ${msg.params.exceptionDetails.text}`);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: VW,
    height: VH,
    deviceScaleFactor: 1,
    mobile: VW < 760,
  });
  await send('Page.navigate', { url: URL });
  await sleep(4200);

  console.log('estado inicial:');
  console.log(
    await evaluate(`JSON.stringify({
      pantalla: [...document.querySelectorAll('.screen')].find(s => s.classList.contains('is-active'))?.id,
      hud: document.querySelector('#hud-found')?.textContent,
      objetos: document.querySelectorAll('#a11y-list button').length,
    })`),
  );

  // Inspeccionar el primer objeto y capturar la tarjeta.
  await evaluate(`document.querySelector('#a11y-list button[data-finding="home-lamp"]').click()`);
  await sleep(700);
  await shot('qa-inspect.png');

  // Decidir mal a propósito una vez para ver el error.
  await evaluate(`document.querySelector('[data-decide="ok"]').click()`);
  await sleep(900);
  await shot('qa-wrong.png');

  console.log('tras un error:');
  console.log(
    await evaluate(
      `JSON.stringify({ hud: document.querySelector('#hud-found').textContent, puntos: document.querySelector('#hud-points').textContent })`,
    ),
  );

  for (const [id, answer] of plan) {
    const ok = await evaluate(`(() => {
      const b = document.querySelector('#a11y-list button[data-finding="${id}"]');
      if (!b) return false;
      b.click();
      return true;
    })()`);
    if (!ok) {
      console.log(`  !! no encontré ${id}`);
      continue;
    }
    await sleep(320);
    await evaluate(`document.querySelector('[data-decide="${answer}"]').click()`);
    await sleep(420);
    const state = await evaluate(
      `JSON.stringify({ encontradas: document.querySelector('#hud-found').textContent, puntos: document.querySelector('#hud-points').textContent, ahorro: document.querySelector('#hud-pct').textContent })`,
    );
    console.log(`  ${id} (${answer}) → ${state}`);
  }

  await sleep(3000);
  await shot('qa-summary.png');

  console.log('estado final:');
  console.log(
    await evaluate(`JSON.stringify({
      pantalla: [...document.querySelectorAll('.screen')].find(s => s.classList.contains('is-active'))?.id,
      estrellas: document.querySelectorAll('#summary-card .big-stars span').length,
      guardado: localStorage.getItem('detectives-energia:v1'),
    })`),
  );
} finally {
  try {
    if (ws) ws.close();
  } catch {
    /* nada */
  }
  child.kill();
  await sleep(200);
  if (logs.length) console.log('errores de consola:\n' + logs.join('\n'));
  else console.log('sin errores de consola');
}
