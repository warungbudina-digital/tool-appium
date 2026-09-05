# Peta Otomasi — Browser Fennec di RN7

**Device**: Redmi Note 7 (`lavender`), crDroid 14, **1080 × 2340**
**Paket**: `org.mozilla.fennec_fdroid` (Firefox F-Droid) **v154.0.0**, versionCode **1540020** (varian arm64)
**Akses**: `ADB="docker exec tool-appium-appium-1 adb -s 10.66.66.6:5555"`
**Tanggal pemetaan**: 2026-09-05

Fennec dipasang di RN7 karena crDroid tanpa GApps tidak punya browser Chromium/Custom-Tabs.
Sekarang ia jadi **satu-satunya jalur web berakun di RN7** (lihat `chatgpt-web-rn7-map.md`).

> **⭐ BACA §7 DULU.** Ada jalur otomasi jauh lebih baik daripada tap-koordinat:
> **Firefox Remote Debugging Protocol** sudah aktif & terbukti jalan di RN7.
> Koordinat di §1–§6 tetap dipakai untuk UI **browser**-nya (chrome), tapi untuk
> apa pun **di dalam halaman web**, pakai RDP.

---

## 1. Toolbar (tetap ada di semua halaman)

Toolbar Fennec **terbaca `uiautomator dump`** dan punya resource-id yang stabil.

| Elemen | resource-id | Tap |
|---|---|---|
| Info situs (gembok) | `browser.toolbar.site.info.secure` | **(85, 165)** |
| Address bar | `ADDRESSBAR_URL_BOX` | **(414, 164)** |
| Tab baru | *(desc: "Tab baru")* | **(766, 165)** |
| Penghitung tab | `ADDRESSBAR_TABS_COUNTER` | **(891, 164)** |
| Menu `⋮` | *(desc: "Opsi lainnya")* | **(1017, 165)** |

`ADDRESSBAR_URL_BOX` punya `content-desc` berisi **URL aktif** → cara termurah baca URL:
```bash
$ADB shell uiautomator dump /sdcard/u.xml >/dev/null
$ADB shell cat /sdcard/u.xml | tr '>' '\n' | grep ADDRESSBAR_URL_BOX
```
`TabCounterTestTags.tabCounter` desc berisi **jumlah tab** ("Tab Non-pribadi Terbuka: N").

---

## 2. Menu `⋮`

**⚠️ Layout bergeser ~330 px setelah "Lebih banyak" diperluas.** Pakai tabel yang sesuai.

### 2a. Menu tertutup (default)
| Item | resource-id | Tap |
|---|---|---|
| Tutup menu | — | (540, 691) |
| Kembali / Maju / Bagikan / Segarkan | — | (140/407/674/**941**, 858) |
| Markahi laman | — | (540, 1000) |
| Temukan di laman | — | (540, 1142) |
| Situs desktop | `mainMenu.desktop.site.off` | (540, 1295) |
| Ekstensi | `mainMenu.extensions` | (540, 1470) |
| **Lebih banyak** | — | **(540, 1633)** |
| Riwayat / Markah / Unduhan / Kata sandi | — | (148/409/670/931, 1824) |
| Setelan | — | (540, 2166) |

### 2b. Menu diperluas (sesudah "Lebih banyak")
| Item | Tap |
|---|---|
| Tutup menu | (540, 362) |
| Kembali / Maju / Bagikan / **Segarkan** | (140/407/674/**941**, 529) |
| Markahi laman | (540, 671) |
| Temukan di laman | (540, 813) |
| Situs desktop | (540, 966) |
| Ekstensi | (540, 1141) |
| Terjemahkan laman | (540, 1304) |
| Ringkas laman *(nonaktif)* | (540, 1446) |
| Laporkan situs yang rusak | (540, 1588) |
| Tambahkan ke pintasan | (540, 1730) |
| **Tambahkan ke Beranda** | **(540, 1872)** |
| Simpan ke koleksi | (540, 2014) |
| Buka di Aplikasi *(nonaktif)* | (540, 2156) |
| Simpan sebagai PDF | (540, 2253) |

---

## 3. Layar tab switcher

| Elemen | Tap |
|---|---|
| Tab Pribadi (private) | (135, 143) |
| Tab Normal *(aktif)* | (405, 143) |
| Tab groups | (675, 143) |
| Tab tersinkron | (945, 143) |
| Kartu tab ke-1 (judul) | (254, 322) |
| Tutup tab ke-1 ✕ | (468, 323) |
| Tutup tab ke-2 ✕ | (987, 323) |
| Cari tab | (127, 2163) |
| Menu tab | (264, 2163) |
| Tambah tab | (964, 2161) |

Tombol tutup punya `content-desc="Tutup tab <judul>"` → bisa dicari by-desc, tak perlu koordinat.

---

## 4. Address bar aktif (mode ketik)

| Elemen | resource-id | Tap |
|---|---|---|
| Pemilih mesin pencari | — | (100, 164) |
| **Kolom ketik** | `ADDRESSBAR_SEARCH_BOX` | (556, 165) |
| Bersihkan | — | (997, 165) |

Mesin pencari default: **DuckDuckGo**.
Di bawahnya muncul daftar saran/riwayat; tiap baris punya tombol **"Hapus entri riwayat ini"** di **x ≈ 996**.

Navigasi URL terprogram (paling andal, tanpa menyentuh address bar):
```bash
$ADB shell am start -a android.intent.action.VIEW -d "https://contoh.com/" \
  -n org.mozilla.fennec_fdroid/org.mozilla.fenix.IntentReceiverActivity
```

---

## 5. Setelan

Buka: menu `⋮` → Setelan (540, 2166).

**Halaman 1** — Masuk/sync (664,321) · Cari/DuckDuckGo (82,776) · Tab (77,977) · Beranda (124,1178) ·
Ubahsuai (133,1379) · Sandi (96,1525) · Metode pembayaran (243,1671) · Aksesibilitas (163,1817) ·
Bahasa (114,1963) · Terjemahan (155,2109) · Ringkasan laman (205,2250)

**Halaman 2** (1× swipe `540,1800 → 540,500`) — DNS Di Atas HTTPS · Perlindungan Pelacakan Dipertingkat ·
Pengaturan situs · Hapus data penjelajahan · Hapus data saat keluar · Notifikasi ·
**Tingkat Lanjut**: Ekstensi · Buka tautan di aplikasi · Pengaturan Unduhan · Fennec Labs ·
Use UnifiedPush · Peningkatan jarak jauh · **Pengawakutuan jarak jauh melalui USB** · Tentang Fennec

---

## 6. Jebakan UI

1. **`keyevent 4` (back) di halaman teratas = KELUAR aplikasi** ke launcher. Untuk menutup keyboard pakai `keyevent 111` (ESC); untuk menutup menu/bottom-sheet, tap "Tutup menu".
2. **Isi halaman web TIDAK terekspos** ke `uiautomator dump` (hanya 1 node `android.webkit.WebView`, ±38 node total). → untuk apa pun di dalam halaman, **pakai RDP (§7)**.
3. Menu bergeser ~330 px saat diperluas (§2).
4. **Shortcut home bisa memakai ulang tab lama** yang state-nya basi — tutup dulu tab lama kalau hasilnya aneh.
5. `input tap` kadang tak ngefek → ganti `input swipe X Y X Y 100`.

---

## 7. ⭐ Firefox Remote Debugging Protocol (RDP) — jalur otomasi utama

**Status: SUDAH AKTIF di RN7** (Setelan → Tingkat Lanjut → "Pengawakutuan jarak jauh melalui USB" = ON,
diaktifkan 2026-09-05 dengan persetujuan user).

### Setup (dari HOST akses-vps, bukan container — container tak punya python/nc)
```bash
adb -s 10.66.66.6:5555 forward tcp:6001 \
  localabstract:org.mozilla.fennec_fdroid/firefox-debugger-socket
```
Forward hilang saat adb server restart → jalankan ulang bila perlu.

### Protokol
Format paket: `<panjang>:<json>`. Server mengirim *hello* saat konek, lalu balasan bercampur
notifikasi (`frameUpdate`, dll) → **wajib saring** sampai dapat paket yang dicari.

### Klien minimal (teruji jalan)
```python
import socket, json
s = socket.create_connection(("127.0.0.1", 6001), timeout=12); s.settimeout(12)

def rp():
    buf = b""
    while b":" not in buf:
        c = s.recv(1)
        if not c: return None
        buf += c
    n = int(buf[:-1]); d = b""
    while len(d) < n:
        ch = s.recv(n - len(d))
        if not ch: break
        d += ch
    return json.loads(d)

def send(o):
    b = json.dumps(o).encode(); s.sendall(str(len(b)).encode() + b":" + b)

def wait_for(pred, limit=60):
    for _ in range(limit):
        p = rp()
        if p is None: return None
        if pred(p): return p

rp()                                             # hello
send({"to": "root", "type": "listTabs"})
tabs = wait_for(lambda p: "tabs" in p)
tab = [t for t in tabs["tabs"] if "chatgpt.com" in (t.get("url") or "")][0]
send({"to": tab["actor"], "type": "getTarget"})
console = wait_for(lambda p: "frame" in p)["frame"]["consoleActor"]

send({"to": console, "type": "evaluateJSAsync", "text": "document.title"})
print(wait_for(lambda p: p.get("type") == "evaluationResult")["result"])
```

### Yang sudah TERBUKTI bisa
| Kemampuan | Bukti |
|---|---|
| Daftar tab + URL + judul | `listTabs` → `{"title":"ChatGPT","url":"https://chatgpt.com/"}` |
| Eksekusi JS di halaman | `evaluateJSAsync` → hasil kembali di `evaluationResult.result` |
| Cek status login terprogram | `!document.body.innerText.includes('Masuk')` → `true` |
| Deteksi elemen via selector | `#prompt-textarea` → `true` |
| **Baca SELURUH teks halaman** | `document.body.innerText` — **menggantikan belasan scroll+dump** |

### Kenapa ini penting
Sebelumnya, mengambil satu jawaban panjang ChatGPT butuh **±25 langkah scroll + `uiautomator dump`
berulang** dengan risiko celah/duplikasi (lihat riwayat pemetaan RN5). Dengan RDP,
cukup **satu `evaluateJSAsync`**. Selector CSS juga menggantikan koordinat rapuh
yang bergeser tiap keyboard muncul.

**Rekomendasi**: untuk pekerjaan web di RN7 ke depan, pakai RDP sebagai jalur utama;
koordinat (§1–§6) hanya untuk hal yang benar-benar di luar halaman (buka tab, menu browser,
"Tambahkan ke Beranda", setelan).

### Catatan keamanan
Socket debug hanya terekspos lewat **abstract unix socket** yang butuh `adb forward` —
artinya hanya bisa dicapai lewat jalur ADB (yang di RN7 sudah dibatasi ke tunnel WireGuard,
`iptables` menolak 5555 dari selain `10.66.66.1`). Tidak ada port TCP baru yang terbuka ke jaringan.
Kalau suatu saat mau dimatikan: Setelan → gulir ke bawah → toggle "Pengawakutuan jarak jauh melalui USB".
