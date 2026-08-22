# Peta Otomatisasi Canva (RN7)

> Pemetaan dimulai 2026-08-22 di RN7 (crDroid A14, 1080x2340, `com.canva.editor` v2.372.0). Akun `warungbudina@gmail.com`, anggota (Member, bukan admin) tim Bisnis "team rmi 437" — lihat [[project_redmi_vn_node]] §login. Dokumen ini LIVING DOCUMENT, diperbarui bertahap (pola sama `vn-automation-map.md`).

## 0. Fondasi teknis — arsitektur render CAMPURAN (penting sebelum baca sisanya)

Canva **BUKAN satu jenis render seragam** seperti VN (murni Lynx). Ditemukan 2 lapisan berbeda via `uiautomator dump`:

1. **Layar wrapper/native di luar editor** (mis. Beranda `HomeXV2Activity`) — **accessibility tree NYARIS KOSONG** (hanya ~8 node, 0 teks, 0 content-desc, 1 clickable) meski elemen terlihat jelas di layar. Kemungkinan besar dirender via Skia/Canvas kustom atau surface non-standar. **Screenshot+koordinat WAJIB** untuk layar-layar ini, sama seperti Lynx VN.
2. **Layar Editor** (`EditorXV2Activity`) — **accessibility tree KAYA** (90+ node, banyak `text=` dgn label Indonesia jelas: "Beranda", "File", "Ubah ukuran", "Unduh", "Template", "Elemen", dst) dengan `bounds` akurat. Ini tampak seperti WebView dgn ARIA label yg di-bridge ke Android accessibility (konsisten dgn arsitektur "crossplatform" Canva — nama package activity `com.canva.crossplatform.*`). **Selector by-text (Appium `UiSelector().text(...)`) JALAN dan LEBIH ANDAL drpd koordinat murni** di dalam Editor.

**Kuirk lama terkonfirmasi ulang:** teks aksesibilitas **"Anda sedang offline"** muncul di HAMPIR SEMUA dump layar Editor walau internet sehat — string basi bawaan, abaikan (sudah dicatat di [[project_redmi_vn_node]]).

**Aktivitas utama teridentifikasi:**
- `com.canva.app.editor.splash.SplashActivity` — launcher, redirect cepat ke Home/Login.
- `com.canva.crossplatform.home.feature.v2.HomeXV2Activity` — Beranda/Desain Anda/Template/Lainnya (tab bawah).
- `com.canva.crossplatform.editor.feature.v2.EditorXV2Activity` — editor kanvas penuh (kaya aksesibilitas, lihat di atas).

## 1. Home (`HomeXV2Activity`) — 4 tab bawah

Bottom nav (koordinat native 1080×2340, TANPA faktor skala — verifikasi via screenshot langsung, bukan hasil `Read` yg kadang di-scale untuk ditampilkan ke Claude):
- **Beranda** (rumah)
- **Desain Anda** (folder, DEFAULT tab saat app dibuka) — list "Desain Terbaru" + "Semua Item" (termasuk folder "Unggahan"), tiap card py menu "..." (3-titik) + info Pribadi/dimensi piksel.
- **Template** — belum dieksplorasi detail sesi ini (lihat §6 utk sisa kerja).
- **Lainnya** — belum dieksplorasi detail sesi ini.

Tab "Desain Anda" py filter chip: **Jenis / Kategori / Pemilik / Tanggal** + search bar "Cari desain, folder, dan unggahan" + tombol "+" (buat baru) di pojok kanan-atas header "Semua proyek" (dropdown chevron di sebelahnya, kemungkinan switch antar tim — RELEVAN krn akun ini py multi-tim, lihat [[project_redmi_vn_node]]).

**Tap card desain → langsung masuk `EditorXV2Activity`** (bukan preview dulu).

## 2. Editor (`EditorXV2Activity`) — struktur utama

### 2.1 Top bar (5 elemen, bounds dari dump)
| Label aksesibilitas | Bounds | Fungsi |
|---|---|---|
| Beranda | [7,78][118,186] | kembali ke Home (autosave dulu, ada notice "Perubahan akan disimpan secara otomatis") |
| (ikon "...") | ~[560,68][620,196] | menu opsi lain (belum dieksplor) |
| (ikon duplikat/copy) | ~[650,68][710,196] | duplikat desain (belum dieksplor) |
| File | [619,78][727,186] | menu file (rename/download/dsb — tumpang tindih posisi dgn ikon2 lain, perlu verifikasi ulang koordinat pasti) |
| Ubah ukuran | [735,78][842,186] | resize kanvas ke rasio/ukuran lain |
| Unduh | [850,78][958,186] | export/download langsung |
| Semua Opsi Publikasi | [966,78][1073,186] | share/publish (jaringan sosial, link, dsb) — BELUM dieksplor detail |

*(Catatan: bounds "File" dari accessibility-dump kemungkinan label utk salah satu dari 3 ikon kanan yg terlihat di screenshot — "...", ikon-duplikat, unduh↓, share↑. Perlu verifikasi ulang tap-per-tap sesi berikut utk memastikan pasangan label↔ikon visual yg benar.)*

### 2.2 Bottom toolbar (10 tool, scrollable horizontal) — DAFTAR LENGKAP
Urutan asli (dari kiri): **Template · Elemen · Teks · Galeri · Merek · Unggahan · Alat · Proyek · AI Canva · Aplikasi**

Toolbar OTOMATIS SCROLL supaya tool aktif berada di posisi yg berbeda tiap kali dibuka (bukan posisi tetap) — **JANGAN HARDCODE koordinat tool berdasar 1 screenshot, selalu dump ulang / screenshot ulang tiap sesi sebelum tap.**

Bounds native contoh (1 snapshot, TIDAK tetap krn auto-scroll):
```
Galeri    [65,2110][236,2281]
Merek     [259,2110][430,2281]
Unggahan  [454,2110][627,2281]
Alat      [651,2110][821,2281]
Proyek    [845,2110][1018,2281]
```

#### a) Template
Belum dieksplorasi isi panelnya sesi ini (baru bottom-nav Home yg py tab "Template" terpisah, kemungkinan konten mirip). **TODO sesi depan.**

#### b) Elemen — PALING KAYA, sudah dipetakan detail
- Search bar AI generatif: **"Jelaskan elemen ideal Anda"** (+ tombol mic dikte suara) — beda dari search biasa.
- Tombol **"Buat"** (dgn dropdown chevron, ikon gambar+bintang = generate elemen via AI) bersebelahan tombol **"Cari"** (search biasa, ungu solid).
- **"Direkomendasikan untuk Anda"** — carousel elemen (quote-mark shapes dsb), sebagian ber-badge mahkota (Pro/berbayar).
- **"Telusuri kategori"** — grid 14 kategori: **Bentuk, Grafis, Animasi, Foto, Video, Audio, Bagan, Formulir, Sheets, Tabel, Bingkai, Kisi, Rancangan, 3D**.
  - Tap kategori → halaman sub-kategori (contoh dipetakan: **Animasi** → "Rekomendasi ajaib" + baris per-jenis "Animasi—Panah", "Animasi—Kata", "Animasi—Makanan", "Animasi—Bentuk", "Animasi—Emoji" dst, tiap baris scrollable horizontal, banyak item ber-badge mahkota).
  - **Foto** = kategori yg sudah dikonfirmasi py pencarian stok bawaan tanpa setup (lihat [[feedback_canva_stock_photo_native]]) — BELUM di-tap ulang sesi ini utk verifikasi UI terkini (salah tap ke Animasi), tapi fungsi dasarnya sudah terverifikasi valid dari sesi lampau.

#### c) Teks — sudah dipetakan detail
- Search **"Cari font dan kombinasi"**.
- **"Tambahkan kotak teks"** (tombol utama ungu).
- **"Tulisan Ajaib"** (AI Magic Write — generate teks dari prompt, ikon pena+kilau).
- Notice **"Kit Merek: Tidak ada font merek yang ditetapkan"** (konsisten Brand Kit kosong, akun Member).
- **"Gaya teks default"**: 3 preset siap-pakai — Tambahkan judul / Tambahkan subjudul / Tambahkan sedikit teks isi.
- **"Teks dinamis"**: "Nomor halaman" (auto page-number field).
- **"Aplikasi"** carousel (integrasi pihak-ketiga/App Canva, belum dieksplor isinya — placeholder abu saat screenshot, masih loading).

#### d) Galeri
Tab kamera-roll/media picker — BELUM dieksplorasi isi detailnya sesi ini (icon kamera di toolbar). **TODO.**

#### e) Merek (Brand Kit) — dikonfirmasi ulang KOSONG
- Header "Semua aset" ← dropdown "Kit Merek".
- Card kosong bergambar ikon tas+tanda-tanya: **"Dapatkan bantuan untuk pengaturan Kit Merek — Minta admin untuk menambahkan semua aset merek di satu tempat..."** + tombol "Tampilkan siapa yang dapat saya tanyai" (link ke daftar admin tim).
- **Konfirmasi ulang: akun ini (Member) TAK BISA isi Brand Kit sendiri**, cocok temuan lama [[project_redmi_vn_node]].

#### f) Unggahan — sudah dipetakan
- Search **"Cari berdasarkan kata kunci, tag, atau warna"**.
- **"Unggah file"** (tombol utama ungu) + menu "..." di sebelahnya (opsi tambahan, belum dieksplor).
- **"Rekam diri Anda"** (record webcam/selfie langsung ke desain — fitur menarik utk automasi konten personal).
- Tab **Gambar / Folder**.
- Menampilkan 2 desain unggahan lama (`Motivasi Kesehatan Kartu 1 & 2`, hasil convert Figma→Canva sesi lampau — lihat [[project_figma_api_key]]).

#### g) Galeri — sudah dipetakan + TEMUAN KEAMANAN
- Dropdown filter **"Terbaru"**.
- Tombol **"Kamera"** (ambil foto langsung ke desain).
- Grid media dari **MediaStore device** (bukan cloud Canva) — pola `content://media/external/images/media`.
- **⚠️ TEMUAN KEAMANAN (2026-08-22): panel ini menampilkan screenshot LAMA berisi halaman akun sensitif** (`hf1.png`/`hf2.png`/`hf3.png` di `/storage/emulated/0/` root — screenshot "Access Tokens" Hugging Face akun `warungbudina`, sisa sesi mapping sebelumnya yg simpan via `screencap -p /sdcard/...` bukan via `exec-out` off-device). Karena file itu ADA di galeri device, **APAPUN app dgn izin media (termasuk Canva) bisa melihatnya** lewat picker seperti ini. **✅ SUDAH DIBERSIHKAN sesi ini** (`rm` + `content call scan_volume`). **Pelajaran permanen: screenshot on-device (`adb shell screencap -p /sdcard/...`) HARUS dibersihkan/di-`rm` setelah dipakai, JANGAN biarkan menumpuk di root `/sdcard/`** — beda dgn `adb exec-out screencap | > localfile` yg aman (tak pernah mendarat di storage device sama sekali, itu metode yg dipakai sesi mapping Canva ini).

#### h) Alat, Proyek, Aplikasi — BELUM dieksplorasi isinya sesi ini (TODO sesi depan).

#### i) AI Canva — sudah dipetakan
Bottom-sheet chat AI kontekstual thd desain aktif:
- Judul **"Desain ini mau kita apakan?"**
- 2 chip saran: **"Desain ulang halaman ini"** (ikon kilau) / **"Tambahkan latar belakang"** (ikon gambar+, teks terpotong "Tambahkan latar...").
- Input bebas **"Jelaskan ide Anda"** + tombol mic (dikte) + tombol "+" (lampirkan, belum dieksplor — kemungkinan attach gambar referensi).
- **BEDA dari "Buat" AI di panel Elemen** — ini scope-nya SELURUH desain/halaman (redesign/layout), bukan cuma generate 1 elemen.

## 3. Temuan lintas-sesi (konsolidasi dari memori lama, relevan utk mapping ini)
- **Login:** hanya via Email+OTP, Google Sign-In gagal bersih (RN7 tanpa GMS) — lihat [[project_redmi_vn_node]] §detail alur lengkap.
- **Tim & role:** akun ini Member (bukan admin) di tim Bisnis "rmi 437" (~50 anggota) — kredit AI jalan tanpa paywall utk tim ini, tapi Brand Kit terkunci admin-only (dikonfirmasi ulang §2.2e), daftar anggota tim tak terlihat dari mobile sbg Member.
- **Convert Figma→Canva:** pipeline `/v1/images?ids=0:1`+crop PIL+adb-push+"Unggah" TERBUKTI jalan (lihat [[project_figma_api_key]]) — hasilnya persis 2 desain yg terlihat di §1/§2.2f sesi ini.

## 4. TODO sesi berikutnya (prioritas)
1. Tab **Template** (Home + toolbar Editor) — struktur pencarian/kategori template siap-pakai.
2. Tab **Lainnya** di Home — kemungkinan berisi Settings/Akun/Brand Hub/Apps.
3. **Alat, Proyek, Aplikasi** toolbar — 3 tool paling belum tersentuh (bounds selalu `[0,0][0,0]` saat tak terlihat di viewport — WAJIB scroll toolbar dulu sebelum tap, lihat §2.2).
4. Top-bar kanan: verifikasi ulang pasangan ikon↔fungsi (File/duplikat/Ubah ukuran/Unduh/Semua Opsi Publikasi) via tap-per-tap, bukan cuma baca label dump.
5. Alur **export/publish penuh** (format file, resolusi, tujuan publish — IG/FB/link/dll) via "Semua Opsi Publikasi".
6. Verifikasi ulang kategori **Foto** di Elemen (sempat salah-tap ke Animasi sesi ini).
7. Cek dropdown **"Semua proyek"** di Home (kemungkinan switch tim/workspace — penting krn akun multi-tim).
8. **Toolbar bottom TIDAK py posisi tetap** (auto-scroll ke tool aktif) — kalau bikin orchestrator otomatis ke depan, WAJIB dump/screenshot ulang tiap langkah sebelum tap, JANGAN hardcode urutan koordinat dari 1 snapshot (beberapa kali salah-tap sesi ini krn ini).
9. Rutin **audit & bersihkan `/sdcard/*.png` root RN7** dari sisa `screencap -p` on-device — kebocoran nyata ditemukan+ditutup sesi ini (lihat §2.2g), berpotensi berulang kalau device-mapper agent lain pakai metode sama tanpa cleanup.
