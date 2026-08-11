// import-clips.js — impor multi-klip dari album VN ke proyek baru, URUT fase.
//
// Menutup celah pipeline: deliver_footage kirim klip TERURUT (01_,02_,..) ke folder
// /sdcard/DCIM/VN-src (album "VN-src" di picker). VN picker meng-grid date-added
// DESC (klip terbaru dulu) -> kebalikan urutan delivery/fase. Urutan SELEKSI (tap)
// = urutan timeline VN. Maka: filter album VN-src, lalu tap check_view TERBALIK
// (elemen terakhir->pertama) supaya seleksi 1..N = urutan fase.
//
// Env:
//   DEVICE   = rn7 | infinix (default rn7 di sini; koordinat nav)
//   ALBUM    = nama album (default "VN-src")
//   NCLIPS   = jumlah klip (default: semua di album)
//   REVERSE  = "1" (default; set "0" kalau grid ASC)
// Jalankan (FORCE_APP_LAUNCH=true supaya mulai bersih dari MainActivity):
//   docker compose exec -T -e ANDROID_UDID=10.66.66.6:<port> -e APP_PACKAGE=com.frontrow.vlog \
//     -e FORCE_APP_LAUNCH=true -e DEVICE=rn7 -e ALBUM=VN-src \
//     appium npx wdio run ./wdio.conf.js --spec tests/import-clips.js

const PKG = "com.frontrow.vlog";
const rid = (s) => `com.frontrow.vlog:id/${s}`;
const byId = (s) => $(`android=new UiSelector().resourceId("${rid(s)}")`);
const byText = (t) => $(`android=new UiSelector().text("${t}")`);
const allById = (s) => $$(`android=new UiSelector().resourceId("${rid(s)}")`);

// Koordinat nav per-device (fallback bila selektor teks tak ketemu). Lebar 1080 sama.
const NAV = {
  rn7:     { fab: [927, 2045], newVideo: [539, 486], save: [539, 2040], albumTog: [180, 312] },
  infinix: { fab: [946, 2103], newVideo: [540, 500], save: [540, 2032], albumTog: [180, 320] },
};
const C = NAV[process.env.DEVICE || "rn7"];
const ALBUM = process.env.ALBUM || "VN-src";
const NCLIPS = parseInt(process.env.NCLIPS || "0", 10);
const REVERSE = (process.env.REVERSE || "1") !== "0";

async function tap([x, y], settle = 500) {
  await browser.action("pointer").move({ x, y }).down().pause(60).up().perform();
  await browser.pause(settle);
}
async function exists(el, ms = 1500) {
  try { return await el.waitForExist({ timeout: ms }); } catch { return false; }
}
async function tapTextOr(t, coord, settle = 900) {
  const el = byText(t);
  if (await exists(el, 1500)) { await el.click(); await browser.pause(settle); return "text"; }
  await tap(coord, settle); return "coord";
}
async function dismissCoach() {
  for (const t of ["Got it", "OK", "I know", "Mengerti"]) {
    const e = byText(t);
    if (await exists(e, 600)) { try { await e.click(); await browser.pause(300); } catch {} }
  }
}

describe("VN import multi-clip (urut fase)", () => {
  it("impor N klip dari album ke editor", async () => {
    await browser.updateSettings({ waitForIdleTimeout: 120, enforceXPath1: true, allowInvisibleElements: true });
    await browser.pause(1500);

    // 1) MainActivity -> CreationActivity (FAB) -> "New Video"
    if (!(await exists(byText("New Video"), 1500))) { await tap(C.fab, 1200); }
    await tapTextOr("New Video", C.newVideo, 1500);

    // 2) dialog "Project Edit Mode" -> Save (kalau muncul; bisa di-skip 'do not ask again')
    if (await exists(byText("Project Edit Mode"), 1500) || await exists(byText("Save"), 1000)) {
      await tapTextOr("Save", C.save, 1500);
    }
    await browser.pause(1200);
    await dismissCoach();

    // 3) picker terbuka -> pilih album ALBUM
    const nextBtn = byId("material_next");
    if (!(await exists(nextBtn, 4000))) throw new Error("picker tak terbuka (material_next absen)");
    await tap(C.albumTog, 900);                       // buka dropdown album
    const alb = byText(ALBUM);
    if (!(await exists(alb, 2500))) throw new Error(`album '${ALBUM}' tak ketemu`);
    await alb.click(); await browser.pause(1200);

    // 4) ambil check_view (grid date-desc), tap TERBALIK -> seleksi = urutan fase
    const cvs = await allById("check_view");
    const total = cvs.length;
    if (total === 0) throw new Error("tak ada klip di album");
    const n = NCLIPS > 0 ? Math.min(NCLIPS, total) : total;
    // rekam koordinat pusat dulu (hindari stale handle setelah klik)
    const pts = [];
    for (let i = 0; i < n; i++) {
      const loc = await cvs[i].getLocation(); const sz = await cvs[i].getSize();
      pts.push([Math.round(loc.x + sz.width / 2), Math.round(loc.y + sz.height / 2)]);
    }
    const order = REVERSE ? [...Array(n).keys()].reverse() : [...Array(n).keys()];
    console.log(`[import] album='${ALBUM}' total=${total} pilih=${n} reverse=${REVERSE}`);
    for (const idx of order) { await tap(pts[idx], 600); }

    // 5) verifikasi jumlah terpilih
    await browser.pause(600);
    let cnt = "";
    if (await exists(byId("tvSelectedCount"), 1500)) cnt = await byId("tvSelectedCount").getText();
    console.log(`[import] ${cnt}`);
    const got = parseInt((cnt.match(/\d+/) || [0])[0], 10);
    if (got !== n) throw new Error(`terpilih ${got} != target ${n} (${cnt})`);

    // 6) Next -> editor (RN7 muat N klip bisa >6s -> tunggu longgar + retry)
    await byId("material_next").click();
    await browser.pause(5000);
    await dismissCoach();
    let inEditor = false;
    for (let tryi = 0; tryi < 4 && !inEditor; tryi++) {
      inEditor = (await exists(byId("current_textView"), 4000)) ||
                 (await exists(byId("total_textView"), 2000)) ||
                 (await exists($(`android=new UiSelector().descriptionContains("editor_toolbar_")`), 2000));
      if (!inEditor) { await dismissCoach(); await browser.pause(1500); }
    }
    if (!inEditor) throw new Error("tak sampai EditorActivity (current_textView/editor_toolbar absen)");
    const dur = (await exists(byId("total_textView"), 1500)) ? await byId("total_textView").getText() : "?";
    console.log(`[import] SELESAI: ${n} klip diimpor ke editor (total_textView=${dur})`);
  });
});
