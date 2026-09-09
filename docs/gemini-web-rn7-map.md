# Peta Otomasi — Google Gemini (web) di RN7 via Fennec

**Device**: Redmi Note 7 (`lavender`), crDroid 14, layar **1080 × 2340**
**Akses**: `adb -s 10.66.66.6:5555 ...` (WireGuard `10.66.66.6`)
**Target**: `gemini.google.com` di browser **Fennec** (`org.mozilla.fennec_fdroid`)
**Akun**: `clawapp810@gmail.com` (nama tampil **"claw"** di sapaan, **"claw app2"** di kartu akun sidebar — sama akun dgn [[chatgpt-web-rn7-map.md]])
**Tanggal pemetaan**: 2026-09-09

> ⚠️ **Ini BUKAN app Gemini native.** Sama seperti ChatGPT, app Google resmi butuh Play Integrity/GMS
> yang absen di crDroid tanpa GApps. Satu-satunya jalur berakun di RN7 = versi web via Fennec.
>
> ✅ **Tak perlu login manual sama sekali** — sesi `accounts.google.com` dari login ChatGPT (5/9)
> ke-share otomatis lintas semua subdomain `google.com` di profil Fennec yang sama. Buka
> `gemini.google.com` langsung tersambung ("Halo claw, apa yang bisa saya bantu?").

---

## 0. Prasyarat & cara masuk

**RDP (Firefox Remote Debugging Protocol) — jalur UTAMA untuk semua interaksi di dalam halaman.**
Detail protokol lengkap ada di `fennec-rn7-map.md` §RDP; ringkasnya:

```bash
adb -s 10.66.66.6:5555 forward tcp:6001 \
  localabstract:org.mozilla.fennec_fdroid/firefox-debugger-socket
```
(hilang tiap adb server restart — pasang ulang bila perlu)

**Buka lewat shortcut home** (paling andal): shortcut **"Google Gemini"** ada persis di sebelah
shortcut ChatGPT di halaman home ke-2. Alternatif via intent:
```bash
adb -s 10.66.66.6:5555 shell am start -a android.intent.action.VIEW \
  -d 'https://gemini.google.com/app' org.mozilla.fennec_fdroid
```
Fennec **reuse tab existing** kalau URL cocok (tak selalu buka tab baru) — kalau ragu tab mana yang
aktif, cek dulu `listTabs` via RDP, jangan asumsikan match pertama (pernah kejadian ada >1 tab
`gemini.google.com` bersamaan, lihat §7).

**Klien RDP minimal dipakai sesi ini** (`rdp.py <url_substr> [js_expr]`, reusable):
```python
import socket, json, sys
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
def wait_for(pred, limit=80):
    for _ in range(limit):
        p = rp()
        if p is None: return None
        if pred(p): return p
def get_console_for(url_substr):
    send({"to": "root", "type": "listTabs"})
    tabs = wait_for(lambda p: "tabs" in p)
    matches = [t for t in tabs["tabs"] if url_substr in (t.get("url") or "")]
    if not matches: return None, tabs["tabs"]
    tab = matches[0]
    send({"to": tab["actor"], "type": "getTarget"})
    console = wait_for(lambda p: "frame" in p)["frame"]["consoleActor"]
    return console, tab
if __name__ == "__main__":
    rp()  # hello
    console, tab = get_console_for(sys.argv[1])
    if len(sys.argv) > 2:
        send({"to": console, "type": "evaluateJSAsync", "text": sys.argv[2]})
        r = wait_for(lambda p: p.get("type") == "evaluationResult")
        print(json.dumps(r.get("result"), ensure_ascii=False))
```

---

## 1. Selector KUNCI — kirim & baca pesan (paling penting utk automasi)

Gemini pakai **custom Angular elements**, jauh lebih bersih drpd ChatGPT (`[data-message-author-role]`):

| Elemen | Selector | Catatan |
|---|---|---|
| Input prompt | `.ql-editor` (div `contenteditable`) | Quill editor — **BUKAN** ProseMirror spt ChatGPT |
| Tombol kirim | `button[aria-label="Kirim pesan"]` | |
| Pesan user | `user-query` (custom element) | `.innerText` → `"Anda berkata <teks>\n\n<teks>"` |
| Pesan Gemini | `model-response` (custom element) | `.innerText` → `"Gemini berkata\n\n<jawaban>"` |
| Chat baru | `button[aria-label="Chat baru"]` | reset ke URL bersih `/app` |
| Model picker | `button[aria-label*="pemilih mode"]` | lihat §3 |
| Upload & alat | `button[aria-label="Upload & alat"]` | lihat §4 |

**Resep kirim prompt + baca jawaban (teruji, round-trip penuh via RDP):**
```js
// 1. isi input — Quill TIDAK butuh trik seleksi-range spt ProseMirror ChatGPT
(function(){
  var el = document.querySelector('.ql-editor');
  el.focus();
  document.execCommand('insertText', false, 'teks prompt di sini');
})()

// 2. klik kirim
(function(){
  var b = Array.from(document.querySelectorAll('button'))
    .find(function(x){ return x.getAttribute('aria-label') === 'Kirim pesan'; });
  b.click();
})()

// 3. baca jawaban terakhir (setelah beberapa detik / polling stabil)
(function(){
  var m = document.querySelectorAll('model-response');
  return m[m.length-1].innerText.replace(/^Gemini berkata\n\n/, '');
})()
```
⚠️ **Deteksi selesai-generate BELUM diuji presisi** (sesi ini cuma tes jawaban pendek yg langsung
utuh). Ikuti pola aman ChatGPT: polling panjang teks `model-response` terakhir sampai stabil
**≥3 cek berturut**, jangan andalkan 1-2 cek saja.

---

## 2. Sidebar (hamburger `☰`, aria-label "Menu utama")

Buka via `button[aria-label="Menu utama"]`. Isi (top → bottom):

| Item | Fungsi |
|---|---|
| **Percakapan baru** | reset chat (highlight = state aktif) |
| **Telusuri percakapan** | cari riwayat chat |
| **Gambar** | landing generate-gambar khusus, model **"Nano Banana 2"** — lihat §5 |
| **Koleksi** | dokumen/media yg dibuat Gemini, kosong di akun ini ("Dokumen atau media yang Anda buat akan muncul di sini") |
| **Notebook** ▾ (collapsible) + **Notebook baru** | fitur riset/dokumen terstruktur, belum dieksplor dalam |
| **Terbaru** ▾ (collapsible) | daftar percakapan (nama-nama chat, 3-dot menu per-item utk rename/hapus) |
| **Upgrade** (pill button) | upsell Google AI Plus |
| **Kartu akun** (avatar "C" + "claw app2") | buka **Setelan**, lihat §6 |

**Navigasi ke percakapan lama via sidebar:**
```js
(function(){
  var el = Array.from(document.querySelectorAll('*'))
    .find(function(e){ return e.children.length===0 && e.textContent.trim()==='<judul chat>'; });
  el.closest('a,[role=link],div[jsaction]').click();
})()
```

---

## 3. Model picker (`Gemini Flash ⌄` di header)

Klik `button[aria-label*="pemilih mode"]` → dropdown 3 pilihan (per 9/9):

| Model | Deskripsi tampil |
|---|---|
| **3.5 Flash-Lite** | "Jawaban tercepat" |
| **3.6 Flash** *(default)* | "Bantuan serbaguna" |
| **3.1 Pro** | "Penalaran yang canggih" / "Penalaran yang diperluas" / "Pemecahan masalah kompleks" |

Klik nomor-versi sama lagi utk tutup dropdown (toggle).

---

## 4. Menu "Upload & alat" (ikon `+` di sebelah input)

Klik `button[aria-label="Upload & alat"]` → daftar:

`Kamera` · `Foto` · `File` · `Drive` · `Google Foto` · `Notebooks` · `Buat gambar` · `Buat musik` ·
`Canvas` · `Deep Research` · `Pembelajaran Terpandu` · `Kecerdasan Personal` · `Labs`

Belum dieksplor satu-per-satu (di luar cakupan pemetaan awal ini) — kandidat kuat utk sesi lanjutan
kalau user minta fitur spesifik (mis. "Deep Research" atau "Buat gambar" sbg pengganti/pelengkap
Canva-via-ChatGPT).

---

## 5. Sidebar → "Gambar" (generate gambar)

Landing page terpisah, bukan modal:
```
Buat gambar
dengan Nano Banana 2
Coba template
Cukup tambahkan gambar untuk memulai
Visualisasikan apa pun
Jelaskan ide di percakapan
Sempurnakan dengan Gemini
Minta Gemini untuk membuat perubahan
Coba
```
**"Nano Banana 2"** = nama model image-gen Gemini per 9/9 (dicatat verbatim, kemungkinan nama kode
internal Google — jangan dikira typo kalau ketemu lagi).

---

## 6. Setelan (avatar akun di sidebar → gear icon)

Bottom-sheet native (bukan WebView — bisa `uiautomator dump` kalau perlu koordinat presisi), isi:

`Aktivitas` · `Kecerdasan Personal` · `Impor memori ke Gemini` · `Batas penggunaan` · `Gem` ·
`Link publik Anda` · `Tema` · `Lihat langganan` · `Upgrade ke Google AI Plus` · `Gemini Notebook` ·
`Watermark media` · `Kirim masukan` · `Bantuan`

+ info lokasi di footer: **"Kota Denpasar, Bali, Indonesia — Dari alamat IP Anda"** + tombol
"Perbarui lokasi".

Belum digali per-tab (beda dari ChatGPT yg sampai §15/15 tab tuntas) — cukup utk sesi ini krn user
cuma minta pemetaan awal + verifikasi jalan, bukan audit keamanan mendalam spt ChatGPT.

---

## 7. Shortcut "Google Gemini" ke Beranda (cara reusable, TERUJI)

Sama persis pola ChatGPT (§3 file itu), via menu browser **⋮** (bukan menu Gemini):

1. Pastikan di URL root bersih (`gemini.google.com/app`, bukan `/app/<id>`) — kalau lagi di
   percakapan, klik `button[aria-label="Chat baru"]` dulu.
2. Tap ikon **⋮** browser (kanan-atas, pojok address bar) → **"Lebih banyak"** → **"Tambahkan ke
   Beranda"** → dialog isi nama **"Google Gemini"** otomatis + ikon sparkle asli → **TAMBAH** →
   konfirmasi Android **"Tambahkan ke layar utama"**.
3. Shortcut muncul di home persis sebelah ChatGPT.

⚠️ **JEBAKAN KOORDINAT (mahal, 2x salah sebelum sadar) — pelajaran keras utk diulang siapa pun ke
depan:** menu **⋮** browser adalah **native Android UI, BUKAN konten WebView** → **SELALU pakai
`adb shell uiautomator dump` lalu `grep -o 'text="X"...bounds="..."'`** utk dapat koordinat EXACT,
**JANGAN estimasi visual dari screenshot** (2 percobaan gagal sesi ini: sekali krn baca posisi baris
salah, sekali krn lupa kalikan skala 1.17 dari gambar preview ke device 1080×2340 — keduanya
berujung nyasar tap ke baris lain "Terjemahkan laman"/"Ekstensi").

Contoh dump yg benar:
```bash
adb -s 10.66.66.6:5555 shell uiautomator dump /sdcard/ui.xml
adb -s 10.66.66.6:5555 shell cat /sdcard/ui.xml | grep -o 'text="Tambahkan ke Beranda"[^>]*bounds="[^"]*"'
# → bounds="[21,1804][1059,1941]" → tap center (540, 1872)
```

---

## 8. Jebakan umum (ringkasan)

- **`adb shell input keyevent 4` (back) di halaman teratas Gemini = KELUAR APP** (sama persis
  ChatGPT) — pakai klik-tombol-X via RDP/koordinat utk tutup dialog, jangan hardware-back.
- **Screenshot menampilkan tab yang SEDANG FOREGROUND, bukan tab yang di-target RDP** — kalau abis
  klik via RDP lalu screenshot terlihat "kosong"/beda, cek dulu tab mana yg aktif (`am start` ulang
  ke URL Gemini utk paksa foreground) sebelum menyimpulkan klik gagal.
- **`document.body.innerText` di tab BACKGROUND (tak foreground) bisa balik string kosong/parsial**
  (Chrome/Gecko menahan layout utk tab tersembunyi) — kalau curiga, foreground-kan tab dulu via
  `am start`, atau pakai `.textContent` (tapi itu ikut nyertakan isi `<script>`, kurang bersih).

---

## Status pemetaan

✅ Selector kirim/baca pesan (§1) — **teruji round-trip penuh**, siap dipakai otomasi lanjutan.
✅ Sidebar, model picker, menu alat, shortcut home — dipetakan & diverifikasi jalan.
⏳ Belum digali: isi detail tiap item Setelan (§6), fitur individual di menu "Upload & alat" (§4:
Canvas/Deep Research/Notebooks/Labs dll), alur generate-gambar penuh (§5), fitur "Gem" (custom
persona, analog "GPTs"-nya ChatGPT). Lanjutkan kalau user minta fitur spesifik.
