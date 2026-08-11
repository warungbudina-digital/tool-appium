// repro-segments.js — Orchestrator rangkai multi-segmen (jump-cut + zoom + Adjust)
// berpandu-data untuk pipa viral_analyzer → ir_to_vn.py → VN.
//
// Memperbaiki AKAR kerapuhan lama (vn-map §23f): TAK ada verify/recover antar
// segmen. Di sini SETIAP langkah diverifikasi via `current_textView` dan tiap
// panel ditutup lewat ivDone (JANGAN BACK — bisa keluar editor). Satu SESI wdio
// dipakai untuk semua segmen supaya state seleksi persist (§23d).
//
// Input via env:
//   SPLITS  = "20,40"                (detik; titik split -> N+1 segmen). Opsional.
//   PLAN    = JSON [{t,zoom,adj:{type,dir}}...]  (t=detik midpoint segmen,
//             zoom="in"|"out"|null, adj={type:"KECERAHAN"|"KONTRAS"|"SUHU",dir:"up"|"down"}|null)
// Jalankan:
//   docker compose exec -T -e ANDROID_UDID=10.66.66.2:<port> -e APP_PACKAGE=com.frontrow.vlog \
//     -e FORCE_APP_LAUNCH=false -e SPLITS="20,40" -e PLAN='[...]' \
//     appium npx wdio run ./wdio.conf.js --spec tests/repro-segments.js

const PKG = "com.frontrow.vlog";
const rid = (s) => `com.frontrow.vlog:id/${s}`;
const byId = (s) => $(`android=new UiSelector().resourceId("${rid(s)}")`);
const byDesc = (s) => $(`android=new UiSelector().description("${s}")`);
const byText = (t) => $(`android=new UiSelector().text("${t}")`);

// Koordinat terverifikasi. Profil per-device (lebar 1080 identik, beda TINGGI ->
// mayoritas Y bergeser; X mostly sama). Pilih via env DEVICE (default infinix).
// ⚠️ VN build MOD UI BAHASA INGGRIS: jenis Adjust = EXPOSURE/CONTRAST/BRIGHTNESS/
// SATURATION/VIBRANCE/TEMPERATURE (native filterTextView).
const PROFILES = {
  infinix: {                  // 1080x2408 (vn-map §23b/c/e)
    split:      [536, 2156],
    filter:     [48, 2156],
    selectClip: [540, 1832],
    zoomIn:     [528, 2074],
    zoomOut:    [336, 2074],
    panelDone:  [891, 2174],
    adjustTab:  [677, 1448],
    sliderY:    1799,
    seekY:      1832,
    pxPerSec:   158,
    transitionX:[186, 2166],
    adj: { EXPOSURE: [540, 1467], CONTRAST: [738, 1467], BRIGHTNESS: [936, 1467], SATURATION: [1067, 1467] },
  },
  rn7: {                      // 1080x2340 crDroid A14 (vn-map §26)
    split:      [535, 2182],
    filter:     [79, 2182],
    selectClip: [540, 1890],
    zoomIn:     [462, 2111],
    zoomOut:    [294, 2111],
    panelDone:  [914, 2198],
    adjustTab:  [662, 1562],
    sliderY:    1869,
    seekY:      1890,
    pxPerSec:   120,
    transitionX:[164, 2196],
    adj: { EXPOSURE: [540, 1580], CONTRAST: [713, 1580], BRIGHTNESS: [886, 1580], SATURATION: [1034, 1580] },
  },
};
const C = PROFILES[process.env.DEVICE || "infinix"];
if (!C) throw new Error(`DEVICE '${process.env.DEVICE}' tak dikenal (pakai: ${Object.keys(PROFILES)})`);

const PX_PER_SEC = C.pxPerSec;   // kalibrasi seek per-device (Infinix 158, RN7 120)
const SEEK_TOL = 0.18;        // toleransi konvergensi (detik)

async function tap([x, y], settle = 350) {
  await browser.action("pointer")
    .move({ x, y }).down().pause(60).up().perform();
  await browser.pause(settle);
}
async function swipeX(x1, x2, y, dur = 380) {
  await browser.action("pointer")
    .move({ x: x1, y }).down().pause(30)
    .move({ duration: dur, x: x2, y }).pause(40).up().perform();
  await browser.pause(300);
}

// Dua format: Infinix "M:SS.dd" (ada ':') vs RN7 MOD "SS.dd" (desimal detik, tanpa ':').
const parseT = (s) => {
  s = (s || "").trim();
  let m = s.match(/(\d+):(\d+)\.(\d+)/);          // M:SS.dd
  if (m) return (+m[1]) * 60 + (+m[2]) + (+m[3]) / 100;
  m = s.match(/^(\d+)\.(\d+)$/);                   // SS.dd (detik desimal)
  if (m) return (+m[1]) + (+m[2]) / 100;
  const f = parseFloat(s);
  return isNaN(f) ? null : f;
};
async function inEditor() { try { return await byId("current_textView").isExisting(); } catch { return false; } }
async function playhead() { try { return parseT(await byId("current_textView").getText()); } catch { return null; } }
async function total() { try { return parseT(await byId("total_textView").getText()); } catch { return null; } }

// Panel transisi (Base/Effect) terbuka bila tap kena batas antar-klip (§23f).
// Ditutup lewat X @186,2166 (cancel, JANGAN apply).
async function dismissTransition() {
  if (await byId("tvNormalTransition").isExisting().catch(() => false)) {
    await tap(C.transitionX, 600); return true;
  }
  return false;
}

// RECOVERY: pastikan kembali ke editor bersih (current_textView terlihat).
async function ensureEditor(tag) {
  for (let i = 0; i < 4; i++) {
    if (await inEditor()) return true;
    if (await dismissTransition()) { if (await inEditor()) return true; }
    // panel lain -> tutup via ivDone; kalau bukan panel, keyevent BACK 1x
    await tap(C.panelDone, 500).catch(() => {});
    if (await inEditor()) return true;
    await browser.pressKeyCode(4); await browser.pause(500); // BACK (deselect / tutup)
  }
  const ok = await inEditor();
  if (!ok) throw new Error(`ensureEditor GAGAL @${tag} — tak kembali ke editor`);
  return ok;
}

// SEEK: loop baca playhead -> swipe track proporsional -> konvergen.
// Deteksi MACET (swipe tak menggeser playhead) -> kemungkinan sheet "Insert"/panel
// menutupi timeline (RN7 §26d) -> tutup lalu lanjut.
async function seekTo(target) {
  let last = null, stuck = 0;
  for (let i = 0; i < 26; i++) {
    const cur = await playhead();
    if (cur == null) { await ensureEditor("seek"); last = null; continue; }
    const err = target - cur;                 // + = perlu maju
    if (Math.abs(err) <= SEEK_TOL) return cur;
    if (last != null && Math.abs(cur - last) < 0.03) {
      if (++stuck >= 2) {                      // swipe tak berefek -> ada yg menutupi
        if (await byText("Insert").isExisting().catch(() => false)) await browser.pressKeyCode(4);
        else if (!(await dismissTransition())) await tap(C.panelDone, 400).catch(() => {});
        await browser.pause(400); stuck = 0; last = null; continue;
      }
    } else stuck = 0;
    last = cur;
    const dx = Math.max(40, Math.min(700, Math.abs(err) * PX_PER_SEC));
    // maju (err>0): geser track KE KIRI (x turun). mundur: ke kanan.
    const xC = 640;
    if (err > 0) await swipeX(xC + dx / 2, xC - dx / 2, C.seekY);
    else         await swipeX(xC - dx / 2, xC + dx / 2, C.seekY);
  }
  return await playhead();
}

// Klip terpilih? Indikator = strip aksi klip. Infinix pakai ivDuplicate; RN7 MOD
// strip klip video = flKeyframeCurve/flLock. Terima salah satu (robust lintas-build).
async function clipSelected() {
  for (const id of ["ivDuplicate", "flKeyframeCurve", "flLock"]) {
    if (await byId(id).isExisting().catch(() => false)) return true;
  }
  return false;
}

// Pilih klip DI BAWAH PLAYHEAD. Timeline multi-klip: byId("timeline_item") = match
// PERTAMA (klip-1), SALAH utk klip2/3. Pilih item yg bounds-x memuat posisi playhead
// (x = C.selectClip[0] ≈ garis playhead). Fallback: koord playhead (bisa nyasar ke
// track-add -> ditangani di selectClip). §26 RN7.
async function tapClip() {
  const px = C.selectClip[0];
  const items = await $$(`android=new UiSelector().resourceId("${rid("timeline_item")}")`);
  for (const it of items) {
    try {
      const l = await it.getLocation(); const s = await it.getSize();
      if (l.x <= px && px <= l.x + s.width) { await it.click(); await browser.pause(600); return; }
    } catch { /* stale -> next */ }
  }
  await tap(C.selectClip, 600);
}

// PILIH klip di bawah playhead; verifikasi via strip aksi klip.
async function selectClip() {
  // deselect dulu supaya tap memilih klip DI BAWAH PLAYHEAD (bukan sisa seleksi
  // segmen sebelumnya). BACK 1x saat ada seleksi = deselect (§23d).
  if (await clipSelected()) { await browser.pressKeyCode(4); await browser.pause(400); }
  for (let attempt = 0; attempt < 3; attempt++) {
    await tapClip();
    if (await clipSelected()) return true;
    // tap nyasar -> sheet "Insert" (Music/Effect/Record) / panel transisi / popup -> tutup
    if (await byText("Insert").isExisting().catch(() => false)) { await browser.pressKeyCode(4); await browser.pause(400); }
    else if (await dismissTransition()) { /* dismissed */ }
    else if (await byText("Di dalam").isExisting().catch(() => false)) { await browser.pressKeyCode(4); await browser.pause(400); }
    await ensureEditor("selectClip");
  }
  return await clipSelected();
}

// Pastikan klip masih terpilih (panel clipZoom/Adjust bisa men-deselect saat ditutup).
async function ensureSelected() {
  if (await clipSelected()) return true;
  await tapClip();
  return await clipSelected();
}

async function applyZoom(dir) {
  // toolbar 21-tool: scrollIntoView clipZoom (andal, §23d)
  const zoom = $(`android=new UiScrollable(new UiSelector().scrollable(true)).setAsHorizontalList().scrollIntoView(new UiSelector().description("editor_toolbar_clipZoom"))`);
  await zoom.waitForExist({ timeout: 8000 });
  await zoom.click(); await browser.pause(1200);
  await tap(dir === "in" ? C.zoomIn : C.zoomOut, 600);
  await tap(C.panelDone, 700);
  await ensureEditor("postZoom");
}

// Jenis Adjust by KOORDINAT (filterTextView native tak kena .text() — labelnya
// content-desc; posisi stabil saat panel dibuka fresh, y1467). Panel fresh = urutan
// default EXPOSURE·CONTRAST·BRIGHTNESS·SATURATION (kiri→kanan). TEMPERATURE off-screen.
const ADJ_XY = C.adj;
async function applyAdjust(type, dir) {
  await tap(C.filter, 900);                    // editor_toolbar_filter
  await byId("tvFilterManual").waitForExist({ timeout: 6000 }).catch(() => {});
  await tap(C.adjustTab, 800);                 // tab "Adjust"
  const xy = ADJ_XY[type];
  if (!xy) throw new Error(`jenis Adjust '${type}' tak dipetakan (pakai ${Object.keys(ADJ_XY)})`);
  await tap(xy, 700);                          // pilih jenis by koordinat
  // ruler filterValueRulerView: swipe DI DALAM bounds ELEMEN (bukan y hardcoded).
  // AKAR trim-bug (2026-08-11): kalau panel Adjust gagal buka, swipe di y1869 nyasar
  // ke TIMELINE (y~1890) → geser trim-handle → klip terpangkas. Guard: ruler absen =
  // batal (jangan swipe destruktif). swipe KIRI=naik, KANAN=turun.
  const ruler = byId("filterValueRulerView");
  if (!(await ruler.isExisting().catch(() => false)))
    throw new Error("ruler Adjust (filterValueRulerView) absen — panel tak terbuka; batal swipe (cegah trim timeline)");
  const rl = await ruler.getLocation(); const rs = await ruler.getSize();
  const ry = Math.round(rl.y + rs.height / 2);
  const xL = Math.round(rl.x + rs.width * 0.30), xR = Math.round(rl.x + rs.width * 0.70);
  if (dir === "up") await swipeX(xR, xL, ry);
  else              await swipeX(xL, xR, ry);
  await tap(C.panelDone, 700);                 // ivDone
  await ensureEditor("postAdjust");
}

describe("Repro multi-segmen (jump-cut + zoom + Adjust)", () => {
  it("terapkan plan per-segmen dengan verifikasi tiap langkah", async function () {
    this.timeout(600000); // ~50s/segmen; beri ruang utk banyak segmen
    await browser.updateSettings({ waitForIdleTimeout: 100, allowInvisibleElements: true });
    await ensureEditor("start");
    const dur = await total();
    console.log(`[repro] editor OK, total=${dur}s`);

    const splits = (process.env.SPLITS || "").split(",").map(s => parseFloat(s.trim())).filter(x => x > 0);
    const plan = JSON.parse(process.env.PLAN || "[]");

    // FASE A: split -> bentuk segmen
    for (const st of splits) {
      await ensureEditor("preSplit");
      const got = await seekTo(st);
      await tap(C.split, 600);
      console.log(`[repro] split @${st}s (playhead=${got})`);
    }

    // FASE B: per-segmen seek -> select -> zoom -> adjust
    let okCount = 0;
    for (let i = 0; i < plan.length; i++) {
      const seg = plan[i];
      try {
        await ensureEditor(`seg${i}-pre`);
        const got = await seekTo(seg.t);
        const sel = await selectClip();
        if (!sel) throw new Error(`gagal pilih klip @${seg.t}s`);
        console.log(`[repro] seg${i} @${seg.t}s (playhead=${got}) selected`);
        if (seg.zoom) { await applyZoom(seg.zoom); await ensureSelected(); console.log(`[repro]   zoom ${seg.zoom} OK`); }
        if (seg.adj)  { await ensureSelected(); await applyAdjust(seg.adj.type, seg.adj.dir); console.log(`[repro]   adjust ${seg.adj.type} ${seg.adj.dir} OK`); }
        // deselect utk segmen berikut — BACK 1x HANYA bila masih terpilih
        // (kalau sudah ter-deselect, BACK malah KELUAR editor, §23f)
        if (await clipSelected()) { await browser.pressKeyCode(4); await browser.pause(500); }
        await ensureEditor(`seg${i}-post`);
        okCount++;
      } catch (e) {
        console.log(`[repro] seg${i} GAGAL: ${e.message} -> recover & lanjut`);
        await ensureEditor(`seg${i}-recover`);
      }
    }
    console.log(`[repro] SELESAI: ${okCount}/${plan.length} segmen sukses`);
    // biarkan proyek terbuka utk verifikasi screencap dari luar
  });
});
