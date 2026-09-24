// Grabador de demos: Chrome sin ventana + cursor dibujado + screencast CDP -> MP4.
const { chromium } = require("playwright-core");
const ffmpeg = require("ffmpeg-static");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";


// Cursor falso: los navegadores sin ventana no dibujan el raton.
const CURSOR = `
(() => {
  if (window.top !== window) return;
  const poner = () => {
    if (document.getElementById("__cursor")) return;
    const c = document.createElement("div");
    c.id = "__cursor";
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.5-3.5 7z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {position:"fixed",left:"0",top:"0",zIndex:2147483647,pointerEvents:"none",
      transform:"translate(" + (window.__cx||640) + "px," + (window.__cy||360) + "px)", filter:"drop-shadow(0 2px 3px rgba(0,0,0,.35))"});
    document.documentElement.appendChild(c);
  };
  document.addEventListener("DOMContentLoaded", poner); if (document.readyState !== "loading") poner();
  addEventListener("mousemove", e => { window.__cx=e.clientX; window.__cy=e.clientY;
    const c=document.getElementById("__cursor"); if(c) c.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)";
    try { sessionStorage.setItem("__cxy", e.clientX+","+e.clientY); } catch {} }, true);
  try { const v=(sessionStorage.getItem("__cxy")||"").split(","); if(v.length==2){window.__cx=+v[0];window.__cy=+v[1];} } catch {}
  addEventListener("mousedown", e => {
    const r=document.createElement("div");
    Object.assign(r.style,{position:"fixed",left:(e.clientX-18)+"px",top:(e.clientY-18)+"px",width:"36px",height:"36px",
      borderRadius:"50%",background:"rgba(59,130,246,.35)",zIndex:2147483646,pointerEvents:"none",transition:"transform .45s ease, opacity .45s ease"});
    document.documentElement.appendChild(r);
    requestAnimationFrame(()=>{ r.style.transform="scale(1.9)"; r.style.opacity="0"; });
    setTimeout(()=>r.remove(),600);
  }, true);
})();`;

const TARJETA = html => `<!doctype html><html><head><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel=stylesheet><style>
body{margin:0;height:100vh;display:grid;place-items:center;font-family:Inter,sans-serif;color:#f8fafc;background:radial-gradient(circle at 30% 20%,#1e3a8a,#0f172a 60%);overflow:hidden}
.c{text-align:center;animation:e .8s ease both}@keyframes e{from{opacity:0;transform:translateY(14px)}}
small{display:inline-block;padding:.35rem .9rem;border-radius:99px;background:rgba(255,255,255,.12);font-size:14px;letter-spacing:.04em}
h1{font-size:58px;margin:.9rem 0 .4rem;font-weight:800}p{font-size:20px;color:#cbd5e1;margin:0 0 1.6rem}
.t{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap}.t span{padding:.3rem .8rem;border:1px solid #3b82f6;border-radius:8px;color:#93c5fd;font-size:15px}
#__cursor{display:none!important}
</style></head><body><div class=c>${html}</div></body></html>`;

function servidorEstatico(raiz, puerto) {
  raiz = path.resolve(raiz);
  const tipos = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml",
    ".png":"image/png", ".jpg":"image/jpeg", ".json":"application/json", ".webp":"image/webp", ".ico":"image/x-icon" };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(raiz, p);
    if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": tipos[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(puerto, () => r(srv)));
}

async function grabar(nombre, salidaDir, guion, { W = 1024, H = 576 } = {}) {
  const ESCALA = 1920 / W;
  const tmp = path.join(__dirname, "frames-" + nombre);
  fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars", "--lang=es-ES"] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: ESCALA, locale: "es-ES" });
  await ctx.addInitScript(CURSOR);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  let grabando = false;
  cdp.on("Page.screencastFrame", async f => {
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
    if (!grabando) return;
    const n = path.join(tmp, String(frames.length).padStart(5, "0") + ".jpg");
    fs.writeFileSync(n, Buffer.from(f.data, "base64"));
    frames.push({ n, t: f.metadata.timestamp });
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * ESCALA, maxHeight: H * ESCALA, everyNthFrame: 1 });

  // Utilidades del guion
  let cx = W / 2, cy = H / 2;
  const u = {
    page,
    espera: ms => page.waitForTimeout(ms),
    empezar: () => { grabando = true; },
    // Corta del video lo que pase entre pausar() y seguir() (esperas de carga).
    pausar: () => { grabando = false; if (frames.length) frames[frames.length - 1].corte = true; },
    seguir: () => { grabando = true; },
    async mover(loc, opts = {}) {
      const el = typeof loc === "string" ? page.locator(loc).first() : loc;
      await el.scrollIntoViewIfNeeded().catch(() => {});
      const b = await el.boundingBox();
      const x = b.x + b.width * (opts.fx ?? .5), y = b.y + b.height * (opts.fy ?? .5);
      const d = Math.hypot(x - cx, y - cy);
      await page.mouse.move(x, y, { steps: Math.max(12, Math.round(d / 14)) });
      cx = x; cy = y;
      await page.waitForTimeout(opts.pausa ?? 250);
    },
    async clic(loc, opts = {}) { await u.mover(loc, opts); await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up(); await page.waitForTimeout(opts.despues ?? 500); },
    async escribir(texto, retardo = 70) { await page.keyboard.type(texto, { delay: retardo }); },
    async tarjeta(html, ms) {
      await page.setContent(TARJETA(html));
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(ms);
    },
    async scroll(dy, pasos = 40) { for (let i = 0; i < pasos; i++) { await page.mouse.wheel(0, dy / pasos); await page.waitForTimeout(16); } await page.waitForTimeout(350); },
  };

  // El frame fijo inicial evita un video que arranca en blanco.
  try { await guion(u); }
  catch (e) {
    await page.screenshot({ path: path.join(__dirname, "error-" + nombre + ".png") }).catch(() => {});
    throw e;
  }
  finally {
    await page.waitForTimeout(600);
    grabando = false;
    await cdp.send("Page.stopScreencast").catch(() => {});
    await browser.close();
  }

  // El screencast solo emite frames cuando algo cambia: la duracion de cada
  // frame es el tiempo hasta el siguiente.
  const lista = [];
  for (let i = 0; i < frames.length; i++) {
    const dur = frames[i].corte ? 0.25 : i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 1.2;
    lista.push(`file '${frames[i].n.replace(/\\/g, "/")}'`, `duration ${Math.max(dur, 0.001).toFixed(4)}`);
  }
  lista.push(`file '${frames[frames.length - 1].n.replace(/\\/g, "/")}'`);
  const listaF = path.join(tmp, "lista.txt");
  fs.writeFileSync(listaF, lista.join("\n"));
  fs.mkdirSync(salidaDir, { recursive: true });
  const mp4 = path.join(salidaDir, nombre + ".mp4");
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listaF,
    "-vf", "scale=1280:720:flags=lanczos,fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
    "-profile:v", "high", "-movflags", "+faststart", "-an", mp4]);
  console.log(nombre, "frames:", frames.length, "->", mp4, (fs.statSync(mp4).size / 1e6).toFixed(2) + " MB");
  return mp4;
}

module.exports = { grabar, servidorEstatico };
