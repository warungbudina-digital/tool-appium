# Peta Otomasi — Claude (web) di RN7 via Fennec

**Device**: Redmi Note 7 (`lavender`), crDroid 14, layar **1080 × 2340**
**Akses**: `adb -s 10.66.66.6:5555 ...` (WireGuard `10.66.66.6`)
**Target**: `claude.ai` di browser **Fennec** (`org.mozilla.fennec_fdroid`)
**Akun**: `clawapp810@gmail.com` (nama tampil **"Claw"**, avatar huruf **"C"**), **plan Free**, dibuat
baru 9/9 via OAuth Google — SAMA persis akun dgn ChatGPT & Gemini di RN7 ini.
**Tanggal pemetaan**: 2026-09-09 (setup + pemetaan super-detail sekaligus, satu sesi)

> ⚠️ **Ini web (`claude.ai`), bukan app Claude native** — belum pernah dicoba app native di RN7,
> tapi kemungkinan besar sama nasibnya dgn ChatGPT/Gemini (butuh Play Integrity/GMS yg absen di
> crDroid tanpa GApps). Pola dari awal langsung pilih jalur web via Fennec, sama spt 2 AI lain.

---

## 0. Setup akun (reusable, langkah lengkap login GRATIS via Google OAuth)

Tak ada akun Claude sebelumnya utk `clawapp810@gmail.com` → alur ini bikin akun BARU sekaligus login,
**tanpa perlu isi password sama sekali** (sesi Google `accounts.google.com` sudah aktif di Fennec dari
setup ChatGPT/Gemini sebelumnya):

1. Buka `claude.ai` → auto-redirect ke `/login` → klik **"Lanjutkan dengan Google"**.
2. Muncul dialog native Fennec **"Izinkan situs ini terbuka?"** (utk `accounts.google.com/oauth2/...`)
   → tap **"Izinkan"** (cari bounds via `uiautomator dump`, teks TAK BERUBAH dari kasus sebelumnya).
3. Tab baru terbuka: **account chooser** Google (`accounts.google.com/v3/signin/accountchooser`) —
   krn sesi sudah ada, langsung tampil `clawapp810@gmail.com` (nama "claw app2") tanpa perlu password.
   Klik nama akun via `<div>` (bukan `<a>`/`<button>` — cari via `closest('div[role=link],div[jsaction],li,button,a')`).
4. Halaman **consent OAuth** (`/signin/oauth/v3/consent`) — review scope (nama+foto profil, email) →
   klik **"Lanjutkan"**.
5. Redirect balik ke `claude.ai/onboarding` — **akun BARU otomatis dibuat**, lanjut wizard 5 layar:
   - **"Mari buat akun Anda"** — centang checkbox pertama (ToS 18+, WAJIB), checkbox kedua (promo
     email) DIBIARKAN OFF → klik **"Buat akun"**.
   - **Pemilihan paket** (Free/Pro/Max) — klik **"Gunakan Claude gratis"** utk tetap Free.
   - **Promo app mobile** — klik **"Lewati"** (skip, RN7 pakai web saja).
   - **Info data-usage** (training data notice, tanpa toggle di layar ini) — klik **"Lanjutkan"**.
   - **"Siapa namamu?"** — isi nama tampilan (dipakai: **"Claw"**, konsisten dgn ChatGPT/Gemini) via
     native `HTMLInputElement` value-setter+`dispatchEvent('input')` (input React-controlled) →
     **"Lanjutkan"**.
   - **"Apa jenis pekerjaan Anda?"** — opsional, klik **"Atur nanti"** utk skip.
6. Landing di `claude.ai/new` — chat utama, sapaan acak ("Halo, si burung hantu"/"Halo, kamu!" —
   greeting bervariasi tiap load), akun **"C Claw · Free"** di sidebar bawah.

**Verifikasi:** round-trip kirim/baca via RDP (lihat §1) + `#settings/account` → "Sesi aktif" cuma
1 baris "Firefox Mobile (Android) · Saat ini · Denpasar, Bali, ID" — sesi bersih, akun genuinely baru.

---

## 1. Selector KUNCI — kirim & baca pesan

| Elemen | Selector | Catatan |
|---|---|---|
| Input prompt | `.ProseMirror` (div `contenteditable`) | Tiptap/ProseMirror — **BUTUH trik seleksi-range** (spt ChatGPT, BEDA dari Gemini yg cukup focus+insertText polos) |
| Tombol kirim | `[data-testid="chat-input-send"]` (aria-label `"Kirim pesan"`) | |
| Pesan user | `[data-testid="user-message"]` | teks user murni, tanpa prefix |
| Baris percakapan (user+asisten) | `[data-testid="transcript-row"]` | tiap row = 1 giliran; row TANPA `user-message` di dalamnya = respons Claude |
| Attach file/konektor | `[data-testid="chat-input-attach"]` (aria `"Tambahkan file, konektor, dan lainnya"`) | |
| Model selector | `[data-testid="model-selector-dropdown"]` (aria `"Model: <nama model>"`) | lihat §2 |

**Resep isi input (WAJIB pola seleksi-range, sama persis ChatGPT — beda dari Gemini):**
```js
(function(){
  var el = document.querySelector('.ProseMirror');
  el.focus();
  var sel = window.getSelection();
  var range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('insertText', false, 'teks prompt di sini');
})()
```
⚠️ **Jebakan teruji: `execCommand('insertText')` TANPA seleksi-range dulu GAGAL SENYAP** (input
`.ProseMirror` cuma keisi `"\n"` kosong) — beda dari Gemini yg `.ql-editor` (Quill) bisa langsung
`focus()+insertText` tanpa trik ini. **Jangan asumsikan semua editor contenteditable app AI perilakunya
sama, selalu verifikasi `el.innerText` setelah insert sebelum lanjut kirim.**

**Baca jawaban Claude (reusable):**
```js
(function(){
  var rows = document.querySelectorAll('[data-testid="transcript-row"]');
  var last = rows[rows.length-1];
  return last.innerText; // format: "Claude merespons: <preview>\n\n<jawaban lengkap>"
})()
```
Prefix jawaban: `"Claude merespons: <preview pendek>\n\n<jawaban penuh>"` — mirip pola Gemini
("Gemini berkata") & ChatGPT ("ChatGPT bilang"), strip 1 baris pertama kalau perlu teks murni.

**Round-trip TERUJI LIVE:** "Halo Claude, ini tes koneksi pertama dari RN7 via Fennec..." → balasan
asli: *"Halo RN7! Koneksi berhasil — pesanmu diterima dengan baik lewat Fennec. 👍 Ada yang bisa
dibantu?"*

---

## 2. Model selector — daftar lengkap (per 9/9, akun Free)

Klik `[data-testid="model-selector-dropdown"]` → dropdown penuh:

| Model | Status di Free | Deskripsi tampil |
|---|---|---|
| **Fable 5.1** | 🔒 Pro/Max | "Untuk tantangan terberat Anda" |
| **Opus 5** | 🔒 Pro | "Untuk tugas kompleks" |
| **Sonnet 5** | ✅ tersedia | "Paling efisien untuk tugas sehari-hari" — **default akun ini** |
| **Haiku 4.5** | ✅ tersedia | "Tercepat untuk jawaban cepat" |

**Sub-kontrol per model:**
- **Upaya** (effort): Rendah / Sedang (bawaan) / Tinggi / Ekstra / Maks — level tertinggi berlabel
  peringatan *"Penggunaan 3.5× atau lebih"*.
- **Pemikiran** (extended thinking): toggle *"Berpikir untuk tugas yang lebih kompleks"*.

**"Model lainnya" (legacy, expand terpisah):** Fable 5, Opus 4.8, Opus 4.7, Opus 4.6, Opus 3,
Sonnet 4.6, dst — semua ditandai upgrade-required kecuali yg disebut di tabel atas. Footer: *"Fable
5.1 disertakan dalam paket Max, atau tersedia dengan kredit penggunaan di Pro."*

---

## 3. Chat vs Cowork (toggle atas input)

Dua mode kerja terpisah, TAPI **"Cowork" adalah fitur Pro/Max** — klik langsung memicu modal upsell
native:
> **"Jangan sekadar mengobrol. Cowork."** — *"Dengan Cowork, Claude menangani tugas kompleks secara
> mandiri. Claude dapat mengatur file, menyusun dokumen, dan lainnya."*
> - Arahkan Claude ke folder dan biarkan bekerja
> - Berjalan di latar belakang saat Anda melakukan hal lain
> - Claude akan menghubungi saat memerlukan masukan Anda
>
> Tombol: **"Nanti"** (dismiss) / **"Tingkatkan"** (upgrade).

Modal ini **native-feel TAPI sebenarnya WebView** (tombol `.click()` via RDP bekerja normal, tak
perlu `uiautomator`).

---

## 4. Chip mode (Tulis/Belajar/Kode/Urusan pribadi/Pilihan Claude)

⭐ **Beda arsitektur dari Gemini:** chip-chip ini **BUKAN mode-toggle persisten** (spt Deep
Research/Canvas Gemini yg pasang "pill" di input) — klik chip cuma **filter daftar prompt contoh**
di bawahnya (mis. klik "Tulis" → muncul "Mengembangkan profil karakter", "Menulis ringkasan
eksekutif", dst). Tak ada state yg berubah di composer, murni UI kategori saran.

---

## 5. Sidebar: Proyek / Artefak / Kode

| Item | URL | Status Free |
|---|---|---|
| **Proyek** | `/projects` | ✅ tersedia — *"Unggah materi, atur instruksi khusus, dan kelola percakapan dalam satu tempat."* Tombol "Proyek baru". Kosong di akun ini. |
| **Artefak** | `/artifacts` | ✅ tersedia — galeri artefak yg pernah dibuat. *"Wujudkan aplikasi, permainan, templat, dan perangkat dari ide menjadi kenyataan."* Kosong (belum pernah generate artefak berdiri-sendiri via galeri, tapi fitur artefak INLINE di chat tetap jalan — lihat §7 Kemampuan). |
| **Kode** | `/upgrade?feature=code&returnTo=%2Fcode` | 🔒 **Pro-only, auto-redirect ke halaman harga** — klik langsung dilempar ke `/upgrade`, tak ada preview apa pun di Free. Ini = "Claude Code" (coding agent langsung di codebase). |

---

## 6. Sesuaikan (`/customize`) — Skills / Konektor / Plugin

Tiga tab (masing2 py sub-tab "Milik Anda"/"Jelajahi"):

### 6a. Skills (`/customize/skills/discover`)
Marketplace skill pihak-1 & pihak-3. Contoh isi (per 9/9, berubah-ubah krn marketplace hidup):
- **Data** (dari Anthropic) — *"Query, chart and explain your data — SQL, spreadsheets and
  dashboards in one place."*
- **Qodo Standards** — Qodo rules discovery+standards administration.
- **ActiveCampaign** — marketing automation/CRM/email.
- **Security Guidance** — security review kode-hasil-Claude (pattern-based warning, LLM diff
  review, agentic commit reviewer — deteksi injection/XSS/SSRF/hardcoded-secrets/25+ kelas
  vulnerability lain).
- **Unity** — plugin resmi Unity utk game dev.
- **learn** — skill built-in utk mode "pembelajaran intelektual" (beda dari sekadar minta tugas
  selesai) — trigger: "teach, explain, ELI5, walk me through, quiz me, flashcards", dll.

### 6b. Konektor (`/customize/connectors/directory`)
⭐ **Sangat relevan ekosistem user** — direktori app pihak-3 yg bisa dihubungkan Claude:
**Google Drive** (search/read/upload file) · **Gmail** (draft/summarize/search inbox) ·
**Google Calendar** · **Canva** (search/create/autofill/export desain — user SUDAH pakai Canva
lewat ChatGPT-RN7, kini ada opsi sama via Claude) · **Microsoft 365** (SharePoint/OneDrive/
Outlook/Teams) · **Notion** · **Figma** (generate diagram+kode dari konteks Figma — user PUNYA
token API Figma tercatat di memori lain) · **Slack** · **Atlassian Rovo** (Jira+Confluence) ·
**HubSpot** · **Asana** — belum dites hubungkan satu pun (di luar scope pemetaan awal).

### 6c. Plugin (`/customize/plugins/discover`)
**Isi IDENTIK dgn tab Skills** (Data/Qodo Standards/ActiveCampaign/dst sama persis) — kuat dugaan
"Plugin" = nama lama, "Skills" = rebrand, dua tab cuma alias ke katalog yg sama.

---

## 7. Setelan (`#settings/<tab>`) — pola URL-hash SAMA PERSIS ChatGPT

Buka via avatar `[data-testid=user-menu-button]` → **"Pengaturan"**. 11 tab:
`Umum` · `Akun` · `Privasi` · `Penagihan` · `Kemampuan` · `Memori` · `Refleksi` · `Waktu dan fokus`
· `Claude Code` · `Skills` · `Konektor` · `Plugin` (3 terakhir = alias langsung ke §6).

⚠️ **Tab-button TIDAK match filter `children.length===0`** (beda dari pattern ChatGPT/Gemini biasa)
— tab ini py child nested (icon+label), **cari via** `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim()==='<Nama Tab>')` **langsung**, bukan cari leaf-text dulu.

### 7a. Umum
Profil (Avatar/Nama lengkap/deskripsi pekerjaan), **"Instruksi untuk Claude"** (custom instructions,
berlaku across akun+Cowork), Preferensi Tampilan (**Font chat: "Anthropic Serif"**, toggle Gerakan/
motion-reduction: Sistem/Dikurangi), **Suara** (TTS: Bahasa=Inggris, **Gaya="Buttery"**,
Kecepatan=Normal — nama gaya suara yg unik, dicatat verbatim), Notifikasi (notif saat respons
selesai — berguna utk tugas lama).

### 7b. Kemampuan — TEMUAN PALING PENTING (keamanan)
- **Konektor**: "Muat alat saat diperlukan", "Pencarian konektor" (Claude bisa browse direktori
  konektor sendiri & tampilkan yg relevan), **"Ganti model saat pesan ditandai"** — kalau safety
  classifier tandai pesan, otomatis pindah model lain drpd macet total.
- **Visual**: Artefak, Artefak bertenaga AI (app/dokumen interaktif YANG MENJALANKAN Claude DI
  DALAM artefaknya sendiri), Visualisasi inline (chart/diagram langsung di chat).
- ⚠️ **"Eksekusi kode dan pembuatan file"** — *"Claude dapat mengeksekusi kode serta membuat dan
  mengedit dokumen, spreadsheet, presentasi, PDF, dan laporan data. Diperlukan untuk skills."*
- ⚠️⚠️ **"Izinkan akses jaringan keluar"** (nested di bawah eksekusi-kode) — *"Izinkan Claude
  mengakses package manager umum untuk menginstal paket dan library... **Pantau chat dengan cermat
  karena ini memiliki risiko keamanan.**"* — peringatan eksplisit dari Anthropic sendiri, WAJIB
  dicatat kalau nanti toggle ini diaktifkan.
- 7 checkbox ditemukan di tab ini, **state persis per-item belum dikonfirmasi 1:1** (kemungkinan
  besar Free-tier default: fitur dasar ON, akses-jaringan-keluar OFF — tapi VERIFIKASI VISUAL dulu
  sebelum menyimpulkan, jangan percaya urutan DOM mentah spt pelajaran lama Aplikasi-Terhubung
  Gemini).

### 7c. Memori
Toggle buat-memori-dari-obrolan, **"Sertakan topik sensitif dalam memori"** (kondisi kesehatan/
keyakinan agama, opt-in eksplisit terpisah), ⭐ **"Impor memori dari penyedia AI lain"** — *"Bawa
konteks dan data relevan dari penyedia AI lain ke Claude. Kami akan menyediakan prompt yang dapat
Anda gunakan untuk mengambil memori dari akun Anda yang lain."* + tombol "Mulai impor" (belum
dicoba — berpotensi relevan krn akun ini SEKARANG py ChatGPT+Gemini+Claude sekaligus, bisa
cross-import kalau user minta nanti).

### 7d. Privasi
Info kebijakan (link Pusat Privasi), toggle **Metadata lokasi** (kota/wilayah umum), toggle
**"Bantu tingkatkan model AI kami"** (opt-in training data dari chat+coding session), **Data Anda**:
Ekspor data / Chat yang dibagikan / Artefak yang dibagikan / File yang diunggah / Masukan Anda /
Preferensi memori — masing2 py tombol "Kelola" terpisah (belum digali per-item).

### 7e. Akun
**ID Organisasi**: `b2d91513-0a9a-49a2-9f1d-bd3f6d85fd57` (workspace personal, standar akun
individual). **Perangkat tepercaya**: kosong. **Sesi aktif**: cuma **1 baris** — "Firefox Mobile
(Android) · Saat ini · Denpasar, Bali, ID · 9 Sep 2026 23.44" — bersih, akun genuinely baru dibuat
sesi ini, belum ada device lain nyambung. Tombol "Hapus akun" juga ada di tab ini (JANGAN disentuh
tanpa izin eksplisit).

### 7f-g. Refleksi & Waktu dan fokus
⏳ **BELUM digali isinya** (di luar cakupan sesi ini, nama tab menarik — kemungkinan fitur
review-percakapan & time-management, khas Claude, TAK ADA padanan di ChatGPT/Gemini) — kandidat
kuat utk sesi pemetaan lanjutan kalau user minta.

---

## 8. Shortcut "Claude" ke Beranda (TERUJI, pola browser ⋮ sama — TAPI teks beda!)

⚠️ **JEBAKAN BARU dicatat 9/9:** teks menu berbeda dari ChatGPT/Gemini! Untuk `claude.ai`, item di
menu ⋮ browser bernama **"Tambahkan aplikasi ke layar Beranda"** (BUKAN "Tambahkan ke Beranda" polos
spt 2 situs lain) — `uiautomator dump` grep persis `"Tambahkan ke Beranda"` GAGAL nemu sampai teks
lengkap dikoreksi. **Pelajaran: JANGAN hardcode label menu browser lintas-situs, selalu grep teks
PARSIAL dulu (`grep "Tambahkan"`) kalau exact-match gagal, baru ambil label persisnya.**

Alur (sama strukturnya): ⋮ browser → "Lebih banyak" → **"Tambahkan aplikasi ke layar Beranda"** →
dialog konfirmasi Fennec (ikon generik **"AI"** placeholder, BUKAN logo sunburst asli Claude — beda
dari ChatGPT/Gemini yg dapat ikon asli, kemungkinan krn `claude.ai` blm expose manifest ikon PWA
custom lewat jalur ini, atau butuh dari halaman yg beda) → **"Tambahkan ke layar utama"** (Android
native). **Hasil: shortcut "Claude" muncul persis di sebelah ChatGPT & Google Gemini** di home.
Diverifikasi tap → langsung landing `claude.ai/new` dalam keadaan login.

---

## 9. Jebakan umum (ringkasan, konsisten dgn 2 AI lain)

- Pola sama ChatGPT/Gemini: `keyevent 4` di halaman teratas = keluar app, screenshot tampilkan tab
  FOREGROUND bukan tab RDP-target, `innerText` tab background bisa kosong — foreground-kan dulu via
  `am start` sebelum baca/screenshot.
- **Input `.ProseMirror` WAJIB trik seleksi-range** (beda dari Gemini `.ql-editor` yg lebih toleran)
  — SELALU verifikasi `el.innerText` sesudah insert, jangan asumsikan berhasil dari return value
  `execCommand` saja (selalu return `true` walau isi kosong).
- Tab settings di Claude py struktur DOM ber-child (icon+text), filter `children.length===0` yg
  biasa dipakai utk ChatGPT/Gemini **GAGAL** di sini — cari via `button.textContent.trim()` langsung.
- Label menu shortcut browser **beda per-situs** (`"Tambahkan ke Beranda"` vs `"Tambahkan aplikasi
  ke layar Beranda"`) — jangan hardcode, grep parsial dulu.

---

## Status pemetaan

✅ Setup akun (OAuth Google reuse, tanpa password) — **TERUJI PENUH**, reusable utk akun lain.
✅ Selector kirim/baca (§1) — **round-trip TERUJI LIVE**.
✅ Model selector lengkap (§2), Chat/Cowork (§3, Cowork=Pro-gated), chip-mode (§4, bukan toggle
persisten — beda arsitektur dari Gemini).
✅ Proyek/Artefak/Kode (§5) — Kode ternyata Pro-only auto-redirect.
✅ Sesuaikan: Skills/Konektor/Plugin (§6) — direktori Konektor SANGAT relevan (Canva/Figma/Drive/dll
sudah dipakai user di tempat lain).
✅ Setelan 5/11 tab digali detail (§7: Umum/Kemampuan/Memori/Privasi/Akun) — **temuan keamanan
penting**: toggle "akses jaringan keluar" py peringatan eksplisit dari Anthropic.
✅ Shortcut home — TERUJI, dgn jebakan label-menu-beda dicatat.
⏳ Belum: tab "Refleksi"+"Waktu dan fokus" (fitur unik blm ada padanan ChatGPT/Gemini), test nyata
Artefak/Skills/Konektor end-to-end (generate sesuatu, hubungkan Canva/Drive), "Impor memori dari
penyedia AI lain" (berpotensi menarik krn akun ini py 3 AI sekaligus), state toggle Kemampuan
per-item presisi, Penagihan tab. Lanjutkan digali kalau user minta fitur spesifik.
