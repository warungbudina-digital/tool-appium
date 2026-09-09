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

**⭐ Temuan kunci arsitektur 9/9: sebagian besar item di sini BUKAN halaman terpisah, tapi
MODE TOGGLE** — klik item → sebuah "pill"/chip nama mode muncul menempel di area input (mis.
`Deep Research`, `Canvas`, `Belajar`), URL TETAP `/app`, dan tombol `close <Nama Mode>` muncul utk
keluar mode. Prompt berikutnya diproses dalam konteks mode itu. Ini beda dari ChatGPT yg sebagian
besar fiturnya (Canvas ChatGPT, Plugin) juga per-percakapan tapi tanpa "mode pill" eksplisit sejelas
ini.

**Digali langsung (9/9):**

| Tool | Perilaku terverifikasi |
|---|---|
| **Deep Research** | Aktifkan mode riset — tombol baru muncul: `Sumber, Google Penelusuran dipilih` (bisa ganti sumber) + `Upload file` (tambah dokumen sbg bahan riset). Placeholder input berubah jadi *"Yuk kita mulai, claw"*. |
| **Canvas** | Mode dokumen/kode kolaboratif (nama SAMA persis dgn fitur "Canvas" ChatGPT, kebetulan/konvergensi — bukan integrasi lintas produk). Placeholder *"Sebaiknya kita mulai dari mana?"*. Belum digenerate isi nyata (butuh prompt lanjutan). |
| **Pembelajaran Terpandu** | Mode "Belajar" — utk sesi belajar terpandu step-by-step. Placeholder *"Tanyakan apa saja, claw."* (mode aktif ditandai chip, bukan teks placeholder beda drpd default — perlu cek chip via `aria-label` bukan cuma teks). |
| **Buat gambar** | Bukan mode-pill, tapi NAVIGASI ke `/images` (halaman landing terpisah) — lihat §5. |
| **Notebooks** | **✅ DIPASTIKAN 9/9.** Klik → dialog consent generik ("Membuat konten dari gambar dan file", Batal/Setuju — dialog ini SHARED dgn semua sumber upload lain, bukan spesifik Notebooks) → dialog KEDUA **"Tambahkan notebook"**: *"Gabungkan beberapa sumber, seperti dokumen dan situs, ke dalam sebuah notebook untuk mendapatkan bantuan yang terfokus pada suatu topik atau project"* → tombol **"Coba Gemini Notebook"** = link `<a href="https://notebooklm.google.com?utm_source=gemini&utm_medium=referral">` yg REDIRECT ke `https://notebook.google.com/notebook/<uuid>` (produk **"Gemini Notebook"**, rebrand dari NotebookLM lama, domain baru `notebook.google.com`). Auto-login sesi sama (`clawapp810`), notebook baru otomatis dibuat. Interface: tab Sumber/Chat/Studio, "0 sumber" saat baru dibuat. **Produk terpisah dari Gemini utama** — mapping detailnya di luar cakupan doc ini (bisa jadi dokumen sendiri kalau user minta). |
| **Kamera / Foto / File / Drive / Google Foto** | Sumber upload standar (native file picker Android / Google Drive picker) — belum ditest end-to-end (upload file sungguhan), tapi tombolnya konsisten ada & clickable. |
| **Buat musik / Labs / Kecerdasan Personal** (duplikat entry) | Belum ditest — "Kecerdasan Personal" di sini kemungkinan cuma shortcut ke halaman settings yg sama §6b. |

**Cara aktifkan/tutup mode (reusable):**
```js
// buka menu tools
document.querySelector('button[aria-label="Upload & alat"]').click();
// klik salah satu tool by nama persis
Array.from(document.querySelectorAll('*'))
  .find(e => e.children.length===0 && e.textContent.trim()==='Deep Research').click();
// tutup mode aktif
Array.from(document.querySelectorAll('button'))
  .find(b => (b.getAttribute('aria-label')||'').indexOf('close')>-1).click();
```

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

## 6. Setelan (avatar akun di sidebar → gear icon) — DIGALI DETAIL 9/9

⚠️ **Koreksi:** ini bottom-sheet **WebView** (bagian dari halaman Gemini), BUKAN native Android —
`document.querySelector`/klik via RDP bekerja normal, `uiautomator dump` TAK PERLU (beda dari menu
browser Fennec ⋮ di §7 yg genuinely native).

Isi (12-13 item, "Impor memori ke Gemini" kadang muncul kadang tidak — kemungkinan cuma tampil
sekali/kondisional): `Aktivitas` · `Kecerdasan Personal` · `Impor memori ke Gemini` · `Batas
penggunaan` · `Gem` · `Link publik Anda` · `Tema` · `Lihat langganan` · `Upgrade ke Google AI Plus` ·
`Gemini Notebook` · `Watermark media` · `Kirim masukan` · `Bantuan` + footer **"Kota Denpasar, Bali,
Indonesia — Dari alamat IP Anda"** + tombol "Perbarui lokasi".

**Cara klik item settings (reusable):**
```js
(function(){
  var el = Array.from(document.querySelectorAll('*'))
    .find(function(e){ return e.children.length===0 && e.textContent.trim()==='<Nama Item>'; });
  el.click();
})()
```
⚠️ Beberapa item navigasi ke URL baru TAPI sheet settings-nya sendiri **tetap menutupi konten** —
kalau `location.href` berubah tapi `innerText` masih nunjukkan daftar menu, itu normal, konten asli
ada DI BAWAH sheet (baca lewat RDP tetap jalan krn DOM-nya ada, cuma ketutup visual).

### 6a. Aktivitas
Link ke Google Activity (`myactivity.google.com`) — riwayat aktivitas akun Google secara umum,
bukan spesifik Gemini. Klik via RDP tak selalu terdaftar sbg navigasi tab baru (perlu dicoba lagi
kalau perlu, belum konsisten).

### 6b. Kecerdasan Personal (`/personalization-settings`) — 3 sub-fitur
| Fitur | Detail |
|---|---|
| **Memori** | Toggle **ON** (biru+centang) di akun ini. "Gemini belajar dari percakapan sebelumnya untuk lebih memahami Anda." + link "Kelola dan hapus" |
| **Aplikasi Terhubung** | Card dgn chevron `>` → link `/apps`. **Digali detail 9/9, lihat §6b-lanjutan** |
| **Petunjuk untuk Gemini** | Custom instructions — analog "Personalisasi" ChatGPT. Contoh placeholder: *"Gunakan poin butir untuk paragraf panjang"* |

### 6b-lanjutan. Aplikasi Terhubung (`/apps`) — digali detail 9/9
Elemen klik BUKAN di teks judul, tapi `<a aria-label="Buka bagian Aplikasi Terhubung" href="/apps">`
tersembunyi di dalam section — cari via `section.querySelectorAll('a')` kalau klik langsung ke teks
gagal.

Halaman berisi 2 tab (**"Dari Google"** / **"Lainnya"**), tiap grup App punya **toggle master**
sendiri (bukan per-app individual utk Workspace — 6 app Google Workspace berbagi SATU toggle):

**Dari Google:**
| Grup | Toggle (saat dicek) | Isi/contoh prompt |
|---|---|---|
| **Google Workspace** | **OFF** (abu-abu, terverifikasi visual) | Gmail·Calendar·Dokumen·Drive·Keep·Tasks — 1 toggle utk semua 6 |
| **Cari layanan** (Search/Maps/Shopping/Berita/Google Penerbangan&Hotel) | — | *"Tunjukkan pola tersembunyi dalam penelusuran Google saya"* |
| **Google Foto** | — | *"Buat itinerari liburan... terinspirasi dari foto perjalanan saya"* |
| **YouTube** | — | *"Rekomendasikan film berdasarkan riwayat YouTube saya"* |
| **YouTube Music** (`@YouTube Music`) | — | *"putar musik"* |
| **Gemini Notebook** (`@Gemini Notebook`) | — | *"Buat notebook baru untuk proyek penelitian saya"* — ⭐ dikonfirmasi resmi: *"Notebook menggunakan Aplikasi Gemini dan Gemini Notebook serta membagikan dan menyinkronkan info di antara kedua produk tersebut"* |
| **Profil Bisnis Google** (`@Profil Bisnis Google`) | — | *"Analisis performa bisnis saya selama 30 hari terakhir"* |

**Lainnya:**
| Grup | Isi |
|---|---|
| **Kontak** | insight dari daftar kontak |
| **Verify AI** (`@Verify AI`) | *"Tool to verify provenance of media. Can read C2PA content credentials and detect the SynthID watermark used by Google AI."* — ini yg dimaksud toggle "Watermark media" §6g |

9 toggle `button[role=switch]` total ditemukan (1 per grup di atas), **2 dari 9 berstatus ON** saat
dicek — identitas pasti 2 grup mana belum sempat dikonfirmasi 1-per-1 (Workspace dipastikan OFF via
screenshot, sisanya cuma lewat query DOM tanpa korelasi visual penuh — kalau perlu presisi, screenshot
tiap grup satu-per-satu, JANGAN andalkan urutan DOM query mentah).

Footer halaman: **"Konten premium Anda"** (kelola langganan berbayar yg ditautkan, prioritas jawaban)
+ link keluar **"Hub Privasi Aplikasi Gemini"** (penjelasan resmi data sharing).

**Cara ke halaman ini langsung:** `location.href='https://gemini.google.com/apps'`

### 6c. Batas penggunaan (`/usage`)
```
Penggunaan saat ini: 1% digunakan — Direset pukul 02.50
Batas mingguan: 0% digunakan — Direset pada 16 Sep pukul 21.50
```
Quota tracker harian+mingguan, mirip konsep "Batas penggunaan" tapi Gemini pisah 2 window waktu
(ChatGPT cuma 1 metrik penggunaan sederhana).

### 6d. Gem (`/gems/view`) — analog "Explore GPTs" ChatGPT
```
Buat aplikasi AI, Gem baru dari Google Labs
Pengelola Gem
```
**Gem bawaan Google** (6): `Storybook` (buku bergambar kustom) · `Pencari ide` (ide pesta/hadiah/
bisnis) · `Konsultan karier` (rencana skill+tujuan karier) · `Partner coding` (bantuan coding+
belajar) · `Pembimbing Belajar` (bantu pelajari konsep baru) · `Editor tulisan` (saran tata bahasa+
struktur kalimat).
**Gem Saya** — kosong di akun ini, tombol **"Gem Baru"** utk buat custom Gem (instruksi sendiri,
sama konsep Custom GPT ChatGPT). Deskripsi resmi: *"Gem adalah Gemini versi kustom yang dapat
memberikan respons sesuai kebutuhan Anda... Anda dapat menyesuaikan Gem bawaan atau membuat Gem
baru menggunakan petunjuk yang Anda tetapkan."*

### 6e. Link publik Anda (`/sharing`)
"Anda dapat membagikan percakapan secara utuh ataupun satu demi satu perintah & respons... kelola
link publik yang telah dibuat dan lihat detailnya di sini." Kosong di akun ini.

### 6f. Tema
Submenu kecil (bukan halaman terpisah): **Sistem** / **Terang** / **Gelap** (radio, current terlihat
"Sistem" default).

### 6g. Watermark media
Toggle **inline** langsung di daftar settings (bukan submenu terpisah): **Aktif / Nonaktif** —
kemungkinan besar kontrol SynthID watermark pada gambar hasil generate (`Buat gambar`/Nano Banana 2).

### 6h. Item belum digali detail (di luar scope sesi ini)
`Lihat langganan`/`Upgrade ke Google AI Plus` (upsell, low priority), `Gemini Notebook` (mungkin
sama dgn sidebar Notebook §2), `Kirim masukan`/`Bantuan` (generic, self-explanatory).

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
✅ Sidebar, model picker, shortcut home — dipetakan & diverifikasi jalan.
✅ **Setelan §6 digali detail 9/9** — 6 dari 8 item substansial sudah dibuka isinya (Kecerdasan
Personal 3-subfitur, Batas penggunaan, Gem lengkap 6 bawaan+custom, Link publik, Tema, Watermark).
✅ **Upload & alat §4 digali 9/9** — ditemukan arsitektur "mode pill" (Deep Research/Canvas/
Pembelajaran Terpandu terverifikasi aktivasi+deaktivasi), berbeda dari dugaan awal "menu navigasi
biasa".
✅ **"Aplikasi Terhubung" (§6b-lanjutan) & "Notebooks" (§4) TUNTAS dipastikan** — keduanya sempat
ambigu di pemetaan awal, sekarang jelas: Aplikasi Terhubung = ekosistem 9 grup app (Workspace/
Search/Foto/YouTube/YouTube-Music/Gemini-Notebook/Profil-Bisnis/Kontak/Verify-AI) tiap grup 1 toggle
master; Notebooks = pintu masuk ke produk terpisah "Gemini Notebook" (`notebook.google.com`, rebrand
NotebookLM).
⏳ Masih belum: isi nyata tiap Gem bawaan (baru nama+deskripsi, belum dicoba chat), generate Canvas/
Deep Research end-to-end (baru aktivasi mode, belum tes hasil), identitas pasti 2 dari 9 toggle
Aplikasi Terhubung yg ON, mapping detail produk "Gemini Notebook" itu sendiri (di luar scope —
produk terpisah), upload file/foto/drive end-to-end, "Buat musik"/"Labs". Kedalaman sekarang setara
ChatGPT §1-9 (bukan §10-15 audit keamanan/notifikasi granular) — cukup utk kerja otomasi produktif,
lanjutkan digali kalau user butuh fitur spesifik dari daftar "belum" di atas.
