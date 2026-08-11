// export-video.js — render proyek VN aktif ke MP4 (dari EditorActivity).
//
// Alur: EditorActivity -> editor_topbar_export -> VideoGenerateOptionActivity ->
// export_export (720p/30fps auto default) -> render -> kembali ke editor. File
// mendarat di /sdcard/DCIM/VN/VN<ts>.mp4 (deteksi file dilakukan pemanggil, mis.
// vn_export_gdrive.sh via `adb ls`). MOD = tanpa watermark/login (client-side).
//
// Env: DEVICE (rn7|infinix, default rn7), RENDER_TIMEOUT_MS (default 180000).
// Jalankan (menempel ke editor yg sudah ada proyek):
//   docker compose exec -T -e ANDROID_UDID=10.66.66.6:<port> -e APP_PACKAGE=com.frontrow.vlog \
//     -e FORCE_APP_LAUNCH=false -e DEVICE=rn7 appium npx wdio run ./wdio.conf.js --spec tests/export-video.js

const rid = (s) => `com.frontrow.vlog:id/${s}`;
const byId = (s) => $(`android=new UiSelector().resourceId("${rid(s)}")`);
const byText = (t) => $(`android=new UiSelector().text("${t}")`);

const NAV = {
  rn7:     { exportTop: [1007, 159], exportGo: [540, 1848] },
  infinix: { exportTop: [1007, 165], exportGo: [540, 1943] },
};
const C = NAV[process.env.DEVICE || "rn7"];
const RENDER_TIMEOUT = parseInt(process.env.RENDER_TIMEOUT_MS || "180000", 10);

async function tap([x, y], settle = 800) {
  await browser.action("pointer").move({ x, y }).down().pause(60).up().perform();
  await browser.pause(settle);
}
async function exists(el, ms = 2000) { try { return await el.waitForExist({ timeout: ms }); } catch { return false; } }
async function dismiss() {
  for (const t of ["Got it", "OK", "Done", "Finish", "Mengerti", "Selesai"]) {
    const e = byText(t); if (await exists(e, 500)) { try { await e.click(); await browser.pause(300); } catch {} }
  }
}

describe("VN export video", () => {
  it("render proyek aktif ke MP4", async () => {
    await browser.updateSettings({ waitForIdleTimeout: 120, allowInvisibleElements: true });
    await browser.pause(1000);
    // 0) pastikan di EDITOR: tutup popup/coach nyasar (share-success, rate, dll)
    for (let i = 0; i < 3; i++) {
      if (await byId("editor_topbar_export").isExisting().catch(() => false)) break;
      await dismiss();
      // tutup popup umum (ivClose / tombol X) tanpa BACK (BACK bisa keluar editor)
      for (const cid of ["ivClose", "ivCancel", "iv_close"]) {
        const e = byId(cid); if (await exists(e, 400)) { try { await e.click(); await browser.pause(400); } catch {} }
      }
      await browser.pause(600);
    }
    if (!(await byId("editor_topbar_export").isExisting().catch(() => false)))
      throw new Error("tak di EditorActivity (editor_topbar_export absen) — impor/buka proyek dulu");
    // 1) tombol export top-bar
    const top = byId("editor_topbar_export");
    if (await exists(top, 3000)) await top.click(); else await tap(C.exportTop);
    await browser.pause(1500);
    // 2) VideoGenerateOptionActivity -> export_export (default 720p/30fps auto)
    const go = byId("export_export");
    if (!(await exists(go, 6000))) throw new Error("layar export (export_export) tak muncul");
    const sizeEl = byId("tvFileSize");
    const estSize = (await exists(sizeEl, 1500)) ? await sizeEl.getText() : "?";
    console.log(`[export] mulai render (estimasi ${estSize})`);
    await go.click();
    // 3) tunggu render selesai: export_export hilang ATAU kembali ke editor
    const t0 = Date.now();
    let done = false;
    while (Date.now() - t0 < RENDER_TIMEOUT) {
      await dismiss();
      const stillOnOption = await byId("export_export").isExisting().catch(() => false);
      const inEditor = await byId("editor_topbar_export").isExisting().catch(() => false);
      const successShare = await byText("Share").isExisting().catch(() => false)
        || await byId("tvExportVideoToVn").isExisting().catch(() => false);
      // VN sering KEMBALI KE MainActivity setelah render (bukan editor) -> deteksi itu juga.
      const onMain = await byText("Your Projects").isExisting().catch(() => false)
        || await byId("home_project_create").isExisting().catch(() => false)
        || await byId("home_projects").isExisting().catch(() => false);
      // selesai = keluar dari layar Option (export_export hilang) & mendarat stabil
      if (!stillOnOption && (inEditor || successShare || onMain)) { done = true; break; }
      await browser.pause(2500);
    }
    if (!done) throw new Error(`render tak selesai dalam ${RENDER_TIMEOUT}ms`);
    console.log(`[export] SELESAI render (~${Math.round((Date.now() - t0) / 1000)}s) — file di /sdcard/DCIM/VN/`);

    // 4) KEMBALI KE EDITOR (default) — VN native kembali ke daftar proyek pasca-render;
    // buka lagi kartu proyek TERATAS (paling baru = yg barusan diekspor) -> EditorActivity.
    if ((process.env.RETURN_TO_EDITOR || "1") !== "0") {
      await browser.pause(1200);
      await dismiss();
      if (!(await byId("editor_topbar_export").isExisting().catch(() => false))) {
        const card = byId("clRoot"); // RecyclerView proyek; match pertama = teratas/terbaru
        if (await exists(card, 5000)) { await card.click(); await browser.pause(3000); await dismiss(); }
      }
      const backEditor = (await exists(byId("current_textView"), 6000))
        || (await exists(byId("editor_topbar_export"), 3000));
      console.log(`[export] kembali ke editor: ${backEditor ? "OK" : "GAGAL (masih di daftar proyek)"}`);
    }
  });
});
