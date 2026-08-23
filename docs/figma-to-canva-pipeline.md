# Pipeline Figma → Canva (headless, via script)

> Dibuat 2026-08-23. Konteks penuh di memori Claude: [[project_figma_api_key]] (token+scope, riwayat pipeline manual), [[project_redmi_vn_node]] (device RN7), `canva-automation-map.md` (langkah sisi Canva).

## 0. Kenapa pipeline ini ada — batasan produk yang HARUS dipahami dulu

App mobile Figma resmi (`com.figma.mirror`, judul asli **"Figma: View, Comment & Mirror"**, terpasang di RN7 2026-08-23) **TIDAK PUNYA kemampuan edit desain sama sekali**. Dikonfirmasi langsung dengan membuka file asli akun: satu-satunya interaksi yang ditawarkan di kanvas adalah coach-mark **"Tap & hold anywhere on the canvas to add a comment"** — tidak ada tool pilih/pindah/resize/teks/shape, tidak ada panel Layers. Ini bukan keterbatasan mapping, tapi memang begitu desainnya oleh Figma (editing desain sungguhan cuma ada di desktop app / browser desktop-tablet).

**Konsekuensi:** kalau tujuannya "otomatisasi editing" konten yang sumbernya Figma, jalan satu-satunya yang masuk akal adalah **mengeluarkan asetnya dari Figma lalu mengeditnya di Canva** (app yang memang py tool editing lengkap dan sudah dipetakan penuh di `canva-automation-map.md`). Dokumen ini + script `figma_to_canva.py` menutup separuh pertama pipeline itu (Figma → device), separuh kedua (upload+edit di Canva) tinggal ikuti §3 di bawah / peta Canva yang sudah ada.

## 1. Arsitektur pipeline

```
Figma REST API                    hub (akses-vps)                RN7 (device)
──────────────                    ────────────────                ────────────
GET /v1/files/:key/meta   ─┐
GET /v1/images/:key        ├─►  figma_to_canva.py  ──► crop PNG ──► adb push ──► /sdcard/DCIM/Camera/
 (ids=<node>, format=png)  ┘      (PIL, requests)                              (media-scan otomatis)
                                                                                     │
                                                                          [MANUAL / automasi terpisah]
                                                                                     ▼
                                                                     Canva → Unggahan → Unggah file →
                                                                     pilih dari Camera → "Buka di editor"
                                                                     = mulai EDITING SUNGGUHAN
```

Kenapa lewat gambar (bukan `/v1/files` document-tree penuh + rebuild layer Figma asli di Canva): Canva **tidak punya API upload publik** utk akun personal/tim biasa, dan Canva mobile **tidak punya fitur import-link-Figma** — satu-satunya pintu masuk konten eksternal ke Canva mobile adalah lewat file-picker galeri lokal. Jadi render-ke-gambar+push-ke-galeri adalah jalur paling langsung yang benar-benar ada.

## 2. Script: `akses-vps/figma-pipeline/figma_to_canva.py`

Jalan dari hub (akses-vps), butuh `pip install requests pillow` + token Figma di `~/.config/figma/warungbudina_api-key.txt` (scope `file_content:read` cukup) + adb konek ke device tujuan.

```bash
cd ~/akses-vps/figma-pipeline

# Mode PALING ANDAL: grid rata eksplisit, kalau tahu jumlah frame/kartu
# (mis. carousel Instagram 7 slide berjajar horizontal jadi 7 gambar):
python3 figma_to_canva.py "<link-figma-atau-file-key>" --cols 7 --rows 1 --name carousel

# Mode auto-detect kolom (fallback, cek hasil manual sebelum lanjut ke Canva):
python3 figma_to_canva.py <file_key> --name motivasi

# Cuma render+crop lokal dulu (cek hasil sebelum push ke device):
python3 figma_to_canva.py <file_key> --no-push --out ./preview

# Device tujuan lain (default RN7 10.66.66.6:5555):
python3 figma_to_canva.py <file_key> --serial 10.66.66.2:<port>
```

**Cara kerja tiap tahap (`[1/4]`–`[4/4]` di output):**
1. **Meta** — `GET /v1/files/:key/meta` (selalu jalan, termasuk file Buzz yang `/v1/files/:key` standar TOLAK dengan `400 "File type not supported"`) → sekadar info nama+tipe, gagal di sini TIDAK menghentikan proses.
2. **Composite image** — `GET /v1/images/:key?ids=<node>&format=png&scale=N`. Default `--node 0:1` = tebakan generik "root/page pertama" yang TERBUKTI konsisten berhasil di file manapun yang dicoba sejauh ini (bukan API resmi terdokumentasi Figma, kalau gagal di file lain coba `--node 0:2` dst, atau screenshot manual dari browser sbg fallback terakhir).
3. **Crop** — dua mode:
   - `--cols N --rows M`: bagi rata composite jadi grid N×M. **Pakai ini kalau tahu jumlah elemennya** — hasil paling dapat diprediksi.
   - (default, tanpa `--cols`): auto-detect kolom berisi-konten vs background, warna background ditebak ADAPTIF dari 4 sudut gambar (bukan asumsi putih — banyak file Figma pakai kanvas gelap/hitam). Cukup baik untuk elemen berjajar simpel (teruji 2-kartu berdampingan), **TAK dijamin akurat** untuk layout kompleks (overlap, elemen nempel tepi, background gradient) — selalu buka hasil `*-partN.png` sebelum lanjut ke Canva, kalau aneh ulangi dengan `--cols`/`--rows` eksplisit.
4. **Push** — `adb push` tiap crop ke `/sdcard/DCIM/Camera/<name>-partN.png` + broadcast `MEDIA_SCANNER_SCAN_FILE` (WAJIB, biar langsung muncul di album "Camera" tanpa reboot/tunggu index MediaStore) — nama file pakai `--name` yang Anda kasih supaya gampang dikenali di picker Canva, bukan nama generik `screenshot`/`IMG_` yang gampang ketuker dengan file lain.

**✅ Teruji end-to-end 2026-08-23** (file Buzz `1uwIvuxXnOx9SBxNkHxOMW`, sama dgn yg dipakai manual sebelumnya di [[project_figma_api_key]]): meta OK, composite 5760×3120 (scale 2x), auto-detect 2 kartu presisi (background hitam terdeteksi benar), push ke RN7 sukses + media-scan sukses. File test dibersihkan lagi dari device pasca-verifikasi (bukan output permanen yang diminta user).

## 3. Sisi Canva — upload + mulai editing (manual, atau lanjutkan automasi UI terpisah)

Ini bagian yang BELUM di-scriptkan (UI Canva, beda domain dari script Python di atas) — ikuti `canva-automation-map.md` §2.2f ("Unggahan") untuk koordinat/selector persis kalau mau di-Appium-kan. Ringkasnya:

1. Buka Canva di device tujuan → bottom nav tab **"Unggahan"**.
2. Tombol **"Unggah file"** → "Pilih media" → pilih album **"Camera"** (bukan "File terbaru" — rawan kepilih file lain yang kebetulan lebih baru, mis. screenshot adb sendiri; lihat jebakan yang sudah pernah kejadian di [[project_figma_api_key]]).
3. Multi-select semua `<name>-partN.png` yang baru di-push → centang → upload.
4. Tunggu toast **"N item berhasil diunggah"** → file masuk folder "Unggahan".
5. Tiap gambar → tap preview → tombol **"Buka di editor"** → Canva bikin desain baru berisi gambar itu sebagai elemen/layer — **INI titik mulai editing sungguhan** (resize/pindah/hapus-background/tambah elemen-teks lain lewat toolbar Ganti/Pilih/Sesuaikan/Alat Gambar, semua sudah dipetakan di `canva-automation-map.md`).

## 4. Batasan & catatan yang perlu diingat

- **Hasil akhir BUKAN file Figma asli yang editable** — teks/shape Figma sudah jadi satu gambar raster flat begitu di-export lewat `/v1/images`. Kalau butuh edit teks secara individual per-elemen di Canva, itu di luar jangkauan pipeline gambar ini (perlu skill Canva sendiri: tambah teks baru di atas gambar, bukan edit teks bawaan Figma).
- **Auto-detect crop cuma andal untuk layout sederhana** — selalu verifikasi visual hasil crop sebelum lanjut upload, terutama untuk file baru yang belum pernah dicoba.
- **Jangan pernah coba `curl`/download otomatis lewat Claude untuk mengambil file APK/installer app apa pun** dari mirror pihak-ketiga (topik beda dari pipeline gambar Figma ini, tapi relevan kalau kerjaan RN7 lain butuh instal app) — itu diblokir hard oleh classifier Claude Code, lihat [[feedback_classifier_blocks_apk_mirror_download]]. Pipeline DI DOKUMEN INI aman karena cuma menyentuh REST API resmi Figma (gambar hasil desain sendiri) + `adb push` file lokal, bukan mengunduh executable pihak-ketiga.
- Token Figma yang dipakai py scope `file_content:read` — CUKUP untuk pipeline ini. Kalau perlu perluas ke file di luar akun sendiri (file dibagikan tim lain), pastikan token py akses ke file itu (uji dulu `GET /v1/files/:key/meta` manual).
