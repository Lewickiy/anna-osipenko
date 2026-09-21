/* Проверка вёрстки в headless Chromium (без внешних зависимостей, через CDP).
   Запуск: node test-browser.js  (сервер уже должен работать на :8765) */
"use strict";

const CHROME = "/home/lewickiy/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const SITE = "http://127.0.0.1:8765/index.html";
const { spawn } = require("child_process");

if (typeof WebSocket === "undefined") {
  /* Node 20 без глобального WebSocket — берём пакет ws из NODE_PATH */
  global.WebSocket = require("ws");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
      } else if (msg.method) {
        (this.listeners.get(msg.method) || []).forEach((cb) => cb(msg));
      }
    };
  }
  ready() {
    return new Promise((res, rej) => {
      if (this.ws.readyState === 1) return res();
      this.ws.onopen = res;
      this.ws.onerror = () => rej(new Error("WS error"));
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    });
  }
  on(method, cb) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(cb);
  }
}

/* JS, выполняемый в странице: снимает все метрики и проверяет аккордеон */
const PAGE_CHECK = `
(async () => {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const name = document.getElementById('sideName');
  const side = document.getElementById('side');
  const board = document.querySelector('.board');
  const first = document.querySelector('.acc-item');
  const second = document.querySelector('.acc-item:nth-child(2)');
  const nr = name.getBoundingClientRect();
  const sr = side.getBoundingClientRect();
  const br = board.getBoundingClientRect();
  const fr = first.getBoundingClientRect();
  const cs = getComputedStyle(name);
  const res = {
    fontSize: parseFloat(cs.fontSize),
    writingMode: cs.writingMode,
    name: { top: nr.top, bottom: nr.bottom, height: nr.height, width: nr.width, left: nr.left, right: nr.right },
    side: { top: sr.top, bottom: sr.bottom, height: sr.height, width: sr.width, right: sr.right, bottomEdge: sr.bottom },
    boardLeft: br.left,
    boardWidth: br.width,
    boardTop: br.top,
    firstWidth: fr.width,
    fitsHorizontally: nr.left >= sr.left - 1.5 && nr.right <= sr.right + 1.5,
    fitsVertically: nr.top >= sr.top - 1.5 && nr.bottom <= sr.bottom + 1.5,
    clipped: nr.width > sr.width + 1 || nr.height > sr.height + 1,
    headerOnTop: sr.bottom <= br.top + 0.5,
    noOverlap: sr.bottom <= br.top + 0.5,
    accordionBelowHeader: br.top >= sr.bottom - 0.5,
    headerGap: br.top - sr.bottom,
    gapEqualsHeader: Math.abs((br.top - sr.bottom) - sr.height) < 2,
    containerMax: sr.width <= 902,
    centered: Math.abs(sr.left - (window.innerWidth - sr.width) / 2) < 2,
    accordionFullWidth: Math.abs(br.width - fr.width) < 2,
    sideThin: sr.height < window.innerHeight * 0.14,
  };
  /* открываем второй блок и проверяем раскрытие */
  second.querySelector('.acc-btn').click();
  await new Promise(r => setTimeout(r, 800));
  const body2 = second.querySelector('.acc-body');
  const open = second.classList.contains('is-open');
  res.accordion = {
    openedByClick: open,
    ariaExpanded: second.querySelector('.acc-btn').getAttribute('aria-expanded'),
    bodyClipped: Math.max(0, body2.scrollHeight - body2.clientHeight),
    boardScrollable: board.scrollHeight > board.clientHeight,
  };
  /* повторный клик закрывает */
  second.querySelector('.acc-btn').click();
  await new Promise(r => setTimeout(r, 800));
  res.accordion.closedBySecondClick = !second.classList.contains('is-open');
  return res;
})()
`;

async function measure(cdp, w, h) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const S = (m, p) => cdp.send(m, p, sessionId);
  await S("Page.enable");
  await S("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await S("Page.navigate", { url: SITE });
  let loaded = false;
  for (let i = 0; i < 60; i++) {
    await sleep(150);
    const rs = await S("Runtime.evaluate", { expression: "!!document.getElementById('sideName')" }).catch(() => null);
    if (rs && rs.result && rs.result.value === true) { loaded = true; break; }
  }
  if (!loaded) {
    const dbg = await S("Runtime.evaluate", { expression: "location.href + ' | ready=' + document.readyState + ' | ' + document.title" }).catch((e) => ({ error: e.message }));
    throw new Error("sideName не появился. Состояние страницы: " + JSON.stringify(dbg));
  }
  await sleep(300);
  const out = await S("Runtime.evaluate", { expression: PAGE_CHECK, awaitPromise: true, returnByValue: true });
  await cdp.send("Target.closeTarget", { targetId });
  if (out.exceptionDetails) throw new Error("page eval: " + JSON.stringify(out.exceptionDetails.exception));
  return out.result.value;
}

(async () => {
  console.log("node", process.version);
  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu",
    "--remote-debugging-port=9777", "--window-size=1440,900", "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe"] });

  const wsUrl = await new Promise((res, rej) => {
    let buf = "";
    proc.stderr.on("data", (d) => {
      buf += d;
      const m = buf.match(/ws:\/\/[^\s]+/);
      if (m) res(m[0]);
    });
    setTimeout(() => rej(new Error("DevTools endpoint not found:\n" + buf)), 15000);
  });
  console.log("devtools:", wsUrl);

  const cdp = new CDP(wsUrl);
  await cdp.ready();
  await sleep(300);

  const cases = [
    [1440, 700], [1440, 900], [1440, 1080], [1440, 1300],
    [1280, 800], [1920, 1080],
    [1024, 768], [768, 1024], [390, 844], [390, 700],
  ];

  let allOk = true;
  for (const [w, h] of cases) {
    const r = await measure(cdp, w, h);
    const problems = [];
    /* шапка горизонтальная сверху на всех экранах — проверки единые */
    {
      if (r.writingMode === "vertical-rl") problems.push("надпись всё ещё вертикальная");
      if (!r.fitsHorizontally) problems.push("надпись не от края до края шапки");
      if (!r.fitsVertically) problems.push("надпись вылезает по высоте шапки");
      if (r.clipped) problems.push("надпись обрезана");
      if (!r.noOverlap) problems.push("шапка перекрывает аккордеон");
      if (!r.accordionBelowHeader) problems.push("аккордеон выше шапки");
      if (!r.gapEqualsHeader) problems.push("отступ шапка↔аккордеон не равен высоте шапки (" + (r.headerGap || 0).toFixed(0) + "px против " + r.side.height.toFixed(0) + "px)");
      if (!r.containerMax) problems.push("контейнер шире 900px: " + r.side.width.toFixed(0));
      if (!r.centered) problems.push("контейнер не по центру");
      if (!r.sideThin) problems.push("шапка выше 14% экрана");
    }
    if (!r.accordion.openedByClick) problems.push("клик не открывает блок");
    if (!r.accordion.ariaExpanded_ok !== false && r.accordion.ariaExpanded !== "true") problems.push("aria-expanded не обновился");
    if (!r.accordion.closedBySecondClick) problems.push("повторный клик не закрывает");
    if (r.accordion.bodyClipped > 2) problems.push(`контент блока обрезан на ${r.accordion.bodyClipped}px`);
    if (problems.length) allOk = false;

    console.log(
      `\n=== ${w}x${h} — ${problems.length ? "ПРОБЛЕМЫ: " + problems.join("; ") : "OK"}`
    );
    console.log(
      `  кегль ${r.fontSize}px, mode ${r.writingMode} | надпись: left=${r.name.left.toFixed(0)} right=${r.name.right.toFixed(0)} (шапка ${r.side.width.toFixed(0)}x${r.side.height.toFixed(0)})` +
      ` | шапка top=${r.side.top.toFixed(0)} bottom=${r.side.bottomEdge.toFixed(0)} | аккордеон top=${r.boardTop.toFixed(0)} w=${r.boardWidth.toFixed(0)}` +
      ` | аккордеон: open=${r.accordion.openedByClick} close=${r.accordion.closedBySecondClick} clip=${r.accordion.bodyClipped}px`
    );
  }

  console.log(allOk ? "\nИТОГ: все проверки пройдены ✅" : "\nИТОГ: есть проблемы ❌");
  proc.kill("SIGKILL");
  process.exit(allOk ? 0 : 1);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(2); });
