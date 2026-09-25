# VN "Template Creation Tutorial" — Isi Lengkap Help Center

> **Sumber:** VN Help Center publik `https://vlognow.me/help/templates/` (kategori **Templates**, 8 artikel).
> **Cara capai in-app:** VN → beranda/`FirstTimeActivity` → seksi **Tutorials** (`flTutorials`) → butir **"• Template creation tutorial"** → membuka `InternalBrowserActivity` (WebView Help Center).
> **Ditangkap:** 2026-09-24 dari RN7 (`com.frontrow.vlog` 2.17.0) via `uiautomator dump` (WebView tak-debuggable) + WebFetch per-URL.
> **Catatan capture:** tapping di device rawan meleset (buka artikel salah); WebFetch "structured guide" (bukan "verbatim") lebih andal & lolos filter copyright.
> **Pelengkap:** untuk resep otomasi ADB/Appium membuat template lihat [`vn-template-creation-playbook.md`](./vn-template-creation-playbook.md); peta editor umum di [`vn-automation-map.md`](./vn-automation-map.md).

## Daftar 8 artikel

| # | Judul | Slug URL | Update · baca |
|---|---|---|---|
| 1 | Tips for Creating Better VN Templates | `template-tips` | 21 Agu 2026 · 6 mnt |
| 2 | How to Create a VN Template | `create-template` | 4 Agu 2026 · 4 mnt |
| 3 | How to Share a VN Template | `share-template` | 4 Agu 2026 · 4 mnt |
| 4 | Create VN Template with Music | `template-with-music` | — |
| 5 | Create VN Template with Viral Music Video | `template-with-viral-video` | — |
| 6 | How to Create AI Template using CawCut | `create-template-cawcut` | — |
| 7 | Create a VN Template With Flow | `flow-template` | 5 Agu 2026 · 10 mnt |
| 8 | How to Use VN Templates? | `use-template` | — |

Base URL: `https://vlognow.me/help/templates/<slug>/`

---

## 1. Tips for Creating Better VN Templates

Template yang baik = mudah dipahami & dikustomisasi pengguna lain **tanpa mengubah elemen yang mendefinisikan desainnya**. Mulai dengan memilih workflow yang cocok dengan konten yang ingin dibuat pengguna.

### Pilih workflow yang tepat

| Template type | Best for |
|---|---|
| **Standard VN Template** | Video edit penuh: klip, foto, musik, teks, efek, transisi, perubahan speed, keyframe, kontrol timeline detail |
| **Flow Template** | Kolase, undangan, lookbook, slideshow, video berbasis layout (app Flow terpisah) |
| **BeatsClips Template** | Montase beat-sync, fast-cut reels, remake tren, video musik. Punya musik → **From Music**; mau tiru video → **From Short Video** |
| **AI Template (CawCut)** | Iklan AI-generated, transisi scene, cerita karakter, efek khusus |

### Matriks kapabilitas utama

✅ kapabilitas utama · 🔄 tersedia setelah lanjut di VN · ➖ bukan kapabilitas utama

| Kapabilitas | Standard VN | BeatsClips | Flow | CawCut |
|---|---|---|---|---|
| Video berbasis beat musik | ➖ | ✅ | — | — |
| Frames, Grids, Layouts, Multi-Page | — | — | ✅ | — |
| Generasi gambar & video AI | — | — | — | ✅ |
| Edit timeline VN detail | ✅ | 🔄 | 🔄 | 🔄 |

Setelah template siap → finalisasi & bagikan lewat artikel **How to Create a VN Template** + **How to Share a VN Template**.

### Frame untuk media replaceable

Pakai **Frame** untuk: foto yang diganti pengguna, klip video footage pengguna, slot poster/cover/kolase, area media berulang yang harus tetap bentuk & posisinya.

Menambah frame: **[Insert]** → **[Elements]** → **[Frames]** → pilih dari daftar.

> **Media di dalam Frame OTOMATIS terpilih sebagai replaceable** saat template dibuat — kurangi seleksi manual & cegah slot terlewat.

### Flow untuk template berbasis layout

Pakai app **Flow** saat template berbasis layout visual, bukan editing timeline detail (poster, kolase, cover, undangan, grid, multi-page). Susun teks & gambar di kanvas via Frame, **[Layouts]**, **[Grids]** — area yang bisa diganti pengguna tapi layout/crop/desain tetap. Satu design Flow bisa multi-halaman.

Setelah export dari Flow: **[Make a video with VN]** → set durasi tiap halaman → edit di VN → publish sebagai template.

### BeatsClips untuk template berbasis beat

- **[BeatsClips] > [From Music]** — template mengikuti ritme track musik; VN analisis bagian terpilih & generate beat otomatis (bisa disesuaikan/ditambah manual). Cocok untuk montase foto, fast cut, transisi.
- **[BeatsClips] > [From Short Video]** — reproduksi timing video musik viral; referensi bantu identifikasi cut/transisi untuk menempatkan beat & susun ulang dengan media sendiri.

### AI Template dengan CawCut

Untuk project yang butuh gambar/video AI-generated atau workflow kreatif sangat kustom. Bangun workflow reusable di CawCut → jadikan template VN. Berguna untuk: iklan/showcase produk/video sosial AI, gaya/karakter/scene konsisten, ulang proses kreatif yang sama dengan konten berbeda.

### Review sebelum bagikan

Sebelum buat & bagikan template, pakai untuk buat video lain & tinjau dari sudut pandang pengguna akhir — pastikan mudah dikustom & hasil konsisten dengan media pengganti berbeda.

### FAQ
- **Cara tambah foto/video yang harus diganti pengguna?** Pakai **[Frame]** di **[Elements]** — media di Frame otomatis replaceable.
- **Kenapa Graphics tidak otomatis replaceable?** Graphics dianggap bagian desain (dekorasi/label/aksen), biasanya tetap.
- **Kapan pakai Flow?** Saat template bergantung layout visual (poster/kolase/cover/undangan/grid/multi-page). Bangun via [Frame]/[Layout]/[Grid], [Make a video with VN] konversi ke project video.
- **Opsi BeatsClips mana?** From Music = ikut track musik; From Short Video = punya video/screen-recording & mau tiru timing-nya.
- **BeatsClips ringkas untuk berbagi?** From Music, pilih bagian ~10–15 detik, tambah foto/video replaceable via Frame, hindari media/layer/beat berlebih, preview dulu.
- **CawCut bantu bikin AI template?** Bangun workflow AI kustom → jadikan template reusable → ulang dengan konten berbeda.
- **Pakai template saat offline?** Ya. Template yang sudah dimuat tetap tersedia offline; file template di device juga bisa dimuat offline.

---

## 2. How to Create a VN Template

Template VN menyimpan **struktur, timing, efek, gaya teks, dan pilihan desain** dari project jadi, sambil mengizinkan pengguna lain mengganti media terpilih & mengedit teks terpilih.

Sebelum mulai: selesaikan project & tentukan klip + lapisan teks mana yang boleh diedit (lihat artikel Tips untuk menyiapkan konten replaceable).

### Langkah
1. Di layar **[Home]**, temukan project yang mau dijadikan template → tap **[...]** di sebelahnya.
2. Buka menu project → pilih **Create Template** (**[Create Template]**).
3. Di layar **[Create Template]**, pilih konten yang boleh diubah pengguna:
   - **[Clips]** — centang tiap foto/video yang boleh diganti pengguna dengan medianya.
   - **[Texts]** — centang lapisan teks yang boleh diedit. **Biarkan elemen desain tetap tidak tercentang.**
4. Tinjau pilihan → tap **[Next]**.
5. Di layar **[Publish Template]** — isi **judul** + deskripsi opsional, lalu atur cover, tag, & usage settings.
6. Tap **[Create]** untuk simpan template **lokal**. Tunggu **Export** selesai — **VN harus tetap terbuka & di foreground**.
7. Template tersimpan muncul di tab **[Templates]** pada [Home].

> **[Create]** = simpan ke perangkat saja. **[Create dan Publikasikan]** = unggah ke komunitas VN (publik) — jangan dipakai kecuali diminta eksplisit.

### Pengaturan template

| Setting | Mengontrol |
|---|---|
| **[User Footage Size]** | Cara foto/video pengganti menyesuaikan area media template |
| **[Keep Audio from User Videos]** | Apakah audio asli dari klip video pengganti dipertahankan |
| **[Allow Editing]** | Apakah pengguna boleh masuk editor penuh & ubah struktur timeline setelah mengisi |
| **[Allow to Change Frame]** | Apakah pengguna boleh mengubah rasio aspek template saat mengedit |

### FAQ
- **Perlu pilih semua klip & teks?** Tidak — hanya yang mau diganti/diedit. Sisanya jadi bagian desain tetap.
- **Cara izinkan pengguna ubah timeline/rasio?** Hanya jika **[Allow Editing]** aktif; **[Allow to Change Frame]** untuk rasio. Tanpa itu, pengguna hanya bisa isi media & edit teks terpilih.
- **Setting mana yang pengaruhi foto/video pengganti?** **[User Footage Size]** (kesesuaian ukuran) & **[Keep Audio from User Videos]** (retensi audio).
- **Apa yang dipilih di layar Create Template?** Di [Clips] pilih foto/video yang diganti; di [Texts] pilih teks yang diedit; elemen tetap dibiarkan.
- **Di mana template & cara bagikan?** Tab **[Templates]** di [Home]; bagikan via **VN Code** atau **VN Template File** (lihat artikel Share).

---

## 3. How to Share a VN Template

Berbagi VN project sebagai **VN Code** atau **VN Template File**.

### Temukan & bagikan
1. VN → **[Home]** → **[Templates]**.
2. Tap tombol **[Share]**.

### A. Bagikan via VN Code
VN Code = pengguna lain scan/import kode untuk membuka template di VN.
1. Buka preview template → tombol share → **[VN Code]**.
2. Isi judul + deskripsi opsional, edit cover bila perlu. Jika layar minta file yang bisa diunduh:
   - Tap **[Save the file]**.
   - Upload file ke layanan cloud yang didukung.
   - Set izin file agar **siapa pun dengan link bisa akses**.
   - Tempel link ke **[Download link]**.
3. Tap **[Create]**, tunggu VN Code dibuat.
4. Simpan gambar VN Code ke galeri, atau bagikan.

> **Note:** Jaga file template yang di-upload tetap tersedia setelah berbagi VN Code. Menghapus file / membatasi izin cloud-nya = pengguna lain tak bisa mengunduh template.

### B. Bagikan sebagai VN Template File
File kirim template reusable langsung (tanpa VN Code).
1. Preview → share → **[Share VNFlow File]**.
2. Tinjau pengaturan proteksi opsional → tap bagikan → pilih tujuan kirim/simpan.

---

## 4. Create VN Template with Music

Pakai **[BeatsClips] > [From Music]** saat template harus mengikuti ritme lagu (montase foto, fast cut, transisi). VN analisis musik & generate beat otomatis.

### Langkah
1. Buka **[Your Projects]** → tap **[+]**.
2. Pilih **[BeatsClips]** → tap **[From Music]**.
3. Pilih/impor musik; preview track bila perlu → **[Use]**.
4. Geser handle seleksi untuk memilih bagian track; VN otomatis analisis & generate beat.
5. Tinjau beat via slider **[Auto Beats]** (atur jumlah), atau tambah/hapus marker manual; play untuk konfirmasi sinkron ritme.
6. Tap ✓ untuk selesai atur beat; di preview konfirmasi durasi & slot footage → **[Create BeatsClips Template]**.
7. Untuk berbagi file/VN Code → lihat artikel Share.

### FAQ
- **Kapan buat template dengan musik?** Saat template harus ikut ritme track.
- **Beat otomatis bisa diedit?** Ya — atur jumlah Auto Beats, tambah/hapus beat, preview timing.
- **Kenapa perlu link unduh cloud saat pakai musik sendiri?** Musik impor sendiri → simpan file template & upload ke cloud pihak-3, tempel link yang bisa diakses ke layar publish.

---

## 5. Create VN Template with Viral Music Video

Pakai **[BeatsClips] > [From Short Video]** saat ingin reproduksi timing video musik viral. Referensi bantu identifikasi cut/transisi/perubahan visual.

### Langkah
1. Buka **[Your Projects]** → **[+]**.
2. Pilih **[BeatsClips]** → **[From Short Video]**.
3. Pilih video musik viral sebagai **referensi timing**.
4. Geser trim handle untuk memilih bagian yang dijadikan template; preview → ✓.
5. Play video & **tambah beat point manual** di tempat foto/video harus berganti — pada cut/transisi/perubahan ritme yang terlihat.
6. Tinjau seluruh sekuens → tap **[Create]**.
7. Untuk berbagi → lihat artikel Share. Template BeatsClips ada di tab **[BeatsClips]** di home VN.

### FAQ
- **Kapan pakai video viral?** Saat ingin template ikut pacing & cut-timing video viral yang ada. (From Music = generate beat dari track langsung.)
- **Beat otomatis dari video?** Tidak — beat **ditambah manual** setelah trim, lalu preview timing sebelum buat.
- **Kenapa perlu save+upload file sebelum publish?** Template From Short Video dipublish via file yang bisa diunduh → save, upload ke cloud, tempel download link.
- **Di mana template setelah dibuat?** [Your Projects] → tab **[BeatsClips]** → bagikan via [VN Code] / [Share VNFlow File].

---

## 6. How to Create AI Template using CawCut

CawCut = bangun workflow AI kustom lalu jadikan template VN reusable, dibagikan via **QR code** (penerima tak perlu paham workflow-nya).

### Persiapan (`app.cawcut.com`)
1. Buka `app.cawcut.com` → daftar/sign in.
2. Pelajari **CawCut 101** (navigasi, model AI, node, workflow).
3. Bangun workflow untuk template (pemula: **Start with a Template**).
4. Jalankan workflow **minimal sekali** untuk verifikasi hasil.

### Buat VN Template
1. Buka workflow teruji di CawCut.
2. Pilih **Share** → **Create VN Template**.
3. Pilih input teks/gambar yang boleh diisi pengguna VN; pakai **Keep input** untuk konten yang sudah disertakan tetap.
4. Pilih output final (gambar/video) yang diterima pengguna.
5. Tambah nama, deskripsi, media preview; tinjau estimasi kredit & info berbagi.
6. Generate **QR code** VN Template.

> **Tip:** buat setup sederhana — hanya ekspos input yang perlu diubah, kembalikan output yang berguna.

### Uji & bagikan
1. Buka VN & scan QR seperti pengguna akhir.
2. Verifikasi tiap input punya nama & instruksi jelas.
3. Konfirmasi input dengan **Keep input** memakai konten yang disertakan.
4. Konfirmasi input wajib meminta teks/gambar pengguna.
5. Verifikasi template mengembalikan gambar/video yang benar.
6. Konfirmasi preview & estimasi kredit sesuai.
7. Publish: **Download QR Code** di CawCut → bagikan dengan nama & deskripsi singkat.

### FAQ
- **Perlu akun CawCut?** Ya — daftar/sign in di `app.cawcut.com`, buat & uji workflow.
- **Cara buat VN Template dari workflow?** Buka workflow teruji → Share → Create VN Template → atur input/output → isi info → generate & uji QR.
- **Keunggulan?** Kustomisasi penuh workflow AI, ulang proses sama dengan konten berbeda lewat app VN saat mobile.
- **Cara pengguna buka AI Template di VN?** Scan QR yang di-generate CawCut. Uji dulu QR di VN sebelum bagikan publik.

---

## 7. Create a VN Template With Flow

Pakai Flow saat struktur template berbasis **foto, video, frame, kolase, atau layout halaman** (photo dump, scrapbook, mood board, comparison, split-screen, slot media berulang). Flow menyiapkan komposisi + area replaceable; timing/transisi/audio/motion final di VN.

### Buat project Flow
1. Buka Flow → tap **[+]** untuk buat project.
2. Pilih rasio yang cocok dengan video final. Vertikal short-form → **Instagram Story (9:16)**.

### Tambah area foto/video replaceable

| Alat | Best for |
|---|---|
| **Frame** | Tambah frame luar / definisikan bentuk untuk media |
| **Layout** | Komposisi halaman jadi dengan 1+ placeholder media |
| **Grid** | Beberapa placeholder media dalam sel yang sudah ditentukan |

- **Frame:** [Elements] → tab **[Frames]** (ratusan) → pilih, atur; bisa banyak frame per halaman.
- **Layout:** tab **[Layouts]** → pilih sesuai jumlah & susunan area media.
- **Grid:** tab **[Grids]** → pilih susunan; grid auto-adaptasi rasio project, atur via titik putih di sudut.

### Tambah background halaman
1. Menu bawah → tombol **[background]** → pilih → lihat kesesuaian.
2. **Ubah warna:** tap background di preview → **[Color]** → pilih warna (bisa seluruh/sebagian background/elemen tertentu).
3. **Filter:** background Color Texture bisa diberi **[Filter]** → pilih & atur.
4. **Crop & opacity:** tombol **[Crop]** & **[Opacity]** untuk atur posisi/ukuran pola & transparansi.

### Halaman ganda
1. Swipe kanan→kiri di preview untuk tambah halaman; tombol halaman kanan-bawah tunjukkan jumlah & buka page management.
2. Di page management, tekan-tahan halaman untuk susun ulang.

> **Note:** setelah export ke VN, tiap halaman Flow jadi **section berdurasi terpisah** di video. Halaman berikutnya pakai background yang sama.

### Export & edit di VN
1. Tap **[Export]** di Flow.
2. Pilih **[Make a video with VN]**.
3. Di **[Video Duration Setting]**, pilih berapa detik tiap halaman Flow tampil.
4. Tap **[Save]** untuk buka di VN. Tiap halaman Flow = section terpisah di timeline.
5. Selesaikan edit & buat template (lihat artikel Create).

### FAQ
- **Jenis template terbaik untuk Flow?** Foto/video/kolase/split-screen/slot berulang/desain berbasis halaman. (Editing timeline detail/beat cut/efek kompleks → langsung VN.)
- **Placeholder Flow bisa foto ATAU video?** Ya, Frame/Layout/Grid menampung keduanya.
- **Beda Frame vs Layout vs Grid?** Frame = 1 area shaped; Layout = komposisi jadi + elemen desain; Grid = area dibagi jadi sel merata.
- **Satu project multi-scene?** Ya — 1 halaman Flow per scene; [Make a video with VN] impor berurutan, tiap halaman jadi section.
- **Di mana tambah musik/transisi/animasi?** Setelah export dengan [Make a video with VN], tambah di VN sebelum publish template.

---

## 8. How to Use VN Templates

### Template resmi
1. Tap ikon **[Discover]** di bawah.
2. Telusuri rekomendasi atau cari keyword.
3. Tap **[Download]**.
4. Tap **[Use]** untuk mulai isi.
5. Pilih media tiap slot → **[Next]**.
6. Preview di editor / full screen.
7. Tap tiap klip untuk sesuaikan: **[Replace]** / **[Filter]** / **[Crop]** / **[Volume]**.
8. Tap **[Save]** (simpan ke Projects).
9. Tap **[Export]**, pilih opsi **[Export Audio Only]** dan/atau **[HDR]** → **[Export]**.
10. Mode **[Manual]** untuk atur resolusi, frame rate, bitrate.

### Cari template baru
- IG @vnvideoeditor (Highlight **Creative Picks**); #vntemplate; @vn_templates_codes, @vn_codes, @vncodes.in.
- Situs pihak-3: vncodes.in, vntemplatecodes.com.
- Simpan gambar VN QR Code utuh atau unduh file `.vnt`.

### Pakai via QR Code
- **Scan:** buka VN → ikon **[Scan]** → scan QR → VN auto-deteksi & muat.
- **Download:** tombol **[Download]** (kanan bawah) → ikon **[Download]** (atas) → jika dari Google Drive, **[Download anyway]** setelah verifikasi enkripsi → **[Use]**.
- **Apply:** **[Use]** → pilih foto → (popup jika template pakai foto sama → konfirmasi) → **[Next]** → replace/filter/crop → export.

### Pakai via file `.vnt`
1. Tap file `.vnt` → buka di VN.
2. Bila diminta, masukkan password template → **[Confirm]**.
3. Tap **[Use]** → pilih foto/video → (popup foto-sama) → **[Next]** → replace/filter/crop → export.

### Lokasi template-mu
Home → seksi **[Template]**: **[Downloaded]** (yang diunduh) · **[Imported]** (dari scan VN Code / impor project file) · **[Mine]** (yang kamu buat & simpan).

### FAQ
- **Beda official / VN Code / .vnt?** Official = library [Discover]; VN Code = unduh & buka template kreator lain; .vnt = file template dibuka langsung. Keduanya bisa berisi batasan dari kreator.
- **Bisa edit setelah isi media?** Bisa replace/filter/crop/volume. Edit timeline penuh (urutan klip/transisi/teks/stiker) hanya jika kreator aktifkan **[Allow to Edit]**.
- **Kenapa tak bisa edit teks/transisi/stiker/urutan?** Kreator tak menjadikannya editable.
- **Kenapa tak bisa ubah rasio?** Kreator menonaktifkan **[Allow to Change Frame]**.
- **Kenapa foto/video ke-crop?** Bentuk media beda dari frame template → pakai **[Crop]** reposisi.
- **Kenapa suara asli video hilang?** Kreator menonaktifkan **[Keep User's Footage Audio]** → VN pakai audio template.
- **Popup "ganti foto sama di klip lain"?** Template pakai media sama di beberapa slot; memilih terapkan = ganti semua slot terkait sekaligus.
- **Beda [Save] vs [Export]?** [Save] = simpan sebagai project editable di Projects; [Export] = render video final ke galeri.
- **QR tak muat / unduh gagal?** Pastikan QR jelas, cek internet, rescan via [Scan]; jika link cloud, pemilik file harus izinkan akses; soal password/expired/batasan edit → hubungi kreator.
