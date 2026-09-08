# Peta Otomasi — ChatGPT (web) di RN7 via Fennec

**Device**: Redmi Note 7 (`lavender`), crDroid 14, layar **1080 × 2340**
**Akses**: `docker exec tool-appium-appium-1 adb -s 10.66.66.6:5555 ...`
**Target**: `chatgpt.com` di browser **Fennec** (`org.mozilla.fennec_fdroid`)
**Akun**: `clawapp810@gmail.com` (nama tampil "Claw", plan **Free**)
**Tanggal pemetaan**: 2026-09-05 (awal) · **2026-09-08** (§10 Menu Akun & Pengaturan ditambahkan)

> ⚠️ **Ini BUKAN app ChatGPT.** APK `com.openai.chatgpt` sudah dihapus dari RN7 karena login-nya
> mustahil (di-gate Google Play Integrity — `BIND_EXPRESS_INTEGRITY_SERVICE` butuh `com.android.vending`
> yang absen di crDroid tanpa GApps). Satu-satunya jalur berakun di RN7 = versi web ini.

---

## 0. Prasyarat & cara masuk

```bash
ADB="docker exec tool-appium-appium-1 adb -s 10.66.66.6:5555"

$ADB shell input keyevent 224          # wake
$ADB shell wm dismiss-keyguard         # lolos keyguard
$ADB shell dumpsys power | grep -E "Display Power|mWakefulness"   # pastikan ON + Awake
```

**Buka lewat shortcut home** (paling andal, langsung ke `chatgpt.com` dalam keadaan login):
- Shortcut "ChatGPT" ada di **halaman home ke-2** (geser kiri dari home utama), bounds `[23,108][230,480]` → tap **(126, 294)**
- Alternatif via intent: `$ADB shell am start -a android.intent.action.VIEW -d "https://chatgpt.com/" -n org.mozilla.fennec_fdroid/org.mozilla.fenix.IntentReceiverActivity`

---

## 1. Kontrol browser Fennec (tetap di semua layar)

| Elemen | Koordinat tap | Catatan |
|---|---|---|
| Address bar | **(363, 164)** | tap → keyboard muncul, ketik URL lalu `keyevent 66` |
| Tab baru `+` | **(766, 164)** | |
| Tab switcher | **(890, 164)** | angka di ikon = jumlah tab |
| Menu `⋮` | **(1016, 164)** | |
| Info situs (gembok) | **(84, 164)** | |

**Di dalam tab switcher**: tombol tutup tab ada di pojok kanan-atas tiap kartu.
Contoh 2 tab: kartu-1 close **(468, 323)**, kartu-2 close **(987, 323)**.
Judul tab membedakan status login: **"ChatGPT"** = login, **"ChatGPT: Chat, Work, Create & Code with AI"** = logout.

**Menu ⋮ → item penting** (bottom sheet, perlu tap "Lebih banyak" dulu di **(296, 1631)**):
| Item | Koordinat |
|---|---|
| Segarkan (reload) | **(941, 490)** |
| Tambahkan ke Beranda | **(394, 1871)** |

---

## 2. Layar utama ChatGPT (login, tanpa keyboard)

| Elemen | Koordinat tap | Fungsi |
|---|---|---|
| Hamburger (sidebar) | **(76, 324)** | buka daftar chat |
| Selector model `ChatGPT ⌄` | **(277, 324)** | dropdown model |
| Upgrade | **(840, 324)** | upsell Plus (abaikan) |
| Obrolan baru (ikon kanan-atas) | **(1002, 324)** | reset ke chat kosong |
| **Kolom input** | **(538, 2016)** | tap → fokus + keyboard |
| Lampiran `+` | **(109, 2113)** | menu unggah file/gambar |
| Mic (dikte) | **(855, 2113)** | |
| Mode suara (bulat biru) | **(969, 2113)** | |

**Chip saran** (hanya di chat kosong):
| Chip | Tap | Tombol tutup ✕ |
|---|---|---|
| Buat gambar atau stiker | (400, 791) | (980, 791) |
| Tulis atau edit | (400, 927) | (980, 927) |
| Cari di web | (400, 1062) | (980, 1062) |

---

## 3. Layar input aktif (keyboard terbuka)

Layout naik: kolom input pindah ke **(538, 1212)**, baris tombol ke **y ≈ 1310**
(`+` (109,1310) · mic (855,1310) · suara (969,1310)).

**Tombol kirim** menggantikan tombol suara begitu ada teks → tap **(969, 1310)**.

---

## 4. Sidebar (hamburger)

| Elemen | Koordinat |
|---|---|
| Tutup sidebar ✕ | **(608, 321)** |
| Cari 🔍 | **(505, 321)** |
| **Obrolan baru** | **(300, 466)** |
| Gambar | (300, 570) |
| Pustaka | (300, 674) |
| Terjadwal | (300, 778) |
| Plugin | (300, 882) |
| Proyek (+ di (615,986)) | (300, 986) |
| Codex (↗ di (612,1090)) | (300, 1090) |
| Lebih banyak | (300, 1195) |
| Header "Terkini" (edit (542,1321) · ⋯ (615,1321)) | — |
| Item chat ke-1 | (300, 1415) · menu ⋯ (615, 1415) |
| Item chat ke-2 | (300, 1519) · menu ⋯ (615, 1519) |
| Akun (nama + plan) | (300, 2126) |
| Upgrade (bawah) | (538, 2152) |

Jarak antar item chat ≈ **104 px**; item ke-N ≈ `y = 1415 + (N-1) × 104`.

---

## 5. Dropdown model

| Opsi | Koordinat | Status |
|---|---|---|
| ChatGPT Plus (+ tombol Upgrade (814,491)) | (351, 442) | upsell, tak bisa dipakai |
| **ChatGPT** (✓ aktif di (881,647)) | **(311, 620)** | satu-satunya model di plan Free |

---

## 6. Layar percakapan

Posisi **Y bergantung panjang percakapan** — X tetap.

**Baris aksi di bawah pesan USER**: copy (786) · bagikan (892) · edit ✏️ (996)
**Baris aksi di bawah jawaban ASSISTANT**: copy (67) · 👎 (172) · bagikan (276) · regenerate (380) · ⋯ (486)

**Deteksi status generate selesai**: dump UI lalu cek `content-desc="Good response"` / `"Bad response"` —
muncul hanya setelah jawaban rampung (sama pola dgn app ChatGPT di RN5).

---

## 7. Jebakan penting (mahal ditemukan, jangan diulang)

1. **`keyevent 66` (Enter) TIDAK mengirim pesan** — ini `<textarea>` web, Enter = baris baru.
   **Wajib tap tombol kirim** di (969, 1310).
2. **Pohon aksesibilitas WebView TIDAK stabil terekspos** ke `uiautomator dump` di Fennec —
   sering hanya muncul 1 node `android.webkit.WebView` (≈38 node total, tanpa isi halaman).
   Kadang isi web muncul (mis. saat alur login Google), tapi **jangan diandalkan**.
   → **Otomasi di sini berbasis KOORDINAT screenshot**, bukan selector. Verifikasi hasil lewat
   `screencap` + baca gambar, bukan lewat dump.
3. **Shortcut bisa memakai ulang tab lama** — kalau ada tab `chatgpt.com` berstatus logout,
   shortcut menampilkannya (tampak "belum login" padahal sesi aman).
   → Tutup tab basi; bedakan lewat judul tab (lihat §1).
4. **Sesi login persisten** di profil Fennec (bertahan lintas reload & tutup-tab), **bukan** per-tab.
5. **`input tap` polos kadang tak ngefek** (pola lama RN7) → pakai
   `input swipe X Y X Y 100` sebagai pengganti tap.
6. **Layout bergeser saat keyboard muncul** (~800 px) — selalu ambil koordinat dari state
   yang benar (§2 tanpa keyboard vs §3 dengan keyboard), jangan campur.
7. **`keyevent 4` (back) di halaman paling atas = KELUAR Fennec ke launcher**.
   Untuk sekadar menutup keyboard, `keyevent 111` (ESC) lebih aman.
8. **Buat shortcut HARUS dari URL root `chatgpt.com`** — kalau dibuat saat membuka
   `chatgpt.com/c/<id>`, shortcut mengarah ke satu percakapan & namanya jadi judul chat.

---

## 8-A. ⭐ RESEP UTAMA — kirim prompt & ambil jawaban via RDP (TERUJI, tanpa koordinat)

**Pakai cara ini.** §8-B (koordinat) hanya cadangan kalau RDP mati.

Prasyarat: `adb -s 10.66.66.6:5555 forward tcp:6001 localabstract:org.mozilla.fennec_fdroid/firefox-debugger-socket`
(dari HOST akses-vps; lihat `fennec-rn7-map.md` §7. Forward hilang tiap adb server restart → pasang ulang).

### Selector kunci (stabil, hasil verifikasi live 2026-09-05)
| Elemen | Selector | Catatan |
|---|---|---|
| Kolom input | `#prompt-textarea` | **DIV `contenteditable`, class `ProseMirror`** — bukan textarea! |
| Tombol kirim | `[data-testid="send-button"]` | baru MUNCUL setelah ada teks; `aria-label="Kirim perintah"` |
| Pesan (user & assistant) | `[data-message-author-role]` | nilai atribut: `user` / `assistant` |
| Sidebar | `[data-testid="open-sidebar-button"]` | |
| Pemilih model | `[data-testid="model-switcher-dropdown-button"]` | |
| Tambah file | `[data-testid="composer-plus-btn"]` | |

### Mengetik ke ProseMirror
`el.innerText = "..."` **TIDAK BEKERJA** (React/ProseMirror mengabaikannya).
Yang berhasil: fokus → seleksi seluruh isi → `execCommand('insertText')`.

```js
(() => {
  const el = document.querySelector('#prompt-textarea');
  el.focus();
  const sel = window.getSelection(), r = document.createRange();
  r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r);
  document.execCommand('insertText', false, "TEKS PROMPT DI SINI");
  return JSON.stringify({isi: el.innerText});
})()
```

### Kirim
```js
document.querySelector('[data-testid="send-button"]').click()
```

### Baca seluruh percakapan (1 panggilan, ganti ~25 scroll+dump)
```js
(() => {
  const msgs = [...document.querySelectorAll('[data-message-author-role]')];
  return JSON.stringify(msgs.map(m => ({
    peran: m.getAttribute('data-message-author-role'),
    teks: (m.innerText || '').trim()
  })));
})()
```

### Deteksi jawaban selesai
⚠️ **`[data-testid="stop-button"]` TIDAK ANDAL** — pada uji 2026-09-05 tetap `true`
sampai 50 detik walau jawaban sudah rampung. **Cara yang dipakai: polling panjang teks
pesan assistant terakhir sampai berhenti bertambah** (mis. sama 2× cek berturut-turut, jeda 3-5 dtk),
atau cukup tunggu 15–25 detik untuk jawaban pendek.

### Hasil uji live (2026-09-05)
Prompt "Sebutkan 3 ide judul konten pendek tentang tips baterai HP" → terkirim, URL berubah ke
`/c/<id>` (percakapan baru tersimpan), jawaban terbaca utuh. **Nol tap koordinat, nol screenshot.**

---

## 8-B. Resep cadangan — via koordinat (kalau RDP tidak tersedia)

```bash
ADB="docker exec tool-appium-appium-1 adb -s 10.66.66.6:5555"

# 1) bangunkan + buka shortcut
$ADB shell input keyevent 224; $ADB shell wm dismiss-keyguard
$ADB shell input keyevent 3          # ke home
$ADB shell input swipe 900 1200 200 1200 300   # ke halaman home ke-2
$ADB shell input tap 126 294         # shortcut ChatGPT
sleep 20

# 2) fokus kolom input (pakai swipe-tap, lebih andal)
$ADB shell input swipe 538 2016 538 2016 120
sleep 3

# 3) ketik prompt — WAJIB %s utk spasi, kutip TUNGGAL, pecah per klausa
$ADB shell input text 'Buatkan%side%skonten%stutorial'
sleep 2
$ADB shell input text '%stentang%steknologi%ssehari-hari.'
sleep 2

# 4) kirim (JANGAN Enter)
$ADB shell input swipe 969 1310 969 1310 100

# 5) tunggu selesai lalu screenshot utk dibaca
sleep 25
$ADB shell screencap -p /sdcard/out.png
$ADB pull /sdcard/out.png /home/appium/.android/out.png
```

**Aturan ketik teks panjang** (sama seperti RN5, lihat memori `project_redmi_vn_node`):
- spasi → `%s`
- hindari `( ) , ' "` dan `!` di dalam kutip ganda (shell Android mem-parse ulang)
- pecah jadi potongan ±5 kata dengan `sleep 1-2` antar potongan
- setelah loop `keyevent 67` (backspace) banyak, **beri jeda 2-3 detik** sebelum mengetik lagi
  (kalau tidak, karakter acak akan hilang)

---

## 9. Audit live 2026-09-05 (sesi lanjutan) — temuan & koreksi

**Metode audit:** murni via RDP (`adb forward tcp:6001 ...`), tanpa satu pun tap koordinat/screenshot.

### 9.1 Fakta akun (terverifikasi authed, bukan tebakan UI)
| Item | Nilai |
|---|---|
| Email | `clawapp810@gmail.com` |
| Nama | "Claw" (backend `/me`) / "claw app2" (display `/api/auth/session`) |
| **MFA/2FA** | ~~AKTIF~~ **⚠️ KOREKSI 2026-09-08: OFF** — `mfa_flag_enabled=true` cuma penanda "fitur tersedia", BUKAN status aktual. Ground-truth = toggle di §10.5. |
| Plan | **Free** (tak ada fitur `paid/plus/pro/team`) |
| Token sesi | valid, `expires 2026-12-04` |
| Percakapan | 3 total: "Ide Judul Tips Baterai" (5/9), "Sapa RN7" (5/9), **"Asisten Hitung Belanja" (2026-08-13)** |

> ⚠️ **"Asisten Hitung Belanja" dari 13-08-2026 MENDAHULUI setup terdokumentasi 5/9** → mengonfirmasi
> anomali `firstInstallTime=2026-09-01` di memori: akun ini SUDAH dipakai di RN7 jauh sebelumnya.
> Bukan akun perawan.

### 9.2 ⭐ Dua jebakan RDP yang mahal (WAJIB baca sebelum pakai fetch API)
1. **`evaluateJSAsync` TIDAK meng-await Promise** di build Fennec ini. Ekspresi `async`/`fetch(...)`
   mengembalikan **grip Promise `pending`**, bukan hasilnya. → **Pola wajib:** jalankan fetch,
   simpan hasil ke variabel global (`window.__x = JSON.stringify(...)`), lalu **polling sinkron**
   `typeof window.__x==='string' ? window.__x : '__P__'` tiap ~0.6 dtk sampai terisi.
2. **`/backend-api/*` butuh Bearer token, bukan cukup cookie.** Fetch cookie-only ke
   `/backend-api/me` & `/backend-api/conversations` balik jalur **anonim** (email kosong,
   `total:0`) walau jelas sedang login. → Ambil dulu `accessToken` dari **`/api/auth/session`**,
   lalu kirim header `Authorization: 'Bearer '+token` pada semua panggilan backend-api.
   (`/api/auth/session` sendiri cukup cookie & langsung memberi email+nama+token.)

### 9.3 Round-trip TERUJI ULANG (recipe §8-A masih valid)
Kirim `#prompt-textarea` (execCommand insertText) → klik `send-button` → chat baru `/c/...` dibuat →
jawaban terbaca via `[data-message-author-role="assistant"]`. **Nol koordinat.**
⚠️ **Deteksi selesai:** selector DOM `good-response...` TIDAK ditemukan (abaikan tebakan itu);
tetap andalkan **polling panjang teks assistant sampai stabil ≥3 cek** (jawaban pendek bisa
menipu polling 2-cek — naikkan ke 3). `stop-button` tetap tak andal (§8-A).

---

## 10. Menu Akun & Pengaturan (Settings) — pemetaan 2026-09-08

Dipetakan via kombinasi RDP (navigasi hash) + koordinat presisi (crop PIL, bukan tebak visual —
lihat §10.7). **Tab UI dalam sesi ini ter-render Bahasa Indonesia.**

### 10.0 Cara masuk (2 jalur)

**A — via UI (perlu sidebar terbuka dulu):**
```
hamburger (76,324) → tap baris akun paling bawah sidebar "Claw / Free" (100, 2128)
→ bottom-sheet menu akun muncul → tap "Pengaturan" (~200, 1720)
```

**B — ⭐ via RDP, jauh lebih andal (skip semua drama klik berlapis):**
```js
location.hash = '#settings/Security'   // atau '#settings/Data', '#settings/General', dst
```
Nama section di hash **memakai ID internal Inggris** (`Security`, `Data`, `General`, `Notifications`,
`Personalization`, `Storage`, `Analytics`), **BUKAN** label Indonesia yang tampil di UI. Modal
Pengaturan langsung terbuka di tab yang dituju — tidak perlu buka sidebar/avatar sama sekali.

### 10.1 Menu akun (bottom-sheet dari baris "Claw / Free" di sidebar)

| Item | Fungsi |
|---|---|
| Header "Claw / Free" (+ `>`) | tap → halaman ringkasan plan |
| Upgrade paket | upsell Plus |
| Personalisasi | shortcut ke tab Personalisasi Settings |
| Profil | edit nama/foto tampilan |
| **Pengaturan** | buka modal Settings (§10.2) |
| Bantuan (+ `>`) | submenu help center |
| Keluar | logout akun ini (device ini saja) |

### 10.2 Tab bar Pengaturan — 15 tab, ID hash ASLI (ground-truth dari DOM)

Tab bar **scrollable horizontal** — swipe di baris tab itu sendiri (y tepat di tab, bukan di
badan modal, lihat jebakan §10.7). Ada kotak **"Cari pengaturan"** di atas tab bar — pencarian
**WAJIB kata kunci Bahasa Indonesia** ("improve" nol hasil, "data"/"keamanan" jalan) dan hasilnya
bisa langsung ditap untuk lompat ke item spesifik.

**ID hash ASLI diambil langsung dari DOM** (`role="tab"` elemen, atribut `id` mengandung
`trigger-<ID>`) — jangan tebak lagi, semua 15 sudah dikonfirmasi via `location.hash='#settings/<ID>'`:

| Label Indonesia | ID hash asli | Isi dipetakan di |
|---|---|---|
| Umum | `General` | §10.3a |
| Notifikasi | `Notifications` | §10.3b |
| Personalisasi | `Personalization` | §10.3c |
| Plugin | `Plugins` | §10.3d |
| Suara | `Voice` | §10.3e |
| Tagihan | `Billing` | §10.3f |
| Penggunaan | `Usage` | §10.3g |
| Analitik | `Analytics` | §9.3h (lama) |
| Kontrol data | `DataControls` | §10.3 (existing) |
| Penyimpanan | `Storage` | §10.3h |
| Keselamatan | `SafetySettings` | §10.3i |
| Keamanan dan masuk | `Security` | §10.4 (existing) |
| Pengawasan orang tua | `ParentalControls` | §10.3j |
| Kontak tepercaya | `Safety` | §10.3k |
| Akun | `Account` | §10.3l |

⚠️ **Jebakan penamaan: hash `Data`/`Plugin` (tanpa akhiran) JUGA jalan** — router tampaknya
menerima prefix parsial dan lompat ke tab yang cocok, tapi **ID lengkap di atas lebih aman** dipakai
untuk otomasi (tak bergantung perilaku prefix-matching yang tak terdokumentasi).

**Cara reusable dapatkan daftar tab kapan pun berubah (add-on OpenAI sering nambah fitur):**
```js
Array.from(document.querySelectorAll('[role="tab"]')).map(e => ({
  text: e.textContent.trim(), id: e.id
}))
```

### 10.3 Isi tiap tab (dipetakan penuh 2026-09-08, akun Free `clawapp810`)

**a) Umum (`General`)** — banner "Amankan akun Anda / Siapkan MFA" (CTA setup MFA) · Tampilan=Sistem
(dropdown) · Kontras=Sistem · Warna aksen=Default · Bahasa=Deteksi otomatis · **Kecerdasan lebih
tinggi**=ON (toggle, "otomatis pakai tingkat kecerdasan lebih tinggi utk pertanyaan kompleks") ·
**Aktifkan Dikte**=ON (toggle).

**b) Notifikasi (`Notifications`)** — 10 kategori, tiap baris punya dropdown independen berisi
kombinasi `Push`/`Email`/`Push, Email`: Codex, Kesehatan, Obrolan grup, Pemasaran, Penggunaan
(=Push,Email), Proyek (=Email), Pustaka (=Email), Respons (=Push), Tips personal (=Push,Email),
Tugas (=Push,Email, + link "Kelola tugas").

**c) Personalisasi (`Personalization`)** — bagian terpanjang, 4 sub-grup:
- **Gaya & Karakteristik**: Gaya dan nada dasar=Default (dropdown) + 4 slider Karakteristik
  (Hangat/Antusias/Judul & Daftar/Emoji, semua=Default) + **Jawaban cepat**=ON (toggle) +
  **Instruksi khusus** (textarea kosong).
- **Peliharaan**: "Pilih pendamping yang bekerja bersama Anda" → link "Pilih peliharaan >"
  (fitur AI-companion pet, belum dikonfigurasi = "Default").
- **Tentang Anda**: 3 field teks kosong — Nama panggilan, Pekerjaan (placeholder contoh
  "Mahasiswa teknik di Universitas Waterloo"), Selengkapnya tentang Anda.
- **Memori**: **Aktifkan memori**=ON (toggle, "izinkan ChatGPT mempersonalisasi berdasarkan
  obrolan/file/aplikasi terhubung") + Ringkasan memori (tombol "Kelola" → belum digali) + catatan
  "Memori dipakai jg utk personalisasi kueri ke Bing" (konfirmasi Bing = backend pencarian web).
- **Lanjutan** (expander, default collapsed — tap teks "Lanjutan" untuk buka): **Pencarian
  web**=ON · **Kanvas**=ON · **ChatGPT Suara**=ON · **Cari di Pustaka**=ON · **Pencarian
  konektor**=OFF (satu-satunya yg mati di tab ini).

**d) Plugin (`Plugins`)** — "Izin" = "Izinkan risiko rendah" (link ke sub-halaman level izin) +
4 item list: Deep Research, Plugin Management, Jelajahi plugin, Mode pengembang (semua icon+`>`,
isi belum digali lebih dalam — TODO minor).

**e) Suara (`Voice`)** — pemilih suara carousel (avatar bulat gradient, panah kiri/kanan, 9 dots
indikator) — suara aktif **"Sol" ("Cerdas dan santai")** · Model=**Live** (dropdown) ·
Bahasa=Deteksi otomatis.

**f) Tagihan (`Billing`)** — status **"ChatGPT Free — Kecerdasan untuk tugas sehari-hari"** +
tombol "Upgrade". Tab paling pendek, isinya cuma ini.

**g) Penggunaan (`Usage`)** — BEDA dari "Riwayat penggunaan" di tab Analitik. Isi: **Batas
paket** (disclaimer "digunakan bersama di Codex, Work, Workspace Agents, ChatGPT for Excel — obrolan
biasa TIDAK termasuk") → progress bar "Batas penggunaan bulanan: direset dalam 29 hari 23 jam,
**tersisa 100%**" · **Reset batas penggunaan**: "Tidak ada reset batas penggunaan yang tersedia
saat ini" (fitur reset-manual utk power-user, tak relevan di akun Free minim pakai).

**h) Penyimpanan (`Storage`)** — tab terpendek: **"0 B dari 512 MB terpakai"** (progress bar
kosong) + 2 kategori "Kelola penyimpanan": File (0 B · 0 file, `>`), Gambar (0 B · 0 gambar, `>`).

**i) Keselamatan (`SafetySettings`)** — 1 toggle saja: **"Kurangi konten sensitif"**=**OFF**
("tambahkan perlindungan ekstra terkait topik sensitif dan batasi jenis konten tertentu").

**j) Pengawasan orang tua (`ParentalControls`)** — deskripsi fitur (link akun orang-tua↔remaja
untuk kontrol fitur/batasan) + tombol **"+ Tambahkan anggota keluarga"** — belum ditautkan ke
siapa pun.

**k) Kontak tepercaya (`Safety`)** ⚠️ **fitur keselamatan sensitif, penting dicatat isinya
lengkap**: deskripsi eksplisit — *"Ke depannya, jika Anda membahas bunuh diri dengan ChatGPT
dengan cara yang menunjukkan adanya risiko keselamatan yang serius, kami dapat secara otomatis
memberi tahu kontak tepercaya Anda agar mereka dapat mengecek kondisi Anda. Kontak tersebut harus
berusia 18 tahun ke atas untuk dapat berpartisipasi."* + tombol **"+ Tambahkan kontak"** — belum
ada kontak terdaftar di akun ini.

**l) Akun (`Account`)** — identitas: Nama=**Claw** · Nama pengguna=**@clawapp810** (`>`, bisa
diedit) · Email=**clawapp810@gmail.com** (`>`) · **Hapus akun** (tombol merah destruktif,
**JANGAN tap tanpa izin eksplisit**). Lalu **"Profil pembuat GPT"** (identitas publik kalau
share custom GPT): preview kartu **"PlaceholderGPT — Oleh community builder"** (belum
dikustomisasi) + banner "selesaikan verifikasi utk publikasikan GPT ke semua orang" (butuh
billing-detail atau verifikasi domain) → **Tautan**: "Pilih domain" (dropdown, kosong), GitHub
(tombol "Tambahkan", belum ditautkan) → **Email**: `clawapp810@gmail.com` + checkbox "Terima
email umpan balik" (UNCHECKED).

### 10.3 Tab "Kontrol data" (`#settings/Data`)

| Item | Kontrol | Nilai saat audit |
|---|---|---|
| **Sempurnakan model untuk semua orang** | link → toggle di sub-halaman | **Aktif** (data chat BOLEH dipakai training OpenAI) |
| Lokasi | tombol "Nyalakan" | OFF (belum diizinkan) |
| Informasi yang dibagikan dengan aplikasi | link (`>`) | belum digali |
| Tautan yang dibagikan | tombol "Kelola" | — |
| Obrolan yang diarsipkan | tombol "Kelola" | — |
| Arsipkan semua obrolan | tombol aksi | — |
| Hapus semua obrolan | tombol aksi (merah, destruktif) | **JANGAN tap tanpa izin eksplisit** |
| Ekspor data | (terpotong di scroll, ada tombol "Ekspor") | belum digali |

### 10.4 Tab "Keamanan" (`#settings/Security`) — **"Keamanan dan masuk"**

| Bagian | Item | Kontrol | Nilai saat audit |
|---|---|---|---|
| — | Kata sandi | tombol "Tambahkan" | belum diset (login murni via Google OAuth) |
| — | Kunci keamanan & kunci sandi | tombol "Tambahkan" → submenu (§10.5) | belum ada kunci/passkey terdaftar |
| **Autentikasi multifaktor (MFA)** | Authenticator app | **toggle** | **OFF** (abu-abu, lihat koreksi §9.1) |
| **Sesi** | Sesi aktif | badge angka + `>` → submenu (§10.6) | **2 sesi** |
| Keamanan tingkat lanjut | (terpotong di scroll) | belum digali |

### 10.5 Submenu "Kunci keamanan & kunci sandi"
Halaman kosong (belum ada kunci terdaftar) + 2 CTA: **"Tambahkan kunci keamanan atau kunci
sandi"** (tombol hitam) dan kartu promo **"Dapatkan YubiKey"** (tombol "Pesan YubiKey", link
belanja OpenAI/YubiKey — bukan fitur, murni marketing). Tombol back `<` di pojok kiri-atas
header (koordinat berubah tergantung scroll, ukur ulang tiap kali via crop).

### 10.6 Submenu "Sesi aktif" (`>` dari §10.4)
Daftar device yang pernah/sedang login, tiap baris: ikon HP, nama sesi, model device + OS,
timestamp login pertama, lokasi (kota, kode provinsi), badge status, dan tombol **"Keluar"**
(logout device itu — destruktif per-device, TANYA IZIN sebelum tap kalau bukan device sendiri).

**Contoh nyata (2026-09-08):**
| Sesi | Device | Login pertama | Lokasi | Badge |
|---|---|---|---|---|
| ChatGPT Web | Generic Smartphone · Android | 5 Sep 2026 15:52 | Denpasar, BA | `SESI INI` (tanpa tombol Keluar) |
| ChatGPT Android App | Vivo 1724 · Android | 13 Agu 2026 13:41 | Denpasar, BA | `PERANGKAT TEPERCAYA` + tombol "Keluar" |

Di bawah daftar: **"Keluar dari semua sesi"** (tombol merah, destruktif — mengakhiri SEMUA sesi
termasuk yang sedang dipakai, "dapat memakan waktu hingga 30 menit").

### 10.7 Jebakan navigasi UI (mahal, berkali-kali kena sesi ini)

1. **Swipe mendatar di BADAN modal (bukan tepat di tab-bar) MENGGESER SELURUH MODAL ke
   samping** (bukan scroll tab bar). Gejala: modal tampak terpotong/setengah di luar layar.
   Fix: swipe balik arah berlawanan pada garis y yang sama untuk mengembalikan posisi.
2. **`element.click()` via RDP TIDAK SELALU memicu handler React** untuk tombol menu akun
   (`accounts-profile-button`) — sempat gagal beberapa kali padahal elemen ketemu & `.click()`
   "berhasil" tanpa error. **Tap `input tap`/`input swipe` via adb LEBIH ANDAL** untuk membuka
   menu akun & item Pengaturan dibanding klik sintetis RDP.
3. **⭐ ATURAN WAJIB koordinat: SELALU ukur posisi via `PIL.Image.crop()` pada file screenshot
   ASLI (1080×2340), JANGAN kalikan 1.17 dari gambar preview 923×2000 yang ditampilkan ke
   Claude.** Estimasi visual langsung dari preview meleset ratusan pixel berkali-kali sesi ini
   (salah tap ke item riwayat obrolan / composer "+" padahal niat ke tombol Pengaturan/Sesi
   aktif). Alur andal: `screencap` → crop region kecil (150–300px) di sekitar target dugaan →
   baca offset presisi dari hasil crop → `tap(offset_x_dalam_crop, crop_y0 + offset_y_dalam_crop)`.
4. **Hash-routing (`location.hash='#settings/<ID>'`) via RDP jauh lebih tahan-jebakan** dibanding
   navigasi klik berlapis — pakai ini sebagai jalur utama untuk lompat ke section Settings mana
   pun ke depan, koordinat cadangan hanya untuk isi form yang butuh interaksi fisik (toggle,
   input teks).

## 10.11 "Kelola" Ringkasan Memori — isi lengkap (2026-09-08)

Tap tombol **"Kelola"** di baris "Ringkasan memori" (§10.3c, Personalization) membuka panel
**"Ringkasan memori"** — bukan daftar mentah, tapi **rangkuman naratif hasil sintesis AI** dari
seluruh riwayat obrolan. Header: `Diperbarui <N> menit lalu` (dinamis, live).

**Isi rangkuman akun `clawapp810` saat digali (3 bagian narasi + 1 bagian saran):**
1. **Ringkasan (overview umum)**: *"Anda terutama menggunakan ChatGPT untuk membantu pekerjaan
   yang berhubungan dengan pembuatan konten video pendek dan penghitungan belanja. Anda lebih
   menyukai jawaban yang terstruktur, konkret, dan langsung dapat diterapkan, terutama dalam
   bahasa Indonesia."*
2. **Editing Video VN**: *"Anda mengedit video pendek untuk Reels dan TikTok menggunakan VN Video
   Editor (VlogNow) di Android. Anda menyukai penjelasan yang membahas teknik editing secara
   praktis, seperti cutting mengikuti beat, transisi, speed ramp, keyframe, filter, teks, serta
   gaya editing untuk konten brand makanan dan lifestyle. Anda juga tertarik menganalisis tutorial
   dari kreator lain menjadi langkah-langkah yang jelas, termasuk nama teknik, fitur VN yang
   dipakai, parameter yang spesifik bila tersedia, urutan pengerjaan, dan kapan teknik tersebut
   cocok digunakan."*
3. **Perhitungan Belanja**: *"Untuk tugas menghitung belanja, Anda menginginkan peran yang sangat
   spesifik: hanya menghitung total secara akurat tanpa memberikan rekomendasi tambahan. Anda
   menyebutkan bahwa perintah akan diberikan melalui pesan suara. Anda juga ingin setiap hasil
   menampilkan pemetaan semua nominal yang disebutkan sebelum memberikan total akhir, termasuk
   tetap mengikuti koreksi atau perubahan ucapan apabila terjadi saat berbicara."*
4. **"Gali Lebih Dalam"** — 2 prompt siap-klik (link, auto-kirim ke chat kalau ditap):
   - "Lihat rangkumkan teknik editing VN yang paling sering diminta beserta tujuan penggunaannya."
   - "Bandingkan preferensi format jawaban untuk editing video dan perhitungan belanja."

**Kotak input di bawah** (`"Tanya atau perbarui"`) memungkinkan chat langsung dgn ringkasan ini —
bisa MINTA UPDATE memori via bahasa natural di sini (belum dicoba kirim pesan, hanya diverifikasi
field-nya ada).

**Menu "⋯" (pojok kanan-atas panel) — 2 item:**
| Item | Fungsi |
|---|---|
| Tentang memori | Dialog info: *"ChatGPT secara otomatis mengingat informasi penting tentang Anda dan memperbaruinya. Halaman ringkasan ini hanya gambaran singkat tentang yang diingat—bukan daftar lengkap."* (tombol Pelajari-selengkapnya / Mengerti) |
| **Hapus dan nonaktifkan memori** | ⚠️ **DESTRUKTIF** (teks merah) — belum dicoba, JANGAN tap tanpa izin eksplisit user |

### ⚠️ Sub-temuan: link "Memori Tersimpan" (legacy) — HATI-HATI jebakan konfirmasi destruktif
Di deskripsi "Ringkasan memori" ada link **"Memori Tersimpan"** (bukan tombol Kelola) yang membuka
panel TERPISAH **"Memori tersimpan"** — ini versi LAMA sistem memori ChatGPT (pre-summary, daftar
item diskrit satu-per-satu), sudah **deprecated**: *"Ini adalah versi lama memori yang sudah tidak
digunakan lagi. Memori ChatGPT yang ditingkatkan otomatis selalu diperbarui, sehingga jawabannya
lebih relevan dan bermanfaat."*

**Isi list lama akun ini: HANYA 1 item** (dikonfirmasi via query DOM langsung, bukan cuma yg
kelihatan di layar): *"Pengguna ingin setiap hasil perhitungan belanja diberikan sebagai total
lengkap, dengan angka-angka yang dipetakan dari setiap nominal yang disebutkan."* — cocok persis
dgn bagian "Perhitungan Belanja" di ringkasan baru, sisa satu-satunya entri diskrit dari SEBELUM
sistem upgrade ke model ringkasan-naratif.

**🔴 JEBAKAN NYATA (kejadian sesi ini, dicatat keras):** panel ini punya tombol
**"Kembali ke pengalaman ini"** yang TAMPAK seperti tombol netral/dismiss, TAPI sebenarnya
**memicu dialog konfirmasi DESTRUKTIF**: *"Kembalikan ke pengalaman memori tersimpan versi lama?
Memori ChatGPT mungkin menjadi usang seiring waktu."* (tombol merah "Kembalikan" vs "Batalkan") —
**kalau tertekan (mis. salah tap koordinat), ini akan MENGUBAH SETELAN AKUN** (revert ke mode
memori lama, effectively menonaktifkan sistem ringkasan-otomatis yang baru). **Kejadian nyata:
coordinate-tap meleset & TIDAK SENGAJA menekan tombol ini** — untung berhasil di-"Batalkan" tepat
waktu (via RDP klik-by-text, bukan koordinat, JAUH lebih aman utk kasus begini). **How to apply:
di halaman "Memori Tersimpan", JANGAN PERNAH tap area dekat "Kembali ke pengalaman ini" via
koordinat blind — kalau perlu berinteraksi di panel ini, SELALU pakai RDP `querySelector` cari
tombol by exact text, supaya tak pernah salah sasaran ke tombol berkonsekuensi permanen.**

### 10.8 Status pemetaan — TUNTAS 15/15 tab (2026-09-08)
Semua tab Pengaturan sudah dipetakan isinya penuh (§10.3 a–l + Kontrol data §10.3/Keamanan §10.4
dari sesi sebelumnya). **Sisa TODO minor** (bukan tab utuh, cuma sub-halaman di dalam tab yang
belum ditembus): "Kelola" Ringkasan Memori (Personalization), "Pilih peliharaan" (Personalization),
"Informasi yang dibagikan dengan aplikasi" (Data Controls), "Ekspor data" (Data Controls). ✅
"Izinkan risiko rendah" + 4 item Plugin (§10.9) dan "Gambar"/"File" storage (§10.10) DITUNTASKAN
di bawah.

## 10.9 Sub-halaman Plugin — detail penuh (2026-09-08)

Semua item di tab Plugin (§10.3d) sudah ditembus isinya. Pola navigasi: tap item → sub-halaman
dgn header "< Kembali" (kecuali "Jelajahi plugin" yg pindah ROUTE PENUH, bukan sub-panel modal —
lihat catatan khusus di §10.9c).

**a) "Izin" (level permission plugin secara global)** — 3 radio pilihan:
| Opsi | Deskripsi |
|---|---|
| Selalu tanya | "ChatGPT akan meminta izin sebelum membaca atau membuat perubahan." |
| Izinkan akses baca | "ChatGPT dapat membaca tanpa meminta izin, tetapi akan meminta izin sebelum melakukan perubahan." |
| **Izinkan tindakan berisiko rendah** ✅ (aktif saat ini) | "ChatGPT akan secara otomatis menyetujui tindakan berisiko rendah, tetapi dapat menolak tindakan yang melibatkan informasi sensitif." |

**b) "Deep Research"** (koneksi bawaan, ikon teleskop) — Koneksi="Riset Mendalam". **"Belum ada
tindakan aplikasi yang tersedia"** (tak ada custom action, murni internal). Informasi: Pengembang=
**OpenAI**, Situs web (link), Kebijakan Privasi (link).

**c) "Plugin Management"** (koneksi bawaan, ikon plus-hijau) — Koneksi="Plugin Management". Ini
**meta-plugin yang memberi ChatGPT kemampuan mengelola plugin LAIN via bahasa natural**
(instal/uninstall/atur-izin), terbukti dari **Skill: `plugin-management`** + daftar tindakan:
- **Tindakan baca**: "Get app permissions" (Inspect one named ChatGPT plugin's global/default and
  plugin-specific permission…), "Get plugin dependencies" (Resolve the canonical public plugins
  declared by one plugin's app manifest…)
- **Tindakan menulis**: "Uninstall app" (Uninstall ChatGPT plugins only for explicit
  uninstall/remove/disconnect intent…), "Update app permissions" (Update global ChatGPT plugin
  permissions or a plugin-specific override…)

Informasi: Pengembang=OpenAI, Situs web + Kebijakan Privasi (link).

**d) "Jelajahi plugin"** ⚠️ **BUKAN sub-panel modal seperti item lain — pindah ROUTE PENUH**
(`chatgpt.com/plugins`, keluar dari konteks `#settings/...`, "Kembali" browser diperlukan utk
balik ke Settings, atau set ulang hash manual). Ini **marketplace connector penuh** OpenAI — jauh
lebih besar dari sekadar 4-item list, berisi PULUHAN connector pihak-3 lintas kategori:
- **Terinstal**: cuma Deep Research + Plugin Management (2 bawaan, tak bisa dilepas).
- **Populer**: Gmail, GitHub, Google Drive, Slack, Outlook Email, Canva.
- **Small Business**: Dropbox, HubSpot, Stripe, Canva, Figma, Slack (+ Shopify/Wix, "lihat lainnya").
- **(kategori developer)**: alat build/deploy web app — Railway dkk (+ Neon/Base44, "lihat lainnya").
- **Business & Operasional**: HubSpot, Shopify, Windsor.ai, **Metricool for Social Media**
  ("Review analytics, plan posts"), **vidIQ** ("YouTube stats and keywords"), **Ubersuggest**
  ("Find keywords and SEO insights") + ZoomInfo/Lusha ("lihat lainnya") — ⚠️ **3 connector ini
  relevan langsung ke [[project_medsos_agent]]** kalau suatu saat mau sambungkan ChatGPT ke
  analitik medsos/SEO Go Go Bud secara resmi (bukan scraping).
- **(kategori edukasi)**: Explain Video Generator, Acumen by Talarion, SciSpace, Kahoot! (+
  Scite/Quizlet, "lihat lainnya").
- **Penelitian Ilmiah**: Undermind, Tamarind Bio, Boltz, Inductive Bio.
- Setiap kartu punya tombol **"+"** (install langsung dari list, belum dicoba — kemungkinan minta
  OAuth pihak-3).
- **Pencarian jalan via query param URL**: `chatgpt.com/plugins?q=<keyword>` (terverifikasi
  `?q=youtube` → tampil kategori "Publik": YouTube Conversation, Yaps Video Captions, vidIQ).
  Field bisa diisi via RDP `HTMLInputElement` native setter + dispatch event `input` (dokumentasi
  teknik di §10.9e).

**e) "Mode pengembang"** ⚠️ **halaman berisiko tinggi, badge merah "RISIKO LEBIH TINGGI"** — 3
toggle SEMUA OFF di akun ini:
| Toggle | Status | Deskripsi |
|---|---|---|
| Mode pengembang | OFF | "Memungkinkan Anda menambahkan konektor **tidak terverifikasi** yang dapat memodifikasi atau menghapus data secara **permanen**. Risiko ditanggung sendiri." |
| Terapkan CSP dalam mode developer | OFF | "Saat diaktifkan, aplikasi mode pengembang tanpa CSP yang dideklarasikan akan mendapatkan CSP default terbatas... alih-alih akses jaringan tanpa batas." |
| Aktifkan otorisasi kode perangkat untuk Codex | OFF | "Gunakan masuk kode perangkat untuk lingkungan headless atau jarak jauh... **kode perangkat dapat di-phishing, jangan pernah membagikannya**." |

Plus section terpisah **"Masuk aman dengan ChatGPT"** ("Sign in with ChatGPT" — OAuth SSO OpenAI
ke situs/app pihak-3): *"Anda belum menggunakan ChatGPT untuk masuk ke situs web atau aplikasi
apa pun."* — kosong, belum pernah dipakai akun ini.

**Cara reusable isi search field via RDP (dipakai utk `?q=youtube` di atas), teknik ini WAJIB
utk React-controlled input yang tak merespons `.value=` biasa:**
```js
const input = document.querySelector('input[type="text"], input[type="search"]');
const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
setter.call(input, 'kata kunci');
input.dispatchEvent(new Event('input', {bubbles:true}));
```

## 10.10 Sub-halaman Penyimpanan (Storage) — File & Gambar (2026-09-08)

Tap "File" ATAU "Gambar" di tab Penyimpanan (§10.3h) **sama-sama pindah ROUTE PENUH** ke
**`chatgpt.com/library`** (bukan sub-panel modal) — parameter `?tab=images` atau `?tab=files`
membuka **halaman "Pustaka" (Library) pre-filtered**. Ini KONFIRMASI arsitektur: menu
"Penyimpanan→Gambar/File" BUKAN fitur terpisah, cuma pintu masuk ke halaman Library yang sama
dengan item sidebar "Pustaka" (§4).

**Struktur halaman Library:**
- Header "Pustaka" + tombol **"Baru ⌄"** (buat konten baru, dropdown — isi belum digali).
- Kotak pencarian "Cari".
- 3 tab filter: **Semua / Gambar / Dokumen** (pill selector).
- Toolbar kanan: ikon filter (`≡` corong) + ikon ganti tampilan list/grid (`☰•••`).
- Kolom "Nama" (header tabel — menunjukkan mode tampilan LIST aktif; ganti ke grid via ikon
  toolbar, belum dicoba).
- **State kosong** (akun ini, 0 gambar/0 file sesuai §10.3h): ikon kaca-pembesar + teks **"Tidak
  ditemukan file"**.

**Kesimpulan:** akun `clawapp810` benar-benar belum pernah generate gambar atau upload
dokumen — konsisten dgn plan Free, `0 B / 512 MB`, dan riwayat 6 percakapan yang semuanya
teks (VN editing, ide konten, dst).
