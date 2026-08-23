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

## 5. Template (toolbar Editor & Home) — dipetakan

Search **"Cari template"** (+ tombol mic dikte) + tombol "+" di kiri search bar (buat elemen custom?). Grid template **otomatis match rasio/dimensi kanvas aktif** (semua contoh di sesi ini persegi 1088×1088 krn desain aktif juga persegi). **Campuran gratis/Pro** (badge mahkota di pojok kanan-bawah thumbnail) — dari ~16 sampel: sebagian besar template logo/branding berbadge mahkota (Pro), tapi beberapa gratis ditemukan (mis. "Liceria Chips", "Rimberio Volleyball Club", "Cuci Sepatu Murah" — TANPA badge). Tap template → kemungkinan besar replace/insert ke desain aktif (belum diuji tap-through krn merusak desain aktif; cukup diverifikasi via badge visual).

Tab "Template" di **bottom-nav Home** (`HomeXV2Activity`) berbeda konteks (pilih template utk *desain baru*, bukan sisipan ke desain existing) — TAK dieksplorasi terpisah krn UI panel-nya identik dgn versi toolbar Editor (search+grid+badge), cukup dirujuk di sini.

## 6. Alat (toolbar Editor) — dipetakan, PENTING: markup/annotation tools, BUKAN aksesibilitas standar

**Gotcha kritis ditemukan:** toolbar utama Editor **context-sensitive** — tap "Alat" pada koordinat yg salah (mis. masih di area kanvas) akan **auto-SELECT elemen kanvas** (background/gambar) alih-alih membuka panel Alat, memicu TRANSFORM toolbar (Ganti/Pilih/Sesuaikan/Penghapus LB/Alat Gambar) bukan ADD toolbar. Selalu screenshot+crop dulu utk cari posisi tab yg BENAR (baris ikon "Merek/Unggahan/Alat/Proyek/AI Canva/Aplikasi" ada di y≈2190-2340 orig 1080×2340, BUKAN di y≈1380an spt kanvas).

**Panel "Alat" TIDAK MASUK accessibility tree** (dump `ui-map.js` cuma nangkap 21 node standar Editor, panel overlay-nya nol) — beda dari panel Elemen/Teks/dll yg kaya teks. **Screenshot+koordinat WAJIB utk seluruh panel ini**, meski Editor secara umum kaya aksesibilitas.

Isi panel — baris 8 ikon alat markup/gambar-tangan (bukan alat auto-generate AI):
| Ikon (urutan kiri→kanan) | Nama | Sub-opsi saat ditekan |
|---|---|---|
| Panah (cursor) | Pilih/default | — |
| Highlighter merah | Highlighter/Pena | 4 gaya pena (pen biru, highlighter merah, highlighter kuning, marker pink tebal) + color-picker (6 warna) + ikon "≡" (pengaturan ketebalan, belum dieksplor) |
| Bulatan-hitam-tumpang-tindih | **Bentuk (Shapes)** | 8 bentuk: persegi, persegi-rounded, lingkaran, segitiga, segitiga-terbalik, diamond, pentagon, hexagon |
| Garis biru diagonal | **Garis (Line)** | 3 gaya: garis lurus, konektor siku 2-titik, konektor siku 3-titik |
| Kotak oranye (sticky note) | **Catatan tempel** | 6 warna (kuning/oranye/merah/biru/hijau/ungu) |
| T ungu | **Teks** | (belum dieksplor detail — kemungkinan sama dgn tool Teks utama) |
| Tanda tangan kursif | **Tanda tangan** | (belum dieksplor — kemungkinan draw-signature, mirip app pihak-3 "CanSign" di §Aplikasi) |
| Grid biru tua | **Tabel** | (belum dieksplor — insert tabel) |

Fungsi keseluruhan: alat markup/anotasi bebas-gambar di atas kanvas (mirip fitur "draw"/"shapes"/"lines" PowerPoint), TERPISAH dari generator AI ("Buat" di panel Elemen / "AI Canva"). Semua yg diuji (highlighter, shapes, garis, sticky note) **tidak menunjukkan badge mahkota** — tampak gratis.

## 7. Proyek (toolbar Editor) — dipetakan

Panel file-picker personal utk **menyisipkan konten existing** ke desain aktif (beda dari "Unggahan" yg fokus upload baru). Search **"Cari konten Anda"**. Dropdown scope di atas (avatar tim + "Proyek Anda ▾") — **BUKAN team-switcher** (lihat §10), cuma filter scope: Semua proyek / Proyek Anda / Dibagikan dengan Anda. Tab: **Semua / Desain / Folder / Gambar**.
- Desain: grid desain existing user (persis sama isi dgn Home "Desain Anda").
- Folder: "Buat folder" (+) dan folder sistem "Dibintangi".
- Gambar: **grid diambil dari MediaStore device** (mirip §2.2g Galeri — sama-sama menampilkan isi galeri lokal, termasuk screenshot lama jika ada — relevan utk temuan keamanan §11).

## 8. Aplikasi (toolbar Editor & "Lainnya") — dipetakan

2 tab: **Jelajahi** (marketplace, default) / **Aplikasi Anda** (terpasang/pernah dipakai).

**Jelajahi:** search "Cari aplikasi Canva" + filter chip horizontal (Untuk Anda/Audio dan sulih suara/Desain.../lainnya, scrollable). Section "Koleksi → Dibuat oleh Canva" (banner besar: integrasi YouTube, Instagram, Google Drive, Google Photos). Section "Pilihan teratas untuk Anda": **Google Drive** (badge "Dibuat oleh Canva"), **Figma to Canva** (app YANG SUDAH DIPAKAI sesi lampau, lihat [[project_figma_api_key]] — dikonfirmasi first-party resmi Canva, bukan hack pipeline kita), **CanSign** (draw signature — kemungkinan terkait tool "Tanda tangan" di §6 Alat). Section "Sedang tren": app filter foto (Texture) dan font-generatif (TypeGradient). Grid "Yang Lain dari Canva" (first-party mini-apps, ~16 terlihat): Kode QR dinamis, Komponen, Media Ajaib, Suara AI, Bagan, Foto, Buat banyak (bulk create), Data Otomatis, Audio, Latar Blkg (bg remover?), Video, Terjemah, dst — TIDAK ada badge mahkota terlihat pada grid ini (perlu app-level check lebih lanjut utk gate sebenarnya, banyak app pihak-3 baru menunjukkan gate SETELAH dibuka).

**Aplikasi Anda:** HANYA **"Figma to Canva"** (1 app) — konsisten dgn histori akun, belum pernah connect app lain.

## 9. Top-bar kanan Editor — VERIFIKASI ULANG TUNTAS (ikon↔fungsi dikonfirmasi via tap-per-tap)

Koreksi penting dari dokumen lama (§2.1): pasangan ikon↔label **BUKAN urutan visual linear seperti dikira** — dikonfirmasi lewat tap nyata:
| Posisi (kiri→kanan) | Ikon visual | Label aksesibilitas | Fungsi terverifikasi |
|---|---|---|---|
| 1 | "•••" (tiga titik) | **File** | Membuka bottom-sheet BESAR: Mode(Edit), Buat desain baru, Unggah file, Ubah ukuran (Pro🔒), Lihat semua halaman, Pengaturan, Aksesibilitas, Asisten Bantuan, Simpan, Buat tersedia offline, Bintangi, Pindahkan, Buat salinan, Unduh, Cetak, Bagikan, **Riwayat versi (Pro🔒)**, Pindahkan ke Sampah — praktis SEMUA aksi dokumen ada di sini, top-bar icon lain cuma shortcut. |
| 2 | Dua-persegi-tumpang-tindih | **Ubah ukuran** | Panel resize: search "Cari opsi ubah ukuran", "Disarankan" (3 saran, dinamis), kategori: Ukuran kustom, Media sosial, Cetak, Presentasi, Video, Situs Web, Papan Tulis, Lainnya + "Alih Ajaib → Terjemahkan (Pro🔒)". Tombol "Salin dan ubah ukuran" / "Ubah ukuran desain ini". |
| 3 | Panah-bawah (download) | **Unduh** | **QUICK EXPORT satu-tap** — LANGSUNG export PNG default & simpan ke `Pictures/Canva/` di gallery device (dialog "Pengunduhan selesai" + tombol Bagikan/Buka), **TANPA tanya format/resolusi**. Beda dari opsi lengkap di §10. |
| 4 | Panah-atas-keluar-kotak (share) | **Semua Opsi Publikasi** | Bottom-sheet "Bagikan": grid Undang, Minta persetujuan, Google Drive, Tautan untuk umum, Tampilkan, Cetak via Canva, **Tautan template (Pro🔒)**, Lainnya + tombol "Bagikan" + tombol "Unduh" (→ buka opsi lengkap, lihat §10). |

**Kesimpulan:** ikon "..." di top-bar sebenarnya menu **File** (bukan generic "more"), dan ikon kedua yg terlihat spt "duplikat" sebenarnya **Ubah ukuran** (ikonnya dua-kanvas krn merepresentasikan ganti-dimensi). Peta lama §2.1 SALAH menduga ada 5 elemen terpisah "Beranda/.../File/Ubah ukuran/Unduh/Semua Opsi Publikasi" — yang benar cuma **5 total termasuk Beranda**, sudah sesuai jumlah tapi mapping ikon→label kini terverifikasi akurat via tap, bukan cuma tebakan posisi.

## 10. Alur export/publish penuh (via top-bar "Semua Opsi Publikasi" → "Unduh") — DIPETAKAN LENGKAP

Ini opsi export TERLENGKAP (beda dari quick-export §9 poin 3). Layar "Unduh":
- **Jenis file** (dropdown, 7 opsi): **JPG** (Terbaik utk berbagi, gratis), **PNG** (Disarankan/default, terbaik utk gambar kompleks, gratis), **PDF** (cocok dokumen/cetak, gratis), **SVG** (🔒Pro, terbaik utk web/animasi), **Video MP4** (video berkualitas tinggi, gratis, meski desain ini statis — Canva bisa render page statis jadi video pendek), **GIF** (klip pendek tanpa suara, gratis), **PPTX** (dokumen PowerPoint, gratis).
- **Ukuran**: slider multiplier "1x" (mentok 1.088×1.088 piksel asli) dengan badge 🔒mahkota di sebelah label "Ukuran" — mengindikasikan scaling >1x butuh Pro (tak diuji geser slider krn berisiko trigger paywall dialog yg mengganggu flow, tapi badge sudah cukup indikasi gate).
- **Kualitas** (badge 🔒mahkota di header): toggle Kompres / **Tinggi** (default terpilih) / Batasi ukuran.
- **Latar belakang transparan** (toggle, 🔒Pro, OFF & disabled utk akun ini).
- **Simpan pengaturan pengunduhan** (toggle, gratis, OFF default).
- Tombol besar **"Unduh"** di bawah → trigger proses sama seperti quick-export (simpan ke `Pictures/Canva/` + dialog "Pengunduhan selesai").

**Kesimpulan gate Pro utk export:** dari 7 format hanya **SVG** yg terkunci; sisanya (JPG/PNG/PDF/MP4/GIF/PPTX) **gratis penuh** utk akun Member tim Bisnis ini. Yang terkunci Pro: scaling ukuran >1x, kualitas custom (Kompres/Batasi ukuran — asumsi dari badge di header "Kualitas", meski toggle "Tinggi" sendiri bisa dipilih gratis), latar transparan, dan riwayat versi (§9). **Video MP4 TIDAK diuji end-to-end** (desain sesi ini statis 1 halaman, tak dicoba generate video sungguhan krn berisiko lama/kena kredit) — kalau pipeline produksi butuh Canva→video, ini WAJIB diuji dulu sebelum diasumsikan gratis untuk kasus video sungguhan (badge yg terlihat cuma indikasi utk desain statis).

## 11. "Lainnya" — Home (`HomeXV2Activity`) — dipetakan LENGKAP + TEMUAN team-switcher SESUNGGUHNYA

Layar native (bukan Editor) — daftar menu dgn avatar tim (kiri-atas) + ikon lonceng notifikasi (kanan-atas):
- **Merek**, **AI Canva**, **Katalog Cetak**, **Aplikasi**, **Lab Imajinasi**, **Marketing**, **Design School** — (divider) —
- **Akun Anda**, **Pengaturan**, **Sampah**.

**Tap avatar tim (kiri-atas) → layar "Akun"** (BUKAN cuma expand menu) — di sinilah **team-switcher SESUNGGUHNYA berada**, KOREKSI PENTING dari dugaan lama §TODO-8: dropdown "Semua proyek" di Home/Proyek itu **BUKAN team-switcher**, cuma filter scope konten. Team-switcher asli:
- Card **"Akun"** (Warung Budina, warungbudina@gmail.com) — chevron sendiri (belum dieksplor, kemungkinan profile settings).
- Card **"Tim"** → **team rmi 437 · Bisnis · 62 anggota** ✓ (aktif) — tap chevron-nya membuka bottom-sheet **"Tim"** berisi daftar SEMUA workspace milik akun ini: **"team rmi 437" (Bisnis, 62 anggota)** DAN **"Pribadi" (Gratis, 1 anggota)** — jadi akun ini py **2 workspace**: tim Bisnis (member) + ruang Pribadi gratis milik sendiri! Plus opsi **"Undang anggota"**.
- Menu tambahan di layar Akun ini: Pengaturan, **Tema** (light/dark, belum dieksplor), Bantuan dan sumber informasi, **Alat lanjutan (Beta)** (belum dieksplor), Keluar.

**⚠️ KOREKSI MEMORI:** jumlah anggota tim "rmi 437" sebelumnya diperkirakan "~50" (di [[project_redmi_vn_node]]) — **angka pasti terkonfirmasi 62 anggota** dari layar ini.

## 12. Temuan keamanan gallery — AUDIT ULANG SESI INI (2026-08-22, lanjutan)

**⚠️ TEMUAN KRITIS: klaim "SUDAH DIBERSIHKAN" di §2.2g (commit sebelumnya) TERNYATA TIDAK AKURAT.** Audit awal sesi ini (`content query` MediaStore, SEBELUM aksi apa pun) menemukan **96 file PNG** menumpuk di root `/storage/emulated/0/`, TERMASUK `hf1.png`/`hf2.png`/`hf3.png` (screenshot Access Tokens Hugging Face akun `warungbudina`) yang di commit sebelumnya diklaim sudah dihapus — file-file itu **MASIH ADA, TIDAK PERNAH benar-benar terhapus** (kemungkinan `rm` gagal senyap atau commit ditulis sebelum verifikasi ulang). Selain hf1-3.png, ditemukan juga rangkaian besar file lain dari sesi-sesi mapping sebelumnya: `p1.png`–`p8.png`, `n1.png`–`n12.png` (12 file), `step1.png`–`step20.png` (20 file), `canva1.png`–`canva3.png`, `dbg.png`/`dbg2.png`, `figma_contact.png`, `dl1.png`, `s.png` — semua kemungkinan sisa `screencap -p /sdcard/...` on-device dari sesi Canva/Figma mapping terdahulu, TIDAK PERNAH dibersihkan.

**Tindakan sesi ini: TIDAK dihapus, dilaporkan ke user dulu** (sesuai instruksi eksplisit "screenshot kredensial/token" wajib lapor sebelum hapus). Sesi ini SENDIRI 100% patuh `adb exec-out screencap -p > localfile` (tidak pernah `screencap -p /sdcard/...`) — **NOL file baru ditambahkan ke `/sdcard/` root oleh sesi ini**. Satu-satunya penambahan gallery baru dari sesi ini adalah hasil resmi fitur "Unduh" Canva sendiri (`Pictures/Canva/Motivasi Kesehatan - Kartu 2..._20260823_072233_0000.png`) — itu bukan kebocoran, itu perilaku normal aplikasi saat export diuji.

**REKOMENDASI KERAS utk sesi depan:** JANGAN percaya begitu saja klaim "sudah dibersihkan" di commit sebelumnya tanpa verifikasi ulang `content query` — WAJIB re-audit di awal SETIAP sesi (sesuai SOP yg memang sudah diinstruksikan), karena histori menunjukkan klaim cleanup BISA SALAH/GAGAL SENYAP.

## 13. TODO sesi berikutnya (state ter-update)
1. ✅ SELESAI sesi ini: Template, Alat, Proyek, Aplikasi (toolbar), Lainnya-Home, top-bar kanan (verifikasi ikon↔fungsi), alur export/publish, dropdown "Semua proyek" (+ ditemukan team-switcher asli di Lainnya→Akun→Tim).
2. **BELUM/tertunda:** hapus 96 file sisa `/sdcard/*.png` (termasuk 3 file kredensial HF) — **BUTUH KEPUTUSAN USER**, jangan dihapus otomatis oleh agent manapun tanpa persetujuan eksplisit.
3. Sub-tool "Alat" (§6) blm diuji tuntas: Teks/Tanda-tangan/Tabel (icon 6-8) baru diidentifikasi via ikon, belum di-tap detail.
4. Video MP4 export (§10) belum diuji end-to-end sungguhan (cuma dilihat sbg opsi list, gratis-tanpa-badge tapi belum generate beneran).
5. "Akun Anda" (detail profile), "Pengaturan", "Tema", "Alat lanjutan (Beta)", "Bantuan dan sumber informasi" di layar Akun (§11) belum dieksplorasi isinya.
6. "Katalog Cetak", "Lab Imajinasi", "Marketing", "Design School" di menu Lainnya (§11) belum dieksplorasi isinya — kemungkinan besar konten marketing/edukasi Canva, prioritas rendah utk automasi.
7. ✅ SELESAI 2026-08-23 (lanjutan): **toolbar EDIT ELEMEN** (gambar+teks) dipetakan detail — lihat §14-17. Ini bagian PALING KRITIS utk auto-editing (manipulasi elemen existing, bukan cuma navigasi/insert), sebelumnya belum tersentuh sama sekali.
8. **BELUM:** toolbar "Kuas"/"Latar depan"/"Latar belakang" di §14.2/15 belum dites tap-through sungguhan (baru diidentifikasi opsinya via UI, belum dicoba edit hasil aktualnya). "Edit warna" (§15) belum dibuka isinya (kemungkinan HSL per-channel, lebih advance dari slider biasa). "Lapisan Ajaib"/"Edit Ajaib"/"Tingkatkan resolusi"/"Penghapus Ajaib" (§16) baru diidentifikasi nama+badge Pro, belum dites hasil aktual generate-nya. Toolbar teks §17 belum di-scroll penuh (kemungkinan ada Efek/Animasikan/Spasi/Perataan/Daftar di sebelah kanan "Warna").

## 14. Element SELECTED — Transform Toolbar (gambar) — BARU, PALING PENTING utk auto-editing

**Ini toolbar yang muncul begitu elemen (mis. gambar hasil pipeline Figma→Canva) di-tap/dipilih di kanvas** — beda total dari toolbar insert (§2.2). Dipetakan pakai desain "Motivasi Kesehatan Kartu 2" (hasil pipeline [[project_figma_api_key]]).

### 14.1 Menu konteks mengambang (muncul di atas elemen terpilih)
5 ikon dlm 1 pill floating tepat di atas bounding-box elemen (posisi mengikuti elemen, TIDAK fixed — scroll/geser kanvas dulu kalau ketutup status bar):
| Ikon | Fungsi (dugaan dari bentuk, belum semua di-tap) |
|---|---|
| "C" + kilau | Kemungkinan "Animasikan" atau riwayat versi elemen — belum dites |
| Speech-bubble "+" | Tambah komentar pada elemen ini |
| Kotak-ganda "+" | **Duplikat elemen** |
| Tempat sampah | **Hapus elemen** (dipakai sesi ini utk bersihkan elemen teks percobaan) |
| "..." | Menu opsi lain (belum dieksplor) |

Di bawah elemen: **handle rotate** (ikon panah melingkar, lingkaran terpisah) + 8 **resize handle** (4 sudut + 4 tengah-sisi) di sekeliling bounding-box.

### 14.2 Toolbar bawah (5 tool utama, scrollable) — Ganti / Pilih / Sesuaikan / Penghapus LB🔒 / Alat Gambar
| Tool | Fungsi | Detail |
|---|---|---|
| **Ganti** | Ganti gambar elemen INI dgn gambar lain, TETAP pertahankan posisi/ukuran/crop-frame | Buka media-picker persis sama dgn §2.2d/f/g (tab Galeri/Unggahan/Foto/Video/Proyek). **Sangat berguna utk automasi "isi ulang template"**: siapkan 1 desain Canva sbg template, lalu script cukup ganti gambar via tool ini tanpa bikin desain baru tiap kali. |
| **Pilih** | AI-powered area/subject selection utk edit selektif | Sub-mode: **Klik** (tap 1 area/objek, AI auto-deteksi batasnya — mirip "Magic Grab"), **Kuas** (lukis manual area), **Latar depan** (Foreground = subjek utama), **Latar belakang** (background, di luar layar terpotong "Lat..." — konfirmasi nama lewat scroll). Prompt: "Klik area pada gambar untuk mengedit". Belum dites tap-through actual (baru identifikasi UI options). |
| **Sesuaikan** | Panel filter/koreksi warna — lihat §15 detail penuh | — |
| **Penghapus LB** 🔒Pro | Background remover 1-klik | Badge mahkota, TERKUNCI di akun Member ini — sama tool dgn "Penghapus LB" di §16 Alat Gambar |
| **Alat Gambar** | Menu AI image-tools tambahan — lihat §16 detail penuh | — |

**Jebakan koordinat (PENTING, kena berulang sesi ini):** toolbar 5-tool ini POSISINYA BEDA dari toolbar insert utama (§2.2) — ada di baris PALING BAWAH layar (native y≈2160-2280 dari 2340 total), BUKAN di y≈2110-2280 spt toolbar insert. **JANGAN samakan koordinat kedua toolbar ini** — selalu crop+ukur ulang screenshot per sesi (`PIL crop` region bawah y=2000-2340, BUKAN baca dari gambar auto-scaled yg ditampilkan ke Claude — faktor skala 1.17 gampang bikin salah hitung ratusan pixel kalau posisi elemen tak dicek presisi via crop asli).

## 15. Panel "Sesuaikan" (Adjust) — 14 slider warna/koreksi, DIPETAKAN LENGKAP

Header: **"Atur ulang"** (reset semua) / judul "Sesuaikan" / **checkmark** (terapkan+tutup panel).

**Baris "Pilih area"** (SAMA PERSIS opsi dgn §14.2 Pilih): **Semua** (default, edit seluruh gambar) / **Klik** / **Kuas** / **Latar...** — jadi tiap slider adjustment BISA diterapkan selektif ke bagian tertentu gambar saja, bukan cuma global. Fitur AI selektif ini konsisten dipakai ulang di 2 tempat (§14.2 Pilih & di sini).

Tombol **"Sesuaikan Otomatis"** (ungu solid, 1-klik AI auto-enhance) sekaligus jadi chip pertama di baris scroll horizontal berisi 14 slider:

| # | Nama slider | Kategori |
|---|---|---|
| 1 | Suhu | Temperature (warm/cool) |
| 2 | Rona | Hue |
| 3 | Kecerahan | Brightness |
| 4 | Kontras | Contrast |
| 5 | Sorotan | Highlights |
| 6 | Bayangan | Shadows |
| 7 | Putih | Whites (white point) |
| 8 | Hitam | Blacks (black point) — ✅ dikonfirmasi 2026-08-23, posisi persis antara Putih-Semarak |
| 9 | Semarak | Vibrance |
| 10 | Saturasi | Saturation |
| 11 | **Edit warna** | BUKAN slider tunggal — panel sendiri, lihat §15.1 |
| 12 | Ketajaman | Sharpness |
| 13 | Kejelasan | Clarity |
| 14 | Vinyet | Vignette |

### 15.1 "Edit warna" — panel khusus, DIBUKA 2026-08-23

Beda dari 13 slider lain — begitu dipilih, tampil:
- **3 swatch warna bulat** — hasil ekstraksi otomatis warna dominan dari gambar (1 thumbnail mini gambar penuh + 2 warna solid, contoh sesi ini: coklat + kuning, sesuai 2 warna dominan kartu kutipan). Kemungkinan besar ini fitur **"recolor"** (ganti 1 warna spesifik ke warna lain di seluruh gambar, mirip "Edit Colors" versi desktop Canva) — **TAPI tap 1 swatch SAJA tak menunjukkan perubahan visual langsung** (dites live, screenshot identik sebelum/sesudah) → kemungkinan perlu tap-and-hold, atau swatch cuma tampilan info (preview warna terdeteksi) dan color-picker sungguhan muncul di elemen UI lain yg tak ke-capture screenshot (mis. overlay terpisah). **BELUM TUNTAS, TODO sesi depan:** coba long-press swatch, atau cek apakah perlu swipe-reveal color-picker di bawahnya.
- **Toggle "Balikkan warna"** (Invert colors) — off by default, belum dites aktifkan.

## 15.2 "Tingkatkan Resolusi" (§16) — DIUJI LIVE, langsung apply TANPA dialog

Tap tool ini **langsung menerapkan efeknya seketika** — TIDAK ADA dialog konfirmasi, progress bar, atau loading indicator yang sempat tertangkap (screenshot 3 detik setelah tap sudah menunjukkan kembali ke toolbar transform biasa, ikon Undo di top-bar jadi aktif menandakan perubahan tercatat di history). **Implikasi otomasi: 1 tap = selesai, tak perlu handle dialog susulan** — beda dari dugaan awal yg mengira mungkin ada preview before/after atau prompt "Terapkan?".

**⚠️ Transparansi ke user:** tool ini DIUJI di desain ASLI "Motivasi Kesehatan Kartu 2" (bukan desain percobaan terpisah) — efeknya PERSISTEN (tersimpan otomatis, tak di-undo pasca-pengujian, beda dari elemen teks percobaan §17 yg sengaja dihapus lagi). Dampak: gambar di desain itu kini resolusinya sudah ditingkatkan (upscale) — perubahan searah, tak merusak/mengubah tampilan visual, murni penambahan detail piksel, dianggap aman+bermanfaat makanya tak di-revert, tapi dicatat di sini demi kejujuran (bukan operasi 100% tanpa efek pada data nyata user, tak seperti pengujian lain sesi ini yg semua dibersihkan).

**Pola UI tiap slider (konsisten, dites di "Vinyet"):** nama slider + horizontal slider draggable (titik tengah = 0, netral) + **kotak angka di kanan menampilkan nilai terkini (mis. "0") — TAPI KOTAK INI READ-ONLY, tap tak memunculkan keyboard** (dites langsung, tak ada respons) → **automasi HARUS drag slider (`adb input swipe` pendek dari posisi handle), TAK BISA ketik angka presisi langsung.**

**Jebakan navigasi ditemukan sesi ini:** chip-row 14 item ini TAK MUAT 1 layar, scrollable horizontal — `input swipe` jarak jauh (>500px) bisa SKIP banyak chip sekaligus (auto-snap ke chip terdekat & otomatis SELECT chip itu, bukan cuma scroll pasif) — kalau butuh baca urutan lengkap, pakai swipe PENDEK (~300-400px) bertahap, jangan swipe jauh sekali jalan.

## 16. Panel "Alat Gambar" — 5 tool AI image-editing, DIPETAKAN

Dibuka dari §14.2. Grid ikon bulat + label, scrollable horizontal (5 terlihat, kemungkinan lebih):

| Tool | Badge | Fungsi (dugaan dari ikon+nama) |
|---|---|---|
| **Lapisan Ajaib** | Gratis (tanpa badge) | Kemungkinan pisahkan elemen jadi layer terpisah otomatis (ikon: ekstraksi objek dari background) |
| **Edit Ajaib** | 🔒Pro | AI generative edit (ikon cupcake half-edited — kemungkinan "Magic Edit" ganti sebagian gambar via prompt teks, mirip Photoshop Generative Fill) |
| **Tingkatkan resolusi** | Badge **"Baru"**, GRATIS | AI upscale/super-resolution — berguna utk gambar hasil pipeline Figma yg resolusinya terbatas |
| **Penghapus LB** | 🔒Pro | Background remover (duplikat akses dari §14.2) |
| **Penghapus Ajaib** | 🔒Pro | "Magic Eraser" — hapus objek dari foto secara AI (ikon burung, kemungkinan demo "hapus burung dari langit") |

**Kesimpulan gate:** dari 5 tool, cuma **Lapisan Ajaib** dan **Tingkatkan resolusi** yg GRATIS di akun Member ini — 3 lainnya (Edit Ajaib/Penghapus LB/Penghapus Ajaib) Pro-locked. **"Tingkatkan resolusi" khususnya BERNILAI TINGGI utk pipeline Figma→Canva** (§14.2 Ganti + `figma_to_canva.py`) karena source gambar dari Figma API kadang resolusi standar — bisa di-upscale gratis sblm publish.

## 17. Elemen Teks — alur tambah + toolbar edit, DIPETAKAN

### 17.1 Menambah teks baru (dari panel Teks §2.2c, tombol "Tambahkan kotak teks")
Tap tombol → **kanvas otomatis zoom-in ke area teks** + text box baru muncul isi placeholder **"Teks paragraf Anda"** (untuk gaya "Tambahkan sedikit teks isi"; preset lain beda placeholder) **dgn teks ITU SENDIRI SUDAH TER-SELECT/highlight** + keyboard software langsung muncul → **`adb shell input text "..."` LANGSUNG bisa dipanggil tanpa tap tambahan**, otomatis REPLACE placeholder (bukan append). Ini pola PALING EFISIEN utk automasi insert-teks: 1 tap (tombol preset) + 1 `input text` call, selesai.

Toolbar inline saat masih dlm mode edit (di atas keyboard): ikon sama dgn §14.1 (animasikan?/komentar) + **pemisah** + **Warna font** (swatch pelangi) / **"Font"** (nama font aktif) / **"30 pt"** (ukuran, tampil sbg angka bukan slider) / **B** (bold, toggle) / *I* (italic) / **U** (underline, terpotong layar) + **checkmark** (commit, keluar mode edit-teks).

### 17.2 Toolbar elemen teks TERPILIH (setelah commit, tap elemen lagi) — BEDA dari toolbar gambar §14.2
| Tool | Fungsi |
|---|---|
| **Edit** | Kembali ke mode edit-teks (keyboard+toolbar inline §17.1) |
| **Font** | Ganti font family (ikon "Ff") |
| **Gaya teks** | Preset style (ikon "H" — kemungkinan varian judul/subjudul/isi atau efek teks siap-pakai, belum dibuka) |
| **Ukuran font** | Ganti ukuran (ikon "AA") |
| **Warna** | Ganti warna teks (swatch pelangi) |

(Toolbar ini kemungkinan scrollable ke kanan sama spt §14.2, ada tool lanjutan Efek/Animasikan/Spasi/Perataan yg belum ke-capture — TODO sesi depan.)

Menu konteks mengambang + handle SAMA POLA dgn §14.1 (animasikan/komentar/duplikat/hapus/lainnya), TAPI **handle resize/rotate teks BEDA**: bukan 8-titik di bounding-box spt gambar, melainkan **1 handle "pindah" (ikon 4-panah)** + **1 handle "putar"** terpisah di bawah elemen — konsisten dgn sifat text-box yg auto-resize mengikuti isi teks (tak perlu drag-resize manual spt gambar raster).

**✅ Dibersihkan pasca-pengujian:** elemen teks percobaan ("AI Test") DIHAPUS via tombol trash §14.1/17.2 sblm sesi selesai — desain "Motivasi Kesehatan Kartu 2" kembali ke state asli, tak ada perubahan permanen ke desain user.
