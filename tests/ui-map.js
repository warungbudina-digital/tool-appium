import fs from "node:fs/promises";

// Pemeta UI: memotret layar yang sedang aktif dan mengubah pohon
// aksesibilitas menjadi inventaris elemen yang bisa dipakai sebagai
// parameter otomatisasi (selector + titik ketuk).
//
// Bersifat baca-saja: tidak menekan tombol apa pun. Navigasi dilakukan
// terpisah lewat adb/skrip lain, lalu pemeta ini dijalankan ulang.
//
// Pakai:
//   docker compose exec -e FORCE_APP_LAUNCH=false -e APP_PACKAGE=<pkg> \
//     -e MAP_NAME=<label> appium npx wdio run ./wdio.conf.js --spec tests/ui-map.js
//
// Hasil: /tmp/uimap-<label>.json dan ringkasannya dicetak ke stdout.

// getPageSource memakai nama kelas sebagai nama tag
// (<android.widget.TextView .../>), berbeda dari `uiautomator dump` yang
// memakai <node>. Jadi tag apa pun yang punya atribut bounds diambil.
const TAG = /<([\w.$]+)\s+([^>]*?)\/?>/g;
const ATTR = /([\w-]+)="([^"]*)"/g;

function parseNodes(xml) {
  const out = [];
  let tag;
  TAG.lastIndex = 0;
  while ((tag = TAG.exec(xml)) !== null) {
    const a = {};
    let m;
    ATTR.lastIndex = 0;
    while ((m = ATTR.exec(tag[2])) !== null) a[m[1]] = m[2];
    a.class = a.class || tag[1];

    const b = /\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(a.bounds || "");
    if (!b) continue;
    const [x1, y1, x2, y2] = b.slice(1).map(Number);
    const w = x2 - x1;
    const h = y2 - y1;

    // Elemen tanpa luas tidak bisa diketuk - biasanya berasal dari
    // lapisan window yang tidak terlihat.
    if (w <= 0 || h <= 0) continue;

    const label = a.text || a["content-desc"] || "";
    const id = (a["resource-id"] || "").split("/").pop();
    if (!label && !id) continue;

    out.push({
      label,
      id,
      class: (a.class || "").split(".").pop(),
      clickable: a.clickable === "true",
      scrollable: a.scrollable === "true",
      enabled: a.enabled !== "false",
      x: x1,
      y: y1,
      w,
      h,
      tapX: Math.round(x1 + w / 2),
      tapY: Math.round(y1 + h / 2),
    });
  }
  return out;
}

describe("UI map", () => {
  before(async () => {
    // UI yang menganimasi terus (editor video, pratinjau) tidak pernah
    // dianggap idle, sehingga UiAutomator menyerah dengan "null root node".
    await browser.updateSettings({
      waitForIdleTimeout: 100,
      enforceXPath1: true,
      allowInvisibleElements: false,
    });
  });

  it("captures the current screen", async () => {
    await browser.pause(1200);

    const name = process.env.MAP_NAME || "screen";
    const xml = await browser.getPageSource();
    const nodes = parseNodes(xml);

    const activity = await browser.getCurrentActivity();
    const pkg = await browser.getCurrentPackage();

    // Layar berbasis WebView tidak mengekspos isinya sebagai node native.
    // Kalau konteks WEBVIEW_* muncul, isinya bisa diotomasi lewat selector
    // web; kalau hanya NATIVE_APP, jalan satu-satunya adalah koordinat.
    let contexts = [];
    try {
      contexts = await browser.getContexts();
    } catch {
      contexts = ["(gagal dibaca)"];
    }

    const payload = { pkg, activity, contexts, count: nodes.length, nodes };
    console.log(`konteks tersedia: ${JSON.stringify(contexts)}`);

    await fs.writeFile(`/tmp/uimap-${name}.json`, JSON.stringify(payload, null, 2));
    await fs.writeFile(`/tmp/uimap-${name}.xml`, xml);

    const actionable = nodes.filter((n) => n.clickable || n.label);
    console.log(`\n=== ${pkg} :: ${activity} (${nodes.length} node) ===`);
    for (const n of actionable) {
      const flags = [n.clickable ? "tap" : "", n.scrollable ? "scroll" : ""]
        .filter(Boolean)
        .join(",");
      console.log(
        `${(n.label || "-").padEnd(28)} id=${(n.id || "-").padEnd(26)} ` +
          `@${n.tapX},${n.tapY} ${n.w}x${n.h} ${flags}`
      );
    }
  });
});
