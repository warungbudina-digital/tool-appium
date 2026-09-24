# VN "Newbie Tutorials & Usage Guides" — Isi Lengkap Help Center

> **Sumber:** VN Help Center publik `https://vlognow.me/help/getting-started/` (kategori **Getting Started**, 8 artikel).
> **Cara capai in-app:** VN → beranda/`FirstTimeActivity` → seksi **Tutorials** (`flTutorials`) → butir **"• Newbie tutorials and usage guides"** (@400,1548) → `InternalBrowserActivity` (WebView Help Center). (Butir satunya = "Template creation tutorial", lihat [`vn-template-tutorial-helpcenter.md`](./vn-template-tutorial-helpcenter.md).)
> **Ditangkap:** 2026-09-24 dari RN7 (`com.frontrow.vlog` 2.17.0); struktur kategori via `uiautomator dump`, isi artikel via WebFetch per-URL (structured extract).
> **Pelengkap:** peta editor otomasi di [`vn-automation-map.md`](./vn-automation-map.md); teknik editing footage di [`vn-footage-editing-techniques.md`](./vn-footage-editing-techniques.md).

## Daftar 8 artikel

| # | Judul | Slug URL |
|---|---|---|
| 1 | VN Video Editing 101 | `editing-101` |
| 2 | Video Effect & Transitions | `transition-and-fx` |
| 3 | Export Settings | `export` |
| 4 | Import Assets | `import-assets` |
| 5 | Audio | `audio` |
| 6 | Import Music & Audio | `import-music` |
| 7 | Image & Clip Adjustment | `img-clip-adjust` |
| 8 | VN Project Sharing | `project-sharing` |

Base URL: `https://vlognow.me/help/getting-started/<slug>/`

---

## 1. VN Video Editing 101

Dasar editing video untuk video pertama di VN.

### Video Editing (dasar)
- Pilih satu track video untuk diedit.
- Geser handle untuk trim video.
- Zoom-in timeline untuk edit presisi; zoom-out untuk preview seluruh timeline.
- **Long-press** klip video untuk swap (tukar urutan).

### Add Video Clips
1. Tap **[+]** untuk menambah klip video.
2. Geser ke ujung → tap **[+]** untuk menambah klip outro.

### Change Video Ratio
1. Tap rasio aspek di bagian atas editor.
2. Pilih rasio paling sesuai.

### Trim Videos Precisely
Multiple scale — trim presisi hingga per-frame.

### Split & Adjust Clip Duration
- Geser playhead ke titik potong → tap **[Split]**.
- Pilih klip → tap **[Trim]** untuk atur durasi.

### FAQ
- **Rasio mana?** 9:16 (TikTok/YT Shorts), 16:9 (YouTube long-form), 4:5 (IG post/reels). Ubah via kontrol atas editor.
- **Kenapa video ke-crop setelah ganti rasio?** Bentuk klip sumber beda dari rasio project → atur crop/scale/posisi tiap klip.
- **Campur potrait & landscape dalam 1 project?** Bisa, tapi satu rasio kanvas; sesuaikan crop/scale/posisi/background tiap klip.
- **Auto-save?** Ya. Kelola project dari home (rename/duplicate/move/share/delete).
- **Simpan ke cloud?** Tidak. Sign-in tak backup/sync — export manual untuk simpan.
- **Lanjut edit di device lain?** Bisa, via Project Sharing (share file project antar-instance VN).
- **Buat project berbasis beat musik?** Ikuti "How to Create a BeatsClips Project".
- **Kenapa klip lain bergeser/muncul gap setelah edit klip?** Tergantung **Main Track Mode** & **Auto-Ripple**: Quick Mode klip tetap tersambung; Pro Mode + Auto-Ripple ON → klip lain bergeser; Auto-Ripple OFF → timestamp tetap tapi bisa muncul gap. Lihat Editor Preferences.
- **Kenapa teks/audio/overlay tak sinkron setelah geser klip?** Cek **Track Linkage** di Editor Preferences: ON = elemen terkait ikut bergerak dengan klip main-track; OFF = posisi timeline dipertahankan.

---

## 2. Video Effect & Transitions *(update 17 Jun 2026)*

### Video Transition
1. Impor minimal dua klip → tap **[+]** di antara thumbnail klip.
2. Pilih kategori transisi → pilih transisi → terapkan.

> **Transisi tipe "Effects" pakai AI & butuh kredit.** VN Pro dapat **100 kredit** per bulan langganan; kredit tambahan bisa dibeli.

### Video Effects
- **Mosaic:** tap **[Mosaic]** → pilih gaya → geser untuk atur posisi & ukuran.
- **Magnifier:** tap **[Magnifier]** → atur level pembesaran → geser posisi & ukuran.
- **Blur:** tap **[Blur]** → pilih gaya (**Base / Horizontal / Vertical / Radioactive**) → atur intensitas.
- **Reverse:** tap **[Reverse]** untuk playback terbalik.

### Bulk — Apply to All
Tap **[Apply to all]** untuk terapkan transisi/filter/efek ke semua klip di track yang sama sekaligus.

### FAQ
- **Apa itu transisi?** Efek di antara klip untuk perpindahan scene halus/kreatif.
- **Cara tambah?** Impor 2+ klip → [+] antar thumbnail → pilih kategori → pilih → terapkan.
- **Efek apa saja?** Mosaic, Magnifier, Blur, Reverse, + transisi video.
- **Bisa ke semua klip?** Ya, **[Apply to all]** (track sama).
- **Transisi Effects makan kredit?** Ya. Pro 100/bulan; tambahan bisa dibeli.

---

## 3. Export Settings

Kebanyakan export terbaik di mode **[Auto]** (pakai resolusi/fps/bitrate klip, seimbangkan ukuran & kualitas; juga aktifkan **[Export Audio Only]** & **[HDR]**). Ganti ke **[Manual]** untuk kustom.

### Resolution
Disarankan cocokkan dengan resolusi klip asli.

| Resolusi | Keterangan |
|---|---|
| 480p | SD |
| 720p | HD |
| 1080p | Full HD |
| 2.7K | 2.7K |
| 4K | Ultra HD |

### FPS (Smoothness)
Disarankan cocokkan dengan fps video asli.

| FPS | Standar | Region/Konten umum |
|---|---|---|
| 24 | Film | Film sedunia, sinematik, naratif |
| 25 | PAL | Eropa/Asia/Afrika/Oceania; siaran TV, video PAL |
| 30 | NTSC | Amerika Utara, Jepang, sebagian Amsel/Asia; video web |
| 50 | PAL | Eropa/Asia/Afrika/Oceania; olahraga, live event |
| 60 | NTSC | Amerika Utara, Jepang; olahraga, gaming, aksi |

### HDR
Pertahankan rentang kecerahan & warna lebih luas dari SDR. Aktifkan hanya jika **semua klip** direkam HDR. Jika OFF sementara sebagian klip HDR → otomatis dikonversi ke SDR. **Aktifkan HDR tanpa sumber HDR bisa menggeser warna.**

### Export Audio Only
1. Tap **[Export]** (kanan atas editor).
2. Nyalakan switch **[Export Audio Only]**.
3. Tap **[Export]**. → ekstrak audio tanpa video.

### Average Bitrate
Bitrate (Mbps) = data video per detik. Tinggi = detail lebih baik tapi file besar; rendah = kualitas turun. Manual: **1.0–300 Mbps**. Mengubah resolusi/fps/HDR otomatis menyesuaikan bitrate dari klip sumber.

### FAQ
- **Mode mana?** Auto untuk kebanyakan; Manual untuk kontrol kustom.
- **Resolusi & FPS?** Cocokkan video asli; lebih tinggi tak menambah kualitas & menaikkan ukuran/waktu.
- **Bitrate?** Tinggi untuk resolusi/fps/HDR/gerak-tinggi; Manual auto-adjust sebagai titik awal.
- **Kenapa export gagal?** Pastikan storage cukup, tak ada klip hilang, coba Auto/setting lebih rendah, buka ulang app.
- **Agar sukses?** Layar tetap nyala, app di foreground, device tercolok; jangan kunci HP/pindah app.
- **Boleh kunci HP saat export?** Tidak.
- **Export audio saja?** Ya, aktifkan **[Export Audio Only]** → **[Export]**.

---

## 4. Import Assets

### Stiker custom
- Tap **[Sticker]** → halaman **[Imports]**.
- Tap **[Add]** → pilih gambar/file → impor sebagai stiker ke project.

### Musik & Font
- **AirDrop (Mac→iPhone):** kirim file musik/font via **[AirDrop]** → setelah diterima, share ke VN.
- **Musik dari File App:** VN → tombol **[+]** (kanan bawah) → **[Music]** di **[Library]** → **[My Music]** → **[Extract from Video]** → pilih video → pilih segmen → "Done".

### SRT Subtitle
1. Tap **[+]** di track teks.
2. Tap **[SRT Files]**.
3. Tap **[Import from File App]** → pilih file .srt.
4. Subtitle muncul di editor.

*(Artikel ini tanpa tabel/FAQ.)*

---

## 5. Audio

### Fungsi
1. **Import Music & Audio** — dari file audio atau video ber-audio (lihat artikel #6).
2. **Edit Music** — zoom-in presisi / zoom-out preview / tap handle untuk perpanjang durasi ke awal/akhir.
3. **Recordings** — tambah/hapus banyak rekaman di titik mana pun di timeline.
4. **Adjust Volume** — klip video main-track: atur **Video Volume** & **BGM Volume**; klip musik: atur volume musik/sound-effect/rekaman.
5. **Detach Audio** — tap **[Extract Audio]** untuk lepas audio main-track.
6. **Sound Effects** — tambah SFX pendek di track audio (via menu insert dari track audio).
7. **Music Beats** — selaraskan cut/efek dengan beat musik.
8. **Denoise & Voice Switch:**
   - **Voice Effects** (**[Effects]**): Alien, Optimus, Duck.
   - **Character Voice** (**[Characters]**): ubah aksen/gender/tone — **AI (upload ke cloud, dihapus setelahnya), makan kredit** (biaya ditampilkan).

### FAQ
- **Bisa impor musik?** Ya (artikel #6).
- **Edit presisi?** Zoom-in; tap handle perpanjang; zoom-out preview.
- **Banyak rekaman?** Ya, di titik mana pun.
- **Ubah suara?** Voice Switch via **[Effects]** atau **[Characters]**.
- **Biaya AI voice?** Pakai kredit; estimasi ditampilkan.
- **Atur volume?** Klip video → Volume/BGM; klip musik → volume per-track.
- **Lepas audio?** **[Extract Audio]** di main-track.
- **Tambah beat?** Tap track musik → **[Beats]** → manual (tap/drag) atau **[Auto Beats]** + slider.

---

## 6. Import Music & Audio

Buka library: VN → **[+]** → tab **[Yours]** → **[Music]** → **[Yours]** di library musik.

### Metode 1 — dari File
1. Tap tombol vertikal **[...]**.
2. Pilih metode impor:
   - **[File App]** — ekstrak dari file di File app HP.
   - **[AirDrop]** — dari file via AirDrop (umumnya Mac→iPhone/iPad).
   - **[Wi-Fi]** — portal transfer file sementara berbasis browser.
   - **[Link]** — ekstrak dari link yang diberikan.
3. Setelah impor, diminta taruh di album (pakai album ada / tambah baru).
4. File musik muncul di album terpilih.

### Metode 2 — dari Video
1. Pilih **[Extract from Video]**.
2. Tap tombol **[Import Music]**.
3. Pilih **[Video]**.
4. Pilih video (hanya video ber-suara).
5. Pilih panjang & trim video.
6. Musik hasil ekstrak muncul di halaman **[Extracted from Video]**, siap dipakai.

### FAQ
- **Impor musik dari video?** [Create] → [Library] → [Music] → [Extract from Video] → pilih video → trim/rename → Done.
- **Impor file musik?** [More] → [Files App] → buka folder → pilih file → pilih folder tujuan.
- **Buka library musik?** [+] → [Yours] → [Music] → [Yours].
- **Metode impor file?** [File App], [AirDrop], [Wi-Fi], [Link].
- **Musik impor muncul di mana?** Album yang dipilih setelah impor.
- **Video apa untuk ekstrak?** Hanya yang ber-suara; bisa pilih panjang & trim dulu.

---

## 7. Image & Clip Adjustment

### Filter & Adjust
**Filter:** gaya visual via preset. **Adjust:**

| Opsi | Fungsi |
|---|---|
| Exposure | Jumlah cahaya keseluruhan |
| Contrast | Beda terang-gelap |
| Brightness | Terang/gelap gambar |
| Saturation | Intensitas warna |
| Vibrance | Ubah warna sambil jaga skin tone |
| Temperature | Hangat/dingin |
| HSL | Hue/saturation/lightness per rentang warna |
| Vignette | Gelap/terangkan tepi untuk fokus tengah |
| Sharpen | Pertajam detail tepi |
| Hue | Ubah warna lintas spektrum |
| Highlights | Luminositas area paling terang |
| Shadows | Kecerahan/detail area paling gelap |
| Noise Reduction | Kurangi grain di low-light |

### Use Flow App
Export layout visual dari Flow ke VN untuk edit timeline & finishing.

### Cutout
Pilih klip → **[Cutout]** → **[Quick Removal]** / **[Modify Area]** / **[AI Cutout]**; atur **[Feather]** & **[Expand]**.

### Transform
**[Crop]** preset: **[9:16] / [1:1] / [16:9] / [Original] / [Free]**.

| Opsi | Fungsi |
|---|---|
| Rotate | Rotasi 90° |
| Mirror | Balik horizontal |
| Flip | Balik vertikal |
| Fit | Sesuaikan border ke tepi kanvas |

### Background (BG)
Tap **[BG]**: **[Color]** (solid) / **[Gradient]** (dua warna) / **[Image]** (foto + **[Blur]** bisa diatur).

### Lainnya
- **Blur:** **[Base] / [Horizontal] / [Vertical] / [Radioactive]**.
- **Opacity:** transparansi.
- **Border:** border berwarna di tepi.
- **Position:** **[Align]** (Left/Center/Right/Top/Middle/Bottom) & **[Nudge]** (koordinat X/Y presisi).

### FAQ
- **Media apa yang bisa disesuaikan?** Gambar & video di timeline.
- **Beda Crop vs Rotate?** [Crop] ubah area terlihat & bisa rotasi dalam frame; [Rotate] putar seluruh gambar/klip 90°.
- **Background di video?** Hanya klip main-track.
- **Pilih gaya Blur?** Base=seragam; horizontal/vertical=motion terarah; radioactive=radial.
- **Posisi presisi?** [Align] preset atau [Nudge] X/Y.

---

## 8. VN Project Sharing

Berbagi/proteksi/transfer/impor file project VN lintas **iOS, Android, macOS, Windows**.

> **Batas:** non-Pro hanya bisa Project Sharing **sekali per hari**.

### Share file project
1. Di **[Home]**, temukan project → tap **[...]**.
2. Tap **[Share Project]**.
3. Pilih level media:
   - **[Full]** — semua footage & media.
   - **[Simple]** — pilih footage spesifik.
4. Jika [Simple]: tap **[Footage]** → pilih klip → **[Confirm Selected Footage]**.
5. Tap **[Share]**.
6. Pilih app/lokasi tujuan file.

### Read-only & Protect (VN Pro)
Sebelum **[Share]**:
- **[Read-only]** — penerima bisa lihat, tak bisa edit/export.
- **[Protect Project]** — password, tanggal kadaluarsa akses, batas export.

### Import file project
1. Buka file project yang dibagikan → pilih VN.
2. Jika terproteksi, masukkan password → **[Confirm]**.
3. Tunggu VN memuat (app tetap terbuka).
4. Tap **[Open Project]** untuk masuk editor.

### FAQ
- **Backup/cloud?** Simpan lokal saja; sign-in tak sync. Simpan file manual sebelum uninstall/ganti device.
- **Edit lintas device?** Ya — share [Full] + [Read-only] OFF, buka di device lain yang didukung.
- **Platform didukung?** iOS, Android, macOS, Windows.
- **[Full] vs [Simple]?** Full semua media; Simple kurangi ukuran via footage selektif.
- **Media hilang?** Biasanya karena [Simple] tanpa memilih semua footage yang diperlukan.
- **Izin edit?** [Read-only] OFF agar penerima bisa edit.
- **Share view-only?** [Read-only] ON sebelum share.
- **[Read-only] vs [Protect Project]?** Read-only cegah semua edit/export; Protect Project kontrol granular (password/batas export).
- **Proteksi password?** [Protect Project] → set password → [Share].
- **Kadaluarsa & batas export?** Via [Protect Project].
- **Masalah akses?** File bisa butuh password / kadaluarsa / read-only / lewat batas export → hubungi pengirim.
- **Beda [Share Project] vs [Export]?** [Share Project] = file project editable; [Export] = video final.
- **Frekuensi?** Non-Pro sekali/hari.
