# Peta Otomatisasi VN Video Editor

Referensi selector dan alur untuk mengotomasi **VN Video Editor**
(`com.frontrow.vlog`) lewat Appium/UiAutomator2, disusun untuk keperluan
pembuatan template video.

Dipetakan pada 27 Juli 2026 memakai `tests/ui-map.js`.

| | |
|---|---|
| Paket | `com.frontrow.vlog` |
| Versi saat dipetakan | 2.17.0 (versionCode 6989) |
| Perangkat | Infinix X662, viewport 1080x2156 |
| Bahasa aplikasi | Indonesia |

> **Koordinat bersifat spesifik perangkat.** Angka `@x,y` di dokumen ini
> hanya berlaku untuk resolusi di atas. Selalu utamakan selector
> (`content-desc` / `resource-id`); koordinat hanya untuk elemen yang tidak
> punya keduanya, atau untuk menghitung posisi grid.

---

## 1. Strategi selector

Editor VN mengekspos `content-desc` berupa identifier teknis yang **tidak
ikut berubah saat bahasa aplikasi diganti**. Ini selector paling andal:

```js
await $('~editor_toolbar_split').click();   // andal, bebas bahasa
await $('//*[@text="Pisah"]').click();      // rapuh, pecah kalau lokal berganti
```

Urutan prioritas yang disarankan:

1. `~content-desc` — dipakai seluruh toolbar editor
2. `//*[@resource-id="com.frontrow.vlog:id/<id>"]` — dipakai top bar, trek, dialog
3. Teks — hanya untuk elemen yang tidak punya keduanya, sadar risiko lokal
4. Koordinat — hanya untuk sel grid yang posisinya dihitung

**Hati-hati dengan `resource-id` yang dipakai ulang.** `tvTitle` dan
`tvName` muncul di banyak elemen berbeda pada layar yang sama, jadi
`resource-id` saja tidak cukup — kombinasikan dengan teks atau posisi.

### Wajib: setelan untuk UI beranimasi

Editor menampilkan pratinjau video yang terus bergerak, sehingga
UiAutomator tidak pernah menganggap layar *idle* dan gagal dengan
`null root node` setelah menunggu 10 detik. Panggil ini di awal sesi:

```js
await browser.updateSettings({
  waitForIdleTimeout: 100,
  enforceXPath1: true,
});
```

---

## 2. Rantai navigasi

| # | Activity | Aksi keluar |
|---|---|---|
| 1 | `.ui.firsttime.FirstTimeActivity` | `ivClose` @79,150 |
| 2 | `.ui.main.MainActivity` | `home_project_create` @906,1985 |
| 3 | `.ui.creation.CreationActivity` | `createKit_create_newProject` @540,761 |
| 4 | dialog *Mode Edit Proyek* | `clVideoBase` / `clMusicBase` lalu `tvSave` |
| 5 | `com.frontrow.videoeditor.ui.matisse.VideoEditorMatisseActivity` | `material_next` @945,1841 |
| 6 | `com.frontrow.videoeditor.editor.EditorActivity` | — editor utama |

### Jebakan: `FirstTimeActivity` bukan beranda

Layar pertama setelah instalasi menyamar sebagai beranda. Seluruh kartu
fiturnya — termasuk **"Buat Template"** — membuka dokumentasi di
`InternalBrowserActivity`, **bukan** alat yang sesungguhnya.

**Layar ini bukan sekali seumur instalasi.** Ia muncul lagi setiap kali
proyek habis — terpantau kembali tampil setelah proyek terakhir dihapus.
Jadi otomatisasi yang membersihkan proyeknya sendiri (bagian 11) akan
menemuinya lagi pada siklus berikutnya. Periksa activity yang aktif,
jangan mengasumsikan salah satunya:

```js
const act = await browser.getCurrentActivity();
if (act.includes("firsttime")) {
  await $('//*[@resource-id="com.frontrow.vlog:id/ivClose"]').click();
}
```

### Catatan WebView

`InternalBrowserActivity` hanya memaparkan konteks `NATIVE_APP` —
WebView-nya tidak *debuggable*, jadi Appium tidak bisa beralih ke
selector web. Isinya tetap terbaca lewat pohon aksesibilitas, sehingga
otomatisasi di layar itu harus mengandalkan teks dan koordinat.

---

## 3. Beranda (`MainActivity`)

| Elemen | resource-id | Posisi |
|---|---|---|
| Buat proyek (FAB) | `home_project_create` | @906,1985 |
| Pencarian | `home_search` | @540,345 |
| Pindai QR template | `ivScan` | @834,207 |
| Menu lainnya | `ivMore` | @984,207 |
| Tab bawah: Proyek | `home_projects` | @108,2191 |
| Tab bawah: Discover | `flItemDiscover` | @324,2191 |
| Tab bawah: Tutorial | `flItemTutorial` | @540,2191 |
| Tab bawah: Pro | `flItemPro` | @756,2191 |

Tab kategori (berbasis teks): `Proyek`, `Bekerja`, `AI Assets`,
`Templat`, `BeatsClips`.

`ivScan` relevan untuk alur template: VN membagikan template lewat kode
QR atau berkas terenkripsi.

---

## 4. Hub tools (`CreationActivity`)

| Elemen | Selector | Posisi |
|---|---|---|
| Video Baru | `createKit_create_newProject` | @540,761 |
| Kolase | `flCollageCard` | @287,1205 |
| AutoCut | `flAutoCutCard` | @794,1205 |
| Sisa kuota proyek | `tvProjectLimit` | @540,864 |
| Upgrade VN Pro | `flUpgradeVnPro` | @540,1007 |

Grid **Tools** memakai `tvTitle` yang berulang, jadi pilih berdasarkan
teks: `AI Cutout`, `Teleprompter`, `BeatsClips`, `Buat Template`,
`Overlay`, `Cerita`, `Teks ke Gambar`, `Tingkatkan Potret`,
`Perbesar Gambar`.

---

## 5. Dialog Mode Edit Proyek

Muncul sebelum editor terbuka dan **menentukan seluruh alur kerja**.

| Elemen | resource-id | Posisi |
|---|---|---|
| Berbasis Video | `clVideoBase` | @540,1410 |
| Berbasis Musik | `clMusicBase` | @540,1691 |
| Jangan tanya saya lagi | `checkBox` | @90,1897 |
| Simpan | `tvSave` | @540,2032 |

- **Berbasis Video** — klip dan foto dikurasi lebih dulu.
- **Berbasis Musik** — musik dipilih lebih dulu, klip menyesuaikan beat.
  Inilah jalur yang dirujuk dokumentasi VN untuk template berbasis musik.

**Jangan centang `checkBox`.** Membiarkan dialog tetap muncul membuat
skrip bisa memilih mode secara eksplisit di setiap proyek. Sekali
dicentang, mode terkunci ke preferensi dan hanya bisa diubah lewat
*Pengaturan > Preferensi*.

> **Mengetuk `clVideoBase`/`clMusicBase` hanya _memilih_ mode, belum
> melanjutkan.** Harus disusul ketukan **`tvSave` ("Simpan", @540,2032)**
> untuk membuka pemilih media. Terverifikasi 2026-07-28: tap mode saja →
> dialog tetap terbuka; tap mode lalu Simpan → `VideoEditorMatisseActivity`.

---

## 6. Pemilih media (`VideoEditorMatisseActivity`)

| Elemen | resource-id | Posisi |
|---|---|---|
| Kembali | `back` | @60,168 |
| Filter: Semua | `button_all` | @285,486 |
| Filter: Video | `button_video` | @563,486 |
| Filter: Foto | `button_photo` | @819,486 |
| Jumlah terpilih | `tvSelectedCount` | @259,1837 |
| Lanjut | `material_next` | @945,1841 |

### Geometri grid

Grid tiga kolom dengan jarak tetap, sehingga klip ke-N bisa **dihitung**:

- Kolom (x): `179`, `540`, `901`
- Baris pertama `check_view` (y): `624`, jarak antarbaris `427`
- `media_thumbnail` berada 113px di bawah `check_view` pada baris yang sama

```js
const COL = [179, 540, 901];
const posisiCheck = (i) => ({
  x: COL[i % 3],
  y: 624 + Math.floor(i / 3) * 427,
});
```

Ketuk `check_view` untuk memilih, lalu **verifikasi lewat
`tvSelectedCount`** sebelum menekan `material_next` — jangan berasumsi
ketukan selalu berhasil.

---

## 7. Editor (`EditorActivity`)

### Top bar

| Fungsi | resource-id | Posisi |
|---|---|---|
| Kembali | `editor_topbar_back` | @72,198 |
| Bantuan | `ivHelp` | @213,198 |
| Rasio aspek | `llFrameType` (nilai di `tvFrameType`) | @540,198 |
| Lainnya | `tvBtnMore` | @729,198 |
| Simpan | `editor_topbar_save` | @858,198 |
| Ekspor | `editor_topbar_export` | @996,198 |

### Pemutar dan riwayat

| Fungsi | resource-id | Posisi |
|---|---|---|
| Putar / jeda | `imageView_multiple_video_play` | @540,1325 |
| Posisi playhead | `current_textView` | @60,1325 |
| Durasi total | `total_textView` | @143,1325 |
| Seek bar | `multiple_video_seekBar` | @540,1285 |
| Preferensi editor | `ivEditorPreference` | @837,1319 |
| Undo | `imageView_menu_undo` | @936,1319 |
| Redo | `imageView_menu_redo` | @1026,1319 |
| Layar penuh | `ivSetupFullScreen` | @1002,1178 |

`current_textView` dan `total_textView` terbaca sebagai teks, jadi durasi
hasil edit bisa **diverifikasi** oleh skrip, bukan diasumsikan. `undo`
berguna sebagai pemulihan saat sebuah langkah otomatisasi meleset.

### Penambah trek

| Trek | resource-id | Posisi |
|---|---|---|
| Musik | `editor_track_music_add` | @450,1445 |
| Subtitle | `editor_track_subtitle_add` | @450,1559 |
| Stiker | `editor_track_sticker_add` | @450,1673 |
| Klip utama | `editor_track_main_add` | @450,1832 |
| Sampul | `flCoverAdd` | @264,1832 |
| Status audio timeline | `ivTimelineAudioState` | @450,1952 |
| Durasi item terpilih | `tvTimelineItemDuration` | @593,1895 |

### Toolbar — 21 tool

Diakses lewat `~content-desc`. Toolbar **bergulir horizontal**; tool di
sebelah kanan perlu di-scroll dulu. Urutan sesuai tampilan:

| # | content-desc | Label (id) | # | content-desc | Label (id) |
|---|---|---|---|---|---|
| 1 | `editor_toolbar_filter` | Filter | 12 | `editor_toolbar_background` | Background |
| 2 | `editor_toolbar_trim` | Trim | 13 | `editor_toolbar_imageBorder` | Berbatasan |
| 3 | `editor_toolbar_FX` | FX | 14 | `editor_toolbar_imageBlur` | Blur |
| 4 | `editor_toolbar_split` | Pisah | 15 | `editor_toolbar_alpha` | Kegelapan |
| 5 | `editor_toolbar_flowStudio` | Flow | 16 | `editor_toolbar_clipZoom` | Perbesar |
| 6 | `editor_toolbar_BGRemove` | Memotong | 17 | `editor_toolbar_mosaic` | Mosaik |
| 7 | `editor_toolbar_crop` | Potong | 18 | `editor_toolbar_magnifier` | Pembesar |
| 8 | `editor_toolbar_rotate` | memutar | 19 | `editor_toolbar_AIKit` | AI Kits |
| 9 | `editor_toolbar_flipHorizontal` | Cermin | 20 | `editor_toolbar_story` | Cerita |
| 10 | `editor_toolbar_flipVertical` | Balik | 21 | `editor_toolbar_toPiP` | Trek Overlay |
| 11 | **tidak ada** (lihat di bawah) | Mengisi | | | |

#### Kekecualian: tool "Mengisi" tidak punya `content-desc`

Terverifikasi lewat dua dump terpisah: dari 21 tool, hanya "Mengisi" yang
simpul induknya bernilai `content-desc=""`. Ini celah pelabelan di VN
sendiri, bukan kegagalan pembacaan.

Posisinya di antara `flipVertical` dan `background` bersifat tetap, jadi
selector paling andal adalah lewat saudara-berikutnya — tetap bebas
bahasa seperti tool lainnya:

```js
const fill = await $(
  '//*[@content-desc="editor_toolbar_flipVertical"]/following-sibling::*[1]'
);
```

Terverifikasi resolve ke elemen berukuran `165x216`, sama dengan seluruh
tool toolbar lain.

> **Jangan memilihnya lewat label.** XPath seperti
> `//android.view.ViewGroup[.//*[@text="Mengisi"]]` memang menemukan
> elemen, tetapi yang dikembalikan adalah container root berukuran
> `1080x2156`, karena `.//` cocok dengan leluhur mana pun yang memuat
> label tersebut. Ketukan akan mendarat di tengah layar, bukan di tool.
> Selalu verifikasi ukuran elemen hasil XPath sebelum mengetuknya.

Menggeser toolbar:

```js
await browser.action("pointer")
  .move({ x: 950, y: 2156 }).down()
  .move({ duration: 400, x: 150, y: 2156 }).up()
  .perform();
```

---

## 8. Pola editing dan parameternya

Bagian ini merekam pola edit yang **benar-benar dijalankan dan
diverifikasi**, bukan sekadar tombol yang terlihat.

### Verifikasi hasil edit — pakai durasi, bukan asumsi

Timeline memaparkan durasi sebagai teks yang bisa dibaca balik, dan
inilah cara paling murah memastikan sebuah langkah otomatisasi
benar-benar berhasil:

- `total_textView` — durasi seluruh proyek
- `tvTimelineItemDuration` — durasi **per klip**, satu simpul per klip

Contoh terverifikasi: proyek dua klip @3 detik menunjukkan
`total_textView` = `6.00` dengan dua `tvTimelineItemDuration` bernilai
`3.00`. Setelah klip pertama dipangkas jadi 1 detik, nilainya berubah
menjadi `4.00` dengan `1.00` dan `3.00`. Bandingkan nilai sebelum dan
sesudah, jangan percaya bahwa ketukan pasti berhasil.

### Trim — `VideoTrimActivity`

Membuka Trim berpindah ke **activity tersendiri**, jadi periksa
perpindahannya sebelum mencari elemen panel.

| Fungsi | resource-id | Posisi |
|---|---|---|
| Klip sebelumnya | `ivPreSlice` | @84,1337 |
| Indikator klip ke-n | `tvSliceIndex` (mis. `1/2`) | @541,1337 |
| Klip berikutnya | `ivNextSlice` | @996,1337 |
| **Durasi (dapat diketik)** | `etTotalRangeTimeS` | @930,1521 |
| Durasi asli klip | `tvTotalRangeTimeUs` | @543,1807 |
| Batal | `ivCancel` | @189,2174 |
| Terapkan | `ivDone` | @891,2174 |

Preset durasi: `tvTrimOriginal` (Asli), `tvTrim01s` (0.1s),
`tvTrim03s` (0.3s), `tvTrim1s` (1s), `tvTrim25s` (2.5s).

`etTotalRangeTimeS` adalah **EditText**, jadi durasi bisa diketik persis
alih-alih digeser — jalur paling akurat untuk template yang menuntut
panjang klip tertentu. `tvSliceIndex` memberi tahu sedang di klip ke
berapa dari total berapa, berguna untuk melooping seluruh klip.

Terverifikasi: menekan `tvTrim1s` mengubah `etTotalRangeTimeS` dari
`3,00s` menjadi `1,00s`, dan setelah `ivDone` durasi total proyek turun
dari `6.00` ke `4.00`.

> **Jebakan pemisah desimal.** Panel Trim memakai **koma** (`1,00s`)
> mengikuti lokal Indonesia, sementara timeline memakai **titik**
> (`1.00`). Dalam satu aplikasi yang sama. Normalkan sebelum parsing:
> `parseFloat(teks.replace(",", "."))`.

### Filter dan intensitas

Panel Filter berupa *bottom sheet* di dalam `EditorActivity` (bukan
activity baru).

| Fungsi | resource-id | Posisi |
|---|---|---|
| Tab Filter | `tvFilter` | @316,1448 |
| Tab Menyesuaikan | `tvFilterManual` | @677,1448 |
| Bandingkan sebelum/sesudah | `ivExamine` | @999,1607 |
| SeekBar intensitas | `sbIntensity` | track `[256,1970]`–`[944,2084]` |
| Nilai intensitas | `tvIntensity` | @990,2027 |
| **Terapkan ke semua klip** | `tvApplyToAll` | @541,2174 |
| Batal / Terapkan | `ivCancel` / `ivDone` | @189,2174 / @891,2174 |

`tvApplyToAll` menerapkan filter ke seluruh klip sekaligus — jauh lebih
murah daripada melooping tiap klip untuk template bergaya seragam.

**Menyetel intensitas.** Track membentang `x` dari `256` sampai `944`
(lebar `688`) pada `y = 2027`, dan pemetaannya linear:

```js
const xUntukNilai = (v) => Math.round(256 + (v / 100) * 688);
// nilai 50 -> x 600 (terverifikasi: tvIntensity berubah 100 -> 50)
```

> **Durasi geseran penting.** Geseran 300 ms tidak mengubah apa pun;
> 900 ms berhasil. SeekBar mengabaikan gestur yang terlalu cepat, dan
> kegagalannya senyap — nilainya sekadar tidak berubah. Selalu baca
> `tvIntensity` untuk memastikan.

> **Pilihan filter tidak terbaca.** Seluruh thumbnail (`Asli`, `A1`…`A4`)
> tetap `selected="false"` meskipun sudah dipilih; VN menggambar
> penandanya tanpa memaparkannya ke pohon aksesibilitas. Jadi filter mana
> yang aktif **tidak bisa diverifikasi** lewat selector — yang bisa
> diverifikasi hanya nilai intensitasnya.

### Transisi antarklip

**Transisi tidak punya selector.** `rvTimeline` adalah satu `View`
tunggal tanpa anak — timeline digambar sebagai kanvas, sehingga penanda
transisi tidak muncul di pohon aksesibilitas sama sekali. Satu-satunya
jalan adalah mengetuk **koordinat titik sambungan** antara dua klip.

Cara menemukan titik itu: gulir timeline sampai kedua klip terlihat,
lalu baca `waveformViewAudio` masing-masing klip — sambungannya berada
di antara ujung kanan waveform pertama dan ujung kiri waveform kedua.
Ketuk pada `y` sekitar `1850`.

Setelah panel terbuka:

| Fungsi | resource-id | Posisi |
|---|---|---|
| Tab Normal | `tvNormalTransition` | @264,1675 |
| Tab Matte | `tvMaskTransition` | @568,1675 |
| Tab Efek | `tvAITransition` | @844,1675 |
| Nama transisi | `textView_transition_name` | baris @1931 |
| SeekBar durasi | `seekBar_transition_duration` | track `[194,1970]`–`[921,2084]` |
| Nilai durasi | `textView_transition_duration` | @986,2027 |
| Terapkan ke semua | `tvApplyToAll` | @541,2174 |
| Batal / Terapkan | `ivCancel` / `ivDone` | @189,2174 / @891,2174 |

Daftar transisi pada tab Normal berjarak teratur **192px**: `Tidak ada`
@144, `Hitam` @336, `Putih` @528, `Perbesar 1` @720, `Zoom 2` @912,
`Larutkan 1` @1057 — semuanya pada `y = 1931`, dan bergulir horizontal.

Terverifikasi: memilih `Hitam` mengubah durasi dari `0.0s` ke **`0.8s`**
(nilai default saat transisi dipasang). Rentangnya **0.2s sampai 3.0s**,
diukur dengan menggeser ke kedua ujung track:

```js
const xUntukDurasi = (d) => Math.round(194 + ((d - 0.2) / 2.8) * 727);
```

`tvApplyToAll` memasang transisi yang sama di seluruh sambungan
sekaligus — jauh lebih murah untuk template daripada mengetuk tiap
sambungan satu per satu.

### Musik — `MusicManageActivity`

Dibuka lewat `editor_track_music_add`, lalu pilih **Musik** @190,2042
pada panel *Memasukkan* (opsi lain: **Efek** @540,2042, **Merekam**
@890,2042; ketiganya tanpa resource-id, pilih lewat teks).

> Tombol trek bergeser mengikuti gulungan timeline. Pada timeline yang
> tergulir, `editor_track_music_add` pindah dari @450 ke @90. Petakan
> ulang sebelum mengetuk, jangan menghafal koordinatnya.

| Elemen | resource-id | Posisi |
|---|---|---|
| Kembali | `ivBack` | @84,192 |
| Tab Musik / Favorit / Milikmu | `tvTabName` | @180 / @540 / @900, y 414 |
| Pencarian | `flSearch` | @540,591 |

Grid genre tiga kolom pada `x` ≈ `200`, `531`, `864` dengan jarak baris
`372`: Vlog, Pop, Dynamic, Fresh, Acoustic, Electronic, Hip-Hop.

Tab **Milikmu** memuat berkas audio milik sendiri — jalur yang relevan
bila template harus memakai musik tertentu, bukan katalog bawaan.

### Kecepatan — TIDAK DITEMUKAN

Kontrol kecepatan klip **tidak ada** pada permukaan yang sudah
ditelusuri di VN 2.17.0. Yang sudah diperiksa dan nihil: seluruh 21 tool
toolbar (digulir sampai ujung), `VideoTrimActivity`, menu `tvBtnMore`,
seleksi klip biasa, dan tekan-lama pada klip.

`editor_toolbar_flowStudio` ("Flow") terlihat menjanjikan karena istilah
*flow* biasa dipakai untuk *speed ramping*, tetapi mengetuknya hanya
memunculkan dialog **"Silakan instal atau perbarui Flow Studio ke versi
terbaru"** — Flow Studio adalah aplikasi pendamping terpisah, bukan
fitur bawaan.

Kemungkinan yang tersisa: fitur ini eksklusif VN Pro, atau memang
ditiadakan pada versi ini. Perlu penelusuran ulang bila nanti dibutuhkan.

### Toolbar berubah menurut konteks

Daftar 21 tool di bagian 7 bukan himpunan tetap. Contoh terverifikasi:
`editor_toolbar_delete` **hanya muncul ketika proyek berisi lebih dari
satu klip** — masuk akal, karena klip tunggal tidak dapat dihapus.

Konsekuensinya, skrip tidak boleh mengasumsikan posisi indeks pada
toolbar. Selalu pilih lewat `~content-desc`, dan periksa keberadaannya
dulu sebelum mengetuk.

---

> **Seksi 8a–8d dipetakan mengikuti kurikulum ebook _"VN Video Editor
> User Guide for Beginners"_ (Sawyer Kline, KDP 2026):** editing lanjutan
> (keyframe/freeze), green screen, overlay, dan teks/caption. Semua
> selector di bawah terverifikasi di VN 2.17.0 pada sesi 2026-07-28.

### 8a. Deret aksi cepat klip — keyframe, kunci, duplikat

Saat sebuah klip **dipilih** (ketuk klip di trek utama, mis. @620,1850),
muncul deret tombol melayang tepat di atas toolbar (y≈1611–1672) yang
**tidak ada** saat tidak ada klip terpilih. Inilah pintu keyframe.

| Fungsi | resource-id | Label (id) | Posisi |
|---|---|---|---|
| Ganti klip | `ivReplace` | "Menggantikan" | @210,1627 |
| **Keyframe (tambah/hapus di playhead)** | `ivKeyframe` | `tvKeyframeState` = "Bingkai utama" | @342,1627 |
| **Kurva keyframe** | `flKeyframeCurve` | `tvKeyframeCurve` = "Melengkung" | @474,1627 |
| Kunci trek | `flLock` | `tvLock` = "Kunci" | @606,1611 |
| Duplikat | `ivDuplicate` | "Duplikat" | @738,1611 |
| Hapus klip | `ivSliceDelete` | "Hapus" | @870,1611 |

- `ivKeyframe` bersifat **toggle di posisi playhead**: ketukan pertama
  menambah keyframe untuk state transform saat ini, ketukan berikutnya di
  titik yang sama menghapusnya. Verifikasi lewat `tvKeyframeState`.
- **`flKeyframeCurve` ("Melengkung") tidak membuka panel** kecuali
  playhead **tepat berada di atas sebuah keyframe** yang sudah ada.
  Diketuk tanpa keyframe di playhead → tidak terjadi apa-apa (tetap di
  layar editor, tidak ada dialog). Untuk otomatisasi kurva: tambah
  keyframe dulu, pindahkan playhead ke keyframe itu, baru ketuk.
- **Freeze frame TIDAK ADA sebagai fitur diskrit di VN 2.17.0** (ditelusuri
  menyeluruh 2026-07-28, lihat 8e).
- Deselect klip: **tekan `KEYCODE_BACK` satu kali** (bukan mengetuk area
  pratinjau — itu tidak men-deselect). Back di sini hanya melepas seleksi,
  tidak keluar editor.

### 8b. Green screen / potong latar — `editor_toolbar_BGRemove`

Tool toolbar #6 ("Memotong", @884,2156 pada layout awal). Ini **cutout
berbasis AI**, padanan green-screen VN (chroma-key warna murni tidak
ditemukan sebagai tool terpisah di 2.17.0). Membuka panel penuh
(bukan dialog); `count` node ~26.

| Fungsi | resource-id | Posisi |
|---|---|---|
| Tutup (batal) | `ivClose` | @90,165 |
| Selesai (terapkan) | `tvDone` | @950,166 |
| Toggle warna latar | `ivToggleBackgroundColor` | @78,1694 |
| Toggle visibilitas hasil | `ivRemoveBgVisible` | @1002,1694 |
| Undo / Redo | `ivUndo` / `ivRedo` | @72,1849 / @216,1849 |
| Pulihkan pintar | `tvSmartRestore` | @981,1849 |
| **Penghapusan Cepat** | `tvSmartRemoval` | @168,2041 |
| **Ubah Area** | `tvModifyArea` | @354,2006 |
| **Stroke Pemotongan** | `tvCutoutStroke` | @540,2023 |
| **Balik seleksi** | `tvInvert` | @726,2006 |
| **AI Potongan** | `tvAICutout` | @912,2023 |
| Simpan guntingan ke perpustakaan | `llSaveMaterial` | @540,2195 |

### 8c. Overlay / PiP — `editor_toolbar_toPiP`

Tool toolbar #21 ("Trek Overlay"), ada di **ujung kanan** — toolbar
bergulir horizontal, perlu 3× swipe kiri (`input swipe 950 2156 150 2156
400`) dari posisi awal untuk memunculkannya. Bounds setelah discroll:
@988,2102.

Mengetuknya **tidak membuka panel** — ia langsung **memindahkan klip
terpilih dari trek utama ke trek overlay/PiP baru**. Sesudahnya elemen
overlay itu jadi klip aktif dengan deret aksi cepat sendiri (lihat 8a)
dan bisa diposisikan/diskalakan lewat gestur di pratinjau. Verifikasi
keberhasilan: `tvTimelineItemDuration` tetap ada dan toolbar berubah
konteks (mis. `editor_toolbar_story` muncul menggantikan tool lama).

### 8d. Teks & caption — `editor_track_subtitle_add`

Tombol "+" pada lajur subjudul di penambah trek (@450,1559, bounds
`[402,1511][498,1607]`). **Harus tanpa klip terpilih** agar tak tertutup
deret aksi 8a. Mengetuknya memunculkan popup kecil (dengan
`flDimmedBackground`) berisi dua pilihan:

| Pilihan | resource-id | Posisi |
|---|---|---|
| Tambah teks manual | `flAddSubtitle` | @292,1952 |
| Impor subtitle dari SRT | `flAddAddSubtitlesFormSRT` | @787,1952 |

`flAddSubtitle` membuka **panel pemilih gaya teks** (bottom sheet,
`viewDragTop` + `touch_outside`). UI-nya **beranimasi** → `uiautomator
dump` mentah gagal (`ERROR: could not get idle state`); **wajib pakai
`tests/ui-map.js`** (yang men-set `waitForIdleTimeout: 100`).

| Elemen | resource-id | Posisi |
|---|---|---|
| Cari template teks | `etSearch` | @594,291 |
| Tambahkan judul | `tvHead` | @540,658 |
| Tambahkan subjudul | `tvSubHead` | @540,865 |
| Tambahkan sedikit teks isi | `tvBody` | @540,1042 |
| Kategori + jumlah | `tvTitle` / `tvCount` | mis. "Default (14)" @147,1209 |
| Lihat Selengkapnya (per kategori) | `tvSeeAll` | @833,1209 (dst) |
| Kartu template teks | `rootView` | grid 3 kolom @240/648/978, baris @1459/1969 |

Kategori terverifikasi di 2.17.0: **Default (14)**, **Penutup (12)**,
**Judul (12)** — masing-masing dengan `tvSeeAll`. `tvHead`/`tvSubHead`/
`tvBody` = jalur tercepat menambah teks polos tanpa memilih template
(padanan "text with animations" di ebook).

### 8e. Freeze frame & Kecepatan — TIDAK ADA di VN 2.17.0

Ebook mencantumkan **freeze frame** sebagai editing lanjutan, tapi
penelusuran menyeluruh (2026-07-28) memastikan **fitur ini tidak tersedia
sebagai tombol diskrit di VN 2.17.0 Android**. Surface yang sudah dicek
dan semuanya buntu:

- Toolbar 21-tool (tidak ada content-desc/label freeze maupun kecepatan).
- Deret aksi cepat klip (8a) — hanya replace/keyframe/curve/lock/duplicate/delete.
- **Tekan-lama klip** (`input swipe x y x y 900`) — masuk mode drag-reorder,
  bukan context-menu.
- Layar **Trim** (`VideoTrimActivity`) — hanya pengatur durasi ("Asli",
  preset 0.1s/0.3s/1s/2.5s/3.00s), tanpa freeze/kecepatan.
- Menu proyek **`tvBtnMore`** — hanya `ivRename`/`etTitle` (rename),
  `tvCreateTemplate`, `tvShare` ("Bagikan File Proyek VN").

**Kesimpulan: freeze frame & kecepatan (speed) benar-benar tidak ada di
build ini.** Konsisten dengan temuan "Kecepatan — TIDAK DITEMUKAN" di
bagian 8.

> **KOREKSI (2026-07-28):** dugaan awal bahwa freeze/speed "di-gate di
> balik Flow Studio" **SALAH** dan sudah dibuktikan langsung. Tool **"Flow"**
> (`editor_toolbar_flowStudio`) BUKAN suite time-remap. Setelah memasang
> Flow Studio (`com.frontrow.flow` v1.8.1) dan mengetuk "Flow" di editor,
> yang terbuka adalah **editor desain grafis Flow Studio**
> (`com.frontrow.flow/.ui.editor.FlowEditorActivity`) — tool: Foto, Frames,
> Shapes, Teks, Tempel, dengan tombol **"Apply to VN"** dan dialog keluar
> **"Back to VN / Stay at Flow Studio"**. Jadi "Flow" = **integrasi desain
> grafis** (buat grafik/overlay di Flow Studio → terapkan ke video VN),
> mirip Canva; sama sekali tidak berhubungan dengan speed/freeze. Freeze &
> speed tidak dipindah ke mana pun — memang absen dari VN 2.17.0.

**Flow Studio (`com.frontrow.flow`) — companion desain grafis, dipetakan singkat:**
- Developer sama (Ubiquiti Labs, LLC), Play Store, 128MB, kategori Seni & Desain.
- `FirstTimeActivity`: `flCreateNewProject` ("Create Design") + galeri template
  berkategori (Happy Birthday, Filter, Travel, Eid al-Fitr, "Baru (100)").
- `CreationActivity`: pilihan ukuran kanvas — `1080x1080`/`1080x1920`/`5120x1080`
  px + ukuran cetak inci (7x9/8x6/8x8) + `tvCustomSize` + pemilih foto (`rvAlbum`).
- `FlowEditorActivity`: toolbar desain — Elemen, Foto, Frames, Gaya, Graphics,
  Grids, Impor, Latar belakang, Layouts, Teks (kanvas gambar statik, bukan
  timeline video).

### 8f. Sub-panel tool klip lain (FX, Background, AIKit, Mosaik, Pembesar)

Dipetakan 2026-07-28, VN 2.17.0. Semua muncul saat **klip dipilih** lalu
tool diketuk dari toolbar (banyak butuh scroll horizontal — pilih via
`~content-desc`, jangan indeks). Pola umum panel: `ivCancel` @189,2174 (batal)
dan `ivDone` @891,2174 (terapkan); beberapa punya `tvApplyToAll`
("Terapkan semua").

**FX** (`editor_toolbar_FX`, @362,2156 posisi awal) — galeri efek gerak,
di-scroll horizontal. Efek lewat `tvName`: `None`, `Spin 01`–`04`, `Drop 01`,
dst. Ada navigasi antar-klip: `ivPreSlice` @84,1337 / `tvSliceIndex` ("1/1")
/ `ivNextSlice` @996,1337. Bar bawah: `ivCancel`, `ivEditorPlay` @334,2174,
`tvApplyToAll` @613,2174, `ivDone`.

**Background** (`editor_toolbar_background`) — latar kanvas di belakang klip
(saat klip tak memenuhi frame). Tab: `tvImage` "Gambar" @228,1747,
`tvColor` "Warna" @543,1747, `tvGradient` "Gradien" @856,1747. + `tvApplyToAll`.

**AIKit** (`editor_toolbar_AIKit`) — bottom sheet (`viewDragTop`) berisi grid
efek **AI generatif/enhancement** (label teks, TANPA resource-id — selektor
by-text/koordinat): Enhance Photo, Enhance Portrait, Upscale Image, Image
Generation, Image to Image, Era Look, Figurine Maker, Expression Sticker,
Artistic Styles, Anime Style, AI Portrait Duo, Halloween, Lighting Style,
HairSwap Women/Men. (Ini AI berbasis gambar; AI caption ada di jalur subtitle
8d, AI cutout/bg-removal di 8b.) Tutup sheet: `KEYCODE_BACK`.

**Mosaik** (`editor_toolbar_mosaic`) — sensor/piksel. Gaya (`tvName`):
`Mosaik` @252,1741, `Segitiga`, `Segi enam`, `Blur` @828,1741. Slider
`sbSize` (label `tvSizeLabel` "Ukuran", nilai `tvSizeValue`, default 20).

**Pembesar/Magnifier** (`editor_toolbar_magnifier`) — efek lensa lup. Bentuk
(`tvName`): `Bulat`, `Persegi 1`, `Persegi 2`, `Gaya 1`, `Gaya 2`. Dua slider:
`sbZoom` (`tvZoomLabel` "Zoom", default 25) & `sbBorder` (`tvBorderLabel`
"Berbatasan", default 40).

> **Coach-mark "Snap ke Objek Terdekat":** saat pertama memilih klip di sesi
> baru bisa muncul tip `tvSnapSetting` dgn tombol `tvGotIt` ("Mengerti"
> @540,2135). Tutup dulu sebelum melanjutkan — kalau tidak, ketukan tool
> berikutnya nyasar ke dialog tip ini.

### 8g. Sub-panel tool klip: clipZoom, imageBorder, imageBlur, alpha, story

Dipetakan 2026-07-28, VN 2.17.0. Semua saat **klip dipilih**, di ujung
kanan toolbar (perlu beberapa swipe). Pola panel sama: `ivCancel` @189,2174,
`ivDone` @891,2174, sebagian ada `tvApplyToAll`.

**clipZoom** (`editor_toolbar_clipZoom`, "Perbesar") — gerak preset ala Ken
Burns pada klip. Opsi (`tvName`, di-scroll horizontal): `Tidak ada`,
`Perkecil`, `Perbesar`, `Pindah ke kanan`, `Pindah ke kiri`, `Pindah ke
bawah` (+ atas). + `tvApplyToAll`.

**imageBorder** (`editor_toolbar_imageBorder`, "Berbatasan") — bingkai/border
klip. Slider `sbBorderWidth` (label `tvBorderWidthLabel` "Lebar", nilai
`tvBorderWidth`, default 0). + `tvApplyToAll`.

**imageBlur** (`editor_toolbar_imageBlur`, "Blur") — buramkan klip. Tipe
(`tvType`): `Tidak ada`, `Dasar`, `Horizontal`, `Vertikal`, `Radioaktif`
(radial). Intensitas: `sbBlur` (label `tvBlurTitle`) + `etBlurSize` (nilai
%-editable, default 30%).

**alpha** (`editor_toolbar_alpha`, "Kegelapan") — opasitas klip. Slider
tunggal `sbAlpha` (label `tvAlpha` "Kegelapan", nilai `tvAlphaValue`,
default 100%).

**story** (`editor_toolbar_story`, "Cerita") — BUKAN panel bawah, membuka
activity penuh **`...storyline.StorylineComposeActivity`** (komposer
storyboard/narasi). Elemen: `ivBack` @75,198, `ivMore` @1005,198, toggle
`sbTitleAsTransition` ("Gunakan judul sebagai transisi"), per-klip
`ivThumbnail` + `tvDuration` + `etMediaDescription` ("Jelaskan Video atau
Foto ini") + `ivDelete`, `llAddStory` ("Tambah Bagian"), dan `tvStoryNext`
("Selesai" @548,2159). Dipakai untuk menyusun video jadi bagian-bagian
berdeskripsi (bahan narasi/AI).

### 8h. crop, rotate, flip, fill — 21/21 tool toolbar TUNTAS

Dipetakan 2026-07-28, VN 2.17.0. Melengkapi seluruh 21 tool.

**crop** (`editor_toolbar_crop`) — buka activity penuh
**`...editorwidget.crop.CropActivity`**. Rasio (`tvFrameTypeName`, scroll):
`Asli`, `Bebas` (free-crop lewat handle di pratinjau), `9:16`, `1:1`, `16:9`
(+ lainnya). Ada `ivMirror` ("Cermin") @858,228 & `ivFlip` ("Balik") @996,228,
scrubber `sbProgress`, dan bar bawah `imageView_crop_cancel` @177,2159 /
`imageView_crop_reset` @540,2159 / `imageView_crop_done` @903,2159.

**rotate** (`editor_toolbar_rotate`) — **aksi instan +90°** tiap ketuk
(terverifikasi via screenshot: watermark klip ikut miring). Karena rotasi
bisa membuat area kosong, VN langsung memunculkan **panel background-fill**
(tab Gambar/Warna/Gradien, sama dgn tool Background di 8f) + `tvApplyToAll`.

**flipHorizontal / flipVertical** (`editor_toolbar_flipHorizontal` /
`editor_toolbar_flipVertical`) — **mirror instan** (horizontal/vertikal).
Hanya memunculkan bar minimal `ivCancel` @189,2174 / `ivDone` @891,2174
(tanpa panel background, karena flip tak membuat area kosong).

**fill (Mengisi/Cocok)** — tool #11, **satu-satunya tool TANPA `content-desc`**
(celah pelabelan VN). Ambil via `following-sibling` dari
`editor_toolbar_flipVertical`, atau ketuk celah antara flipVertical &
`editor_toolbar_background`. **Aksi instan tanpa panel**: toggle skala klip
antara **"Mengisi"** (Fill — perbesar isi frame, tepi terpotong) dan
**"Cocok"** (Fit — muat utuh, bisa ada letterbox); label tombol berganti
mengikuti mode aktif.

> **Status peta toolbar: 21/21 tool klip terdokumentasi** (8f–8h + filter/trim/
> BGRemove/toPiP/FX/split/flowStudio di §8 & 8a–8e). Tool tanpa panel
> (rotate/flip/fill) = aksi instan; sisanya panel/activity seperti di atas.

---

## 9. Membuat template — `TemplateCreateActivity`

> **Alur di-re-verify end-to-end 2026-07-28 (VN 2.17.0), dgn proyek 2 klip:**
> editor → `tvBtnMore` → `tvCreateTemplate` → `TemplateCreateActivity` (tandai
> klip) → `tvNext` → `PublishTemplateActivity` (Judul/Deskripsi/Sampul/Tag +
> 3 switch) → **Buat** → sukses, `MainActivity` menampilkan tab "Templat 1" +
> kartu (`clRoot`, `tvDuration` "6.00"). Semua selector di bawah masih valid.
> Layar **Tag** (`InputTagActivity`) baru dipetakan sesi ini — lihat di bawah.

**Pintu masuknya bukan kartu "Buat Template" di beranda.** Kartu itu
hanya membuka dokumentasi (lihat bagian 2). Pembuatan template yang
sesungguhnya berada di dalam editor, lewat menu proyek.

Jalurnya: buka proyek di editor → `tvBtnMore` @729,198 → **`tvCreateTemplate`**
@540,2045. Menu yang sama juga memuat:

| Fungsi | resource-id | Posisi |
|---|---|---|
| Nama proyek (dapat diketik) | `etTitle` | @498,1618 |
| Ganti nama | `ivRename` | @954,1617 |
| Bagikan File Proyek VN | `tvShare` | @540,1892 |
| **Buat template** | `tvCreateTemplate` | @540,2045 |

`etTitle` adalah EditText, jadi penamaan proyek bisa diotomasi —
berguna agar template hasil skrip punya nama yang konsisten.

### Menandai klip yang dapat diganti

Layar `com.frontrow.template.ui.create.TemplateCreateActivity` meminta
*"Pilih klip yang dapat diganti pengguna"*. Inilah inti sebuah template:
menentukan klip mana yang menjadi placeholder untuk diisi pengguna.

| Elemen | resource-id | Posisi |
|---|---|---|
| Tutup | `ivClose` | @63,171 |
| Judul | `tvTitle` | @540,172 |
| **Lanjut** | `tvNext` | @924,171 |
| Putar / jeda | `ivPlayState` | @99,1560 |
| Posisi | `tvCurrentProgress` | @204,1561 |
| Seek bar | `sbProgress` | @612,1560 |
| Durasi total | `tvTotalTime` | @1021,1561 |
| Hapus Semua | *(teks)* | @853,1759 |

**Klip ditampilkan sebagai `android.widget.CheckBox`** — dan berbeda
dengan pilihan filter yang tidak terbaca sama sekali, status di sini
**bisa diverifikasi** lewat atribut `checked`.

Kotak centang klip ke-*n* (mulai dari 1):

```js
const kotakKlip = (n) => ({ x: 231 + (n - 1) * 204, y: 2045 });
// terverifikasi: ketuk (231, 2045) -> checkbox klip 1 menjadi checked="true"
```

Perhatikan bahwa kotak centangnya **bergeser ke kanan** dari label
durasi klip: label `3.0s` klip pertama ada di `x` 96–159, sedangkan
kotaknya di `x` 159–303. Mengetuk label tidak akan mencentang apa pun.

Verifikasi setelah mencentang, jangan berasumsi:

```js
const kotak = await $$('//android.widget.CheckBox');
const terpilih = [];
for (let i = 0; i < kotak.length; i++) {
  if ((await kotak[i].getAttribute("checked")) === "true") terpilih.push(i + 1);
}
```

Beri jeda memadai sebelum membaca ulang status: dump 2 detik setelah
ketukan masih menampilkan nilai lama, 3 detik sudah benar.

### Tahap publikasi — `PublishTemplateActivity`

Menekan `tvNext` membuka layar metadata template.

| Elemen | Selector | Posisi |
|---|---|---|
| Judul | *(teks)* | @183,408 |
| Deskripsi | *(teks)* `Deskripsi…` | @229,591 |
| Sampul | *(teks)* | @206,810 |
| Tag | *(teks)* | @163,972 |
| Simpan Rekaman Audio Pengguna | `ui_switch` | @876,1137 |
| Izinkan untuk Mengedit | `ui_switch` | @876,1302 |
| Izinkan untuk Mengubah Bingkai | `ui_switch` | @876,1467 |
| **Buat** | *(teks)* | @216,2123 |
| **Buat dan Publikasikan** | *(teks)* | @709,2123 |

**Ketiga sakelar memakai `resource-id` yang sama** (`ui_switch`) dan
hanya dibedakan posisi `y`. Jangan memilih lewat resource-id saja —
gunakan indeks atau koordinat. Ketiganya berupa `android.view.View`
namun tetap memaparkan atribut `checked`, jadi statusnya **dapat
diverifikasi**. Semuanya default **mati**.

> **Dua tombol aksi dengan konsekuensi sangat berbeda.**
> **Buat** menghasilkan berkas template secara lokal. **Buat dan
> Publikasikan** menjalankan rangkaian yang tertulis di layar —
> *1. Simpan file template → 2. Unggah ke cloud → 3. Link unduhan* —
> jadi mengunggah karya ke server VN dan menghasilkan tautan yang dapat
> diakses orang lain. Keduanya berdampingan dan hanya dibedakan teks.
> Otomatisasi wajib memilih secara eksplisit; jangan pernah mengetuk
> berdasarkan posisi relatif atau indeks tombol.

Area ketuk keduanya (bukan sekadar teksnya):

| Tombol | Bounds | Titik ketuk |
|---|---|---|
| Buat | `[60,2050][372,2156]` | @216,2103 |
| Buat dan Publikasikan | `[396,2050][1020,2156]` | @708,2103 |

#### Judul dan sampul

Kolom **Judul** adalah `EditText` pada `[60,324][1020,492]` (@540,408) —
teks "Judul" hanyalah *hint* di dalamnya, bukan label terpisah.
**Deskripsi** menyusul di `[60,495][1020,687]` (@540,591).

**Sampul** membuka activity tersendiri saat diketuk di @840,810:

| Elemen (`CoverActivity`) | resource-id | Posisi |
|---|---|---|
| Batal | `ivCancel` | @90,236 |
| Kembalikan | `ivRevert` | @858,228 |
| Konfirmasi | `ivConfirm` | @1011,228 |
| Tab Bingkai Video | *(teks)* | @381,1755 |
| Tab Perpustakaan | *(teks)* | @698,1755 |
| Penggeser bingkai | `vfFunctionalViews` | @540,1999 |

#### Tag — `InputTagActivity`

Mengetuk baris **Tag** (@540,972 di layar publish) membuka activity
tersendiri **`com.frontrow.common.ui.input.InputTagActivity`** (dipetakan
2026-07-28).

| Elemen | resource-id | Posisi |
|---|---|---|
| Batal | `tvCancel` ("Membatalkan") | @192,174 |
| Sisa kuota tag | `tvRemain` ("Sisa 10") | @540,174 |
| Selesai (konfirmasi) | `tvComplete` ("Selesai") | @949,174 |

- **Maksimal 10 tag** — `tvRemain` menampilkan sisa kuota ("Sisa 10" →
  berkurang tiap tag dipilih); pakai ini untuk verifikasi.
- Isi layar = **grid chip tag saran** (semua `TextView` `clickable`, TANPA
  resource-id — pilih by-text/koordinat), di-scroll vertikal. Contoh
  terverifikasi: `plog`, `fyp`, `edit`, `transition`, `slomo`, `anime`,
  `idol`, `travel`, `comedy`, `funny`, `talent`, `fitness`, `art`,
  `storytime`, `daily`, `pet`, `studying`, `chatting`, `cuisine`,
  `unpacking`, `game`, `KPOP`, `dance`, `sing`, … (ada input teks untuk tag
  kustom di bagian atas — keyboard muncul saat diketik).
- Ketuk chip untuk memilih → `tvComplete` untuk kembali ke layar publish
  dengan tag terpasang.

#### Hasil yang terverifikasi

**"Buat" berhasil.** Aplikasi kembali ke `MainActivity`, tab berubah
menjadi **"Templat 1"**, dan template muncul di daftar dengan metadata
yang benar:

| Elemen | resource-id |
|---|---|
| Kartu template | `clRoot` |
| Nama | `tvName` |
| Durasi | `tvDuration` (mis. `0:06`) |
| Jumlah klip | `tvClipCount` (mis. `2`) |

`tvDuration` dan `tvClipCount` terbaca sebagai teks, jadi hasil
pembuatan template **dapat diverifikasi** tanpa membuka templatenya.

> **"Buat dan Publikasikan" tidak menghasilkan apa pun.** Dicoba tiga
> kali — tanpa judul, dengan judul, lalu dengan judul dan sampul — dan
> ketiganya tidak memicu navigasi, dialog, galat, maupun entri logcat
> apa pun. Tombolnya tertekan (koordinat berada di dalam bounds yang
> `clickable="true"`) tetapi diam sepenuhnya, sementara **"Buat" pada
> layar yang sama langsung bekerja**.
>
> **Sebabnya sudah dikonfirmasi: aplikasi tidak dalam keadaan login.**
> Tab profil menampilkan `clVisitor` dan `tvLoginOrRegister`
> ("Silahkan masuk/daftar"), jadi VN berjalan sebagai tamu dan menolak
> mengunggah tanpa memberi tahu sama sekali.
>
> Untuk otomatisasi, artinya **kegagalannya senyap** — jangan
> menganggap ketukan berhasil. Periksa status login lebih dulu, dan
> verifikasi hasil lewat perpindahan activity atau bertambahnya
> `Templat n` di beranda.

#### Memeriksa status login

Tab profil ada di `flItemMine` @972,2191 pada navigasi bawah.

| Elemen | resource-id | Posisi |
|---|---|---|
| Wadah status login | `clLoginState` | @540,417 |
| Keadaan tamu | `clVisitor` | @540,417 |
| Ajakan masuk | `tvLoginOrRegister` | @625,394 |
| Avatar tamu | `ivVisitorAvatar` | @171,393 |
| Pengaturan | `ivSetting` | @996,204 |
| Pindai QR | `ivScanQRCode` | @858,204 |
| Credit Center (nilai) | `tvCreditCenterCount` | @921,676 |
| Sampah Proyek (jumlah) | `tvTrashCount` | @956,1456 |

Cara paling ringkas memastikan sebelum mencoba publikasi:

```js
const tamu = await $('//*[@resource-id="com.frontrow.vlog:id/clVisitor"]');
if (await tamu.isExisting()) {
  throw new Error("VN belum login — publikasi ke cloud akan gagal diam-diam");
}
```

Catatan: VN **tidak** mendaftarkan akun ke `AccountManager` Android.
`dumpsys account` hanya menampilkan `VendorKeyAccountService` sebagai
authenticator, tanpa entri akun, jadi status login hanya bisa dibaca
dari UI ini.

---

## 10. Memperbarui dokumen ini

Gunakan `tests/ui-map.js`. Spec ini bersifat baca-saja: ia memotret layar
yang sedang aktif dan mengubah pohon aksesibilitas menjadi inventaris
selector plus titik ketuk, tanpa menekan tombol apa pun.

```sh
docker compose exec \
  -e APP_PACKAGE=com.frontrow.vlog \
  -e FORCE_APP_LAUNCH=false \
  -e MAP_NAME=vn-editor \
  appium npx wdio run ./wdio.conf.js --spec tests/ui-map.js
```

`FORCE_APP_LAUNCH=false` membuat Appium menempel ke aplikasi yang sudah
terbuka alih-alih memulainya ulang — penting agar posisi navigasi tidak
hilang. Hasil lengkap tersimpan di `/tmp/uimap-<MAP_NAME>.json` beserta
XML mentahnya.

Navigasi antar-layar dilakukan terpisah (misalnya `adb shell input tap`),
lalu pemeta dijalankan lagi di setiap layar baru.

---

## 11. Membersihkan proyek

Otomatisasi yang berulang kali membuat proyek akan menabrak kuota, jadi
alur pembersihan sama pentingnya dengan alur pembuatan.

### Cara termurah: jangan sampai proyeknya tersimpan

Menutup editor memunculkan dialog tiga pilihan:

| Pilihan | resource-id | Posisi |
|---|---|---|
| Simpan Proyek dan Keluar | `tvBtnSaveAndExit` | @540,1777 |
| **Keluar secara langsung** | `tvExit` | @540,1953 |
| Batal | `tvBtnCancel` | @540,2099 |

Terverifikasi: keluar lewat `tvExit` membuat proyek **tidak pernah
tersimpan sama sekali** — beranda kembali ke keadaan kosong
("Semua kreasimu akan muncul di sini", folder `0 Barang`), tanpa perlu
menghapus apa pun. Untuk skrip uji yang hanya menjelajah UI, ini jalur
paling bersih sekaligus paling murah.

Gunakan alur hapus di bawah hanya bila proyek memang perlu disimpan
dulu, misalnya untuk diekspor.

### Menghapus proyek yang sudah tersimpan

Penghapusan dilakukan di layar tersendiri,
`...ui.folder.batch.BatchOperationActivity` ("Kelola Proyek"), yang
dicapai lewat tombol **Sunting** pada bagian *Proyek* di beranda.

> **Tombol Sunting hanya ada saat proyek tersimpan tidak kosong**, dan
> posisinya bergeser mengikuti tata letak beranda. Petakan ulang, jangan
> menghafal koordinatnya. Pastikan juga sedang berada di `MainActivity`:
> setelah keluar dari editor, aplikasi mendarat di `CreationActivity`,
> dan koordinat yang sama di sana justru membuka `PremiumActivity`.

| Fungsi | resource-id | Posisi |
|---|---|---|
| Masuk mode kelola (di `MainActivity`) | `tvEdit` | @788,998 |
| Pilih semua | `tvSelectAll` | @940,213 |
| Pindah ke folder | `llMove` | @378,2148 |
| Hapus | `llDelete` | @686,2148 |
| Kembali | `ivBack` | @68,213 |

Urutannya: ketuk `tvEdit` → pilih proyek (ketuk `clRoot` masing-masing,
atau `tvSelectAll` untuk semua) → ketuk `llDelete` → konfirmasi.

Dialog konfirmasi berbunyi *"Apakah Anda yakin akan menghapus proyek
ini?"* dengan **Batal** di kiri dan **OKE** di kanan (@768,1277).
Dialognya tidak memakai `resource-id`, jadi pilih berdasarkan teks —
dan **jangan mengandalkan posisi kiri/kanan saja**, karena tombol
destruktif berada di sisi yang sama dengan tombol konfirmasi biasa.

Tiap baris proyek membawa `tvDuration` dan `tvTitle` (tanggal), keduanya
terbaca sebagai teks. Manfaatkan itu untuk memastikan yang dihapus
memang proyek buatan skrip, bukan karya asli:

```js
// Verifikasi dulu, jangan menghapus berdasarkan posisi saja.
const judul = await $('//*[@resource-id="com.frontrow.vlog:id/tvTitle"]').getText();
```

Setelah proyek terakhir terhapus, layar menampilkan **"Tidak Ada
Proyek"** — penanda yang bisa dipakai skrip untuk memastikan pembersihan
benar-benar tuntas.

> **Menghapus tidak benar-benar membuang.** Proyek yang dihapus pindah
> ke **Sampah Proyek**, terlihat di tab profil sebagai `clTrash` dengan
> penghitung `tvTrashCount` @956,1456. Setelah satu proyek dihapus lewat
> alur di atas, penghitung itu terbaca `1` — jadi pembersihan yang
> benar-benar tuntas perlu mengosongkan sampahnya juga. Pakai
> `tvTrashCount` untuk memverifikasi, jangan berhenti di layar
> "Tidak Ada Proyek".

### Mengosongkan sampah — `DraftManageActivity`

Dibuka dari tab profil lewat `clTrash` @540,1455.

| Fungsi | resource-id | Posisi |
|---|---|---|
| Kembali | `ivBack` | @75,198 |
| Pilih Semua | `tvActionAll` | @925,199 |
| Durasi item | `tvDuration` | @273,538 |
| Tanggal item | `tvClipAndDuration` | @720,429 |
| Pulihkan | `tvDraftRecover` | @406,2159 |
| **Hapus permanen** | `tvDraftDelete` | @735,2159 |

Konfirmasinya memakai dialog yang sama dengan penghapusan proyek
("Apakah Anda yakin akan menghapus proyek ini?", **OKE** @768,1277).

### Template tidak dapat dihapus lewat UI

Ini kesimpulan setelah menelusuri seluruh jalur yang masuk akal, dan
semuanya buntu:

- **Tekan-lama** kartu template → membuka `TemplatePreviewActivity`
  (hanya berisi *Terapkan* @294,2097 dan *Publikasi* @787,2097), bukan
  menu konteks.
- **`ivMore`** @984,207 di beranda → hanya "Membuat folder", sama saja
  ketika tab Templat sedang aktif.
- **Geser kartu** ke kiri → tidak ada reaksi.
- **`LocalTemplateActivity`** (profil → `clTemplate` @540,879), yang
  punya tab `Impor` / `Unduhan` / `Milikmu` → tetap tanpa opsi hapus,
  dan tekan-lama di sana pun hanya membuka pratinjau.

Berkas template tersimpan di `/sdcard/Android/data/com.frontrow.vlog/`
(`cache/.current_create_template/`, `files/.template_videos`, dan
sejenisnya), tetapi registrinya ada di basis data internal aplikasi.
Menghapus berkasnya saja berisiko meninggalkan keadaan tak konsisten.

**Untuk otomatisasi yang membuat banyak template uji, satu-satunya
pembersihan yang andal adalah mengosongkan data aplikasi:**

```sh
adb -s <udid> shell pm clear com.frontrow.vlog
```

Terverifikasi menghapus proyek, template, dan sampah sekaligus, serta
mengembalikan izin runtime ke keadaan awal (`READ_EXTERNAL_STORAGE`
kembali `granted=false`). Konsekuensinya aplikasi kembali seperti baru
dipasang — `FirstTimeActivity` akan muncul lagi, dan izin perlu
diberikan ulang.

---

## 12. Catatan lain

**Izin.** VN memasuki alur pemilih media akan meminta akses penyimpanan.
Pada sesi pemetaan ini `READ_EXTERNAL_STORAGE` berubah menjadi granted.
Skrip otomatisasi sebaiknya menyiapkan izin lebih dulu agar tidak
terhalang dialog.

> **Perhatikan versi Android.** `READ_MEDIA_VIDEO/IMAGES/AUDIO` baru ada
> di **Android 13 (API 33)+**. Perangkat uji Infinix X662 = **Android 11
> (API 30)** → grant permission itu ditolak `IllegalArgumentException:
> Unknown permission`. Di Android 11 pakai `READ_EXTERNAL_STORAGE`
> (terverifikasi 2026-07-28). Deteksi runtime: `adb shell getprop
> ro.build.version.sdk`.

```sh
# Android 11 (API 30) — Infinix X662:
adb -s <udid> shell pm grant com.frontrow.vlog android.permission.READ_EXTERNAL_STORAGE
adb -s <udid> shell pm grant com.frontrow.vlog android.permission.WRITE_EXTERNAL_STORAGE

# Android 13+ (API 33+):
adb -s <udid> shell pm grant com.frontrow.vlog android.permission.READ_MEDIA_VIDEO
adb -s <udid> shell pm grant com.frontrow.vlog android.permission.READ_MEDIA_IMAGES
adb -s <udid> shell pm grant com.frontrow.vlog android.permission.READ_MEDIA_AUDIO
```

**Kuota proyek.** Versi gratis dibatasi 100 proyek (`tvProjectLimit`).
Otomatisasi yang membuat proyek berulang kali perlu membersihkannya,
kalau tidak kuota habis dan alur berhenti di layar upgrade. Alurnya ada
di bagian 11.

**Iklan sisipan.** `MainActivity` dan `CreationActivity` memuat banner
dengan tombol tutup `ivCloseAds`. Kehadirannya tidak konsisten, jadi
perlakukan sebagai opsional — periksa keberadaannya, jangan menunggunya.

Yang lebih mengganggu adalah **iklan interstitial**
(`com.google.android.gms.ads.AdActivity`) yang bisa muncul sewaktu-waktu
dan mengambil alih seluruh layar. Perilakunya saat diuji:

- Menggeser layar di dekat banner bisa memicunya, jadi mulailah gestur
  jauh dari area banner.
- **Tombol Back diabaikan selama beberapa detik pertama.** Perlu jeda
  lalu Back lagi; sekali tekan sering tidak cukup.
- Satu-satunya elemen clickable yang terbaca adalah `cbb` (AdChoices),
  **bukan** tombol tutup. Jangan mengetuknya, dan jangan pernah mengetuk
  tombol ajakan seperti "PESAN KINI" karena itu membuka pengiklan.

Skrip yang tahan banting sebaiknya memeriksa activity yang aktif setelah
setiap perpindahan layar, dan menangani `AdActivity` sebagai kondisi yang
wajar terjadi:

```js
if ((await browser.getCurrentActivity()).includes("AdActivity")) {
  await browser.pause(5000);
  await browser.back();
}
```

---

## 13. Alur AutoCut (sinkron klip ke ketukan musik)

Dipetakan end-to-end 2026-07-28, VN 2.17.0. AutoCut = fitur otomatis yang
memotong & menyinkronkan klip ke beat musik. **Butuh minimal 4 klip.**

**1. Masuk — dari `FirstTimeActivity`.** Kartu `flAutoCutCard` @793,744
(bounds `[552,624][1035,864]`). Mengetuknya membuka **splash intro**
(pemutar `exo_*` + teks "Impor 4 klip atau lebih untuk menyinkronkannya
secara otomatis dengan ketukan musik") dgn tombol **"Pilih Media"** @540,2042.

**2. Pilih media — `...template.ui.autocut.AutoCutSelectMediaActivity`.**
Sama pola pemilih media biasa: filter `button_all` ("Semua") / `button_video`
("Video") / "Foto", grid `check_view`+`media_thumbnail`. **Wajib ≥4**
("Pilih minimal 4 item"; counter berubah jadi "N dipilih"). Tombol **"LANJUT"**
(bounds `[810,1856][1002,1946]`, @906,1901).

**3. Editor AutoCut — `...template.ui.autocut.AutoCutEditorActivity`.**
Layar **Lynx (TANPA resource-id — selektor by-text/koordinat)**, konteks
`NATIVE_APP`. VN langsung auto-generate video musik. Elemen:
- Top bar: **"Save"** @858,192, **"Export"** (ikon ↑) @990,192, judul/mode "AutoCut" @540,193.
- Pemutar: "Play" @96,1562, waktu "0:00"/"0:05", "Full screen" @984,1562.
- **Mode (tab):** `AutoCut` (aktif) · **`Template`** @318,1722 · **`BeatsClips`** @751,1722.
- **Pemilih musik** (scroll horizontal, label "Selected"): chip `Discover` @168,2108, `Echoing Steps` @420, `Save Me` @672, `West Coast Groove` @924, dst.

**4. Export → action-sheet.** Ketuk "Export" (@990,192) → sheet 3 opsi:
- **Selesai** (`[60,1727][1020,1871]`, @540,1799) — lanjut ke setelan ekspor.
- **Edit** (`[60,1873][1020,2017]`, @540,1945) — buka hasil AutoCut di editor VN penuh utk edit manual.
- **Batal** (`[60,2047][1020,2156]`, @540,2101).

**5. Setelan ekspor — `...ui.generate.option.VideoGenerateOptionActivity`**
(layar ekspor umum VN, dipakai juga oleh export biasa):

| Elemen | resource-id | Posisi |
|---|---|---|
| Tutup | `ivClose` | @90,198 |
| Mode Auto (radio, "Mobil"=Auto mistranslation) | `rbAuto` | @720,1373 |
| Mode Manual (radio) | `rbManual` | @891,1373 |
| Nilai setelan (mis. "1080p / 24fps", tap utk ubah di Manual) | `tvExportSettingValue` | @203,1446 |
| Ekspor Audio Saja (toggle) | `sbExportAudioOnly` | @917,1600 |
| Perkiraan Ukuran File | `tvFileSize` | @725,1790 |
| **Ekspor** ("Selesai") | `export_export` | @540,1943 |

Menekan `export_export` merender video ke galeri (TIDAK dieksekusi saat
pemetaan agar tak menghasilkan berkas). Untuk otomasi: verifikasi hasil
via perpindahan activity / file baru di galeri, bukan asumsi.

> **Catatan:** BeatsClips (kit terpisah di FirstTime) juga muncul sebagai
> *mode* di dalam editor AutoCut — ketiganya (AutoCut/Template/BeatsClips)
> berbagi editor yang sama, hanya beda gaya sinkronisasi.

---

## 14. Alur Kolase (collage foto statik)

Dipetakan end-to-end 2026-07-28, VN 2.17.0. Kolase = penyusun **kolase foto
1–9** yang menghasilkan **gambar statik** (bukan video).

**1. Masuk — dari `FirstTimeActivity`.** Kartu `flCollageCard` @286,744
(bounds `[45,624][528,864]`). **Langsung** membuka `CollageActivity` (tanpa
splash intro, beda dgn AutoCut).

**2. `com.frontrow.collage.ui.CollageActivity`** — layar **Lynx (TANPA
resource-id, konteks `NATIVE_APP`)**, semua selektor **by-text/koordinat**.
Kondisi awal: teks "Pilih 1-9 foto untuk membuat kolase." + slot **"Add
photo"** kosong. Top bar: **"Export"** @996,192.

Tiga tab panel bawah (@y1574): **"Foto"** @171 · **"Tata Letak"** @500 ·
**"Berbatasan"** @818, plus **"Close panel"** @990,1579 & **"Reset"** @90,1579.

- **Foto** — grid slot foto. **"Add photo"** (tap slot kosong menambah foto;
  counter judul jadi "Pilih 1-9 Foto (N)"), **"Remove photo"** (slot terisi),
  tiap foto berlabel indeks angka. **"Shuffle Layout"** @996,1438 mengacak.
- **Tata Letak** — preset layout (thumbnail **tanpa label/id** → pilih
  by-koordinat di baris ~y1700–2100). Instruksi "Tekan lama dan seret untuk…"
  = rearrange foto via long-press-drag. + "Shuffle Layout".
- **Berbatasan** — 3 slider (label kiri, nilai kanan @x945, default 0):
  **Inner Border** @y1804 · **Outer Border** @y1948 · **Round Corner** @y2092.

**3. Export → simpan instan.** Ketuk "Export" @996,192 → **langsung
tersimpan** (output gambar statik, TANPA layar `VideoGenerateOptionActivity`)
→ `com.frontrow.collage.ui.export.CollageExportSuccessActivity`: status
**"Tersimpan"** @576,192, **"Selesai"** @965,193, dan share **Lainnya /
Instagram / YouTube / Facebook** (@y906). **Catatan otomasi:** Export di
Kolase **menulis berkas gambar ke galeri seketika** (beda dari AutoCut/video
yang punya layar setelan dulu) — hati-hati saat menguji berulang, tiap Export
= 1 file baru.

---

## 15. Alur Teleprompter (naskah + gulir saat merekam)

Dipetakan end-to-end 2026-07-28, VN 2.17.0. Teleprompter = tampilkan naskah
bergulir saat merekam (bisa floating overlay di app lain, atau mode 2
perangkat: satu tampil naskah, satu kontrol jarak jauh).

**1. Masuk — dari `FirstTimeActivity`.** Kartu "Teleprompter" (judul
`tvTitle` di `[250,1081][419,1157]`; ketuk kartu/cover @~334,1000) →
`com.frontrow.ai.ui.teleprompter.TeleprompterActivity` (Lynx, `NATIVE_APP`,
mayoritas **tanpa resource-id**).

**2. Beranda Teleprompter.** Teks selamat-datang + daftar **"Skrip Saya"**
@176,785 (entri skrip berlabel tanggal, mis. "2026-07-28 12:44"), tombol
**"Buat Skrip"** @540,549, dan **"Mulai Gunakan Teleprompter"** @412,902.

**3. Editor skrip** (dari "Buat Skrip"). "Edit Skrip"; field **"Judul
(Opsional)"** @281,348 + **body** (EditText, "Silakan tempel atau masukkan
skrip", **maks 5000 char**, counter "0/5000" @975,1910). **"AI Writer"**
@189,1910 = generate skrip via AI. Dua tombol launch:
**"Teleprompter"** @291,2153 (mode penuh) & **"Teleprompter Mengambang"**
@790,2153 (floating overlay di app mana pun).

**4. Runtime teleprompter.** Menekan "Teleprompter" bisa lewat 1 layar promo
("Ubah ponsel Anda menjadi teleprompter" → **"Coba Sekarang"** @541,2133)
dulu, lalu runtime: naskah besar bergulir + **"Ganti Skrip"** @271,2133 &
**"Mulai"** @763,2133 (mulai gulir). **Toolbar atas berupa IKON tanpa label**
(mapper melewatkannya — pakai koordinat/screenshot):

| Ikon | Fungsi | Posisi |
|---|---|---|
| ‹ | Kembali | @82,174 |
| broadcast | Mode 2-perangkat (remote control) | @454,174 |
| ⚙ | Pengaturan | @588,174 |
| A+ | Perbesar font | @720,174 |
| A− | Perkecil font | @844,174 |
| mirror | Cermin teks (utk kaca teleprompter) | @966,174 |

**5. Panel Pengaturan** (ikon ⚙) — bottom sheet "Pengaturan", label
terbaca sbg teks (bisa diselect by-text):

| Setelan | Tipe | Contoh nilai |
|---|---|---|
| Ukuran Font | slider | 36 |
| Kecepatan Gulir | slider | 19 |
| Warna Teks | deretan swatch (putih/merah/pink/magenta/ungu/hijau…) | putih (default) |
| Jarak Baris | slider | 56 |
| Margin | slider | 20 |
| Ulangi (loop skrip) | toggle | off |
| Kunci Arah (arah teks terkunci) | toggle | off |

**Catatan otomasi:** skrip yang dibuat tersimpan di "Skrip Saya" (bertahan
sampai `pm clear`). Teleprompter = alat tampilan/rekam, **tidak** menulis
berkas video sendiri (perekaman pakai kamera terpisah).

---

## 16. Alur Talking Videos — kategori template, bukan kit (+ preview & login gate)

Dipetakan 2026-07-28, VN 2.17.0.

> **Koreksi ekspektasi:** "Talking Videos" **BUKAN** alat/kit edit tersendiri
> (beda dari AutoCut/Kolase/Teleprompter). Ia adalah **header kategori
> template** di beranda FirstTime: `tvTitle` "Talking Videos" + `tvCount`
> "(5)", diikuti sebuah **`RecyclerView` horizontal** berisi 5 kartu template
> jadi. Pola yang sama berlaku utk baris kategori lain (Learn & How-to,
> Lifestyle & Fun, dst).

**Menemukan kartunya (jebakan navigasi):** kartu kit di grid atas **tidak
membungkus judul dalam satu node clickable**, dan "Talking Videos" di sini
malah **section header** (bukan kartu). Judul header tidak launchable —
yang diketuk adalah **item template di RecyclerView di bawahnya**
(mis. @180,1075). Jangan andalkan mengetuk `tvTitle`; scroll halaman
(swipe vertikal) lalu ketuk kartu di dalam RecyclerView kategori.

**1. Preview template — `com.frontrow.template.ui.preview.TemplatePreviewActivity`**
(Lynx, `NATIVE_APP`, tanpa resource-id). Isi: nama template (mis. "30 Days
Transformation") @322,1677, **"Usage"** (mis. "2.5w") @119/172, **"Biaya"**
(kredit, mis. "1/min") @352/423 — sebagian template berbayar/pakai kredit,
pemutar preview (scrubber "0:08 … 0:13"), dan tombol utama **"Unduh"** @540,2097.

**2. Unduh → GERBANG LOGIN.** Menekan "Unduh" saat **belum login** membuka
**`com.frontrow.account.ui.login.LoginActivity`** (bukan mengunduh). Ini
konfirmasi eksplisit pola yang sama dgn "Buat dan Publikasikan" (§9): fitur
cloud/komunitas VN **butuh akun**.

**Peta `LoginActivity`** (punya resource-id, beda dari layar Lynx —
gerbang login **bersama** utk semua fitur cloud VN):

| Elemen | resource-id | Posisi |
|---|---|---|
| Tutup | `ivSignInExit` | @132,135 |
| Daftar | `tvSignUp` | @883,133 |
| Nama Pengguna / Email | `etUsername` | @498,756 |
| Kata sandi | `etPassword` | @486,938 |
| Tampilkan kata sandi | `cbPasswordVisible` | @903,938 |
| **Masuk** (login) | `tvBtnLogin` | @540,1138 |
| Lupa kata sandi | `tvForgetPassword` | @540,1280 |
| Centang kebijakan | `cbPolicy` | @27,1403 |
| Login Facebook | `btnFacebook` | @393,2108 |
| Login Google | `btnGoogle` | @687,2108 |

**Untuk otomasi:** cek status login dulu (§9 "Memeriksa status login" —
`clVisitor`). Alur "pakai template komunitas" mentok di `LoginActivity`
selama tamu; sesudah login, "Unduh" mengunduh template lalu masuk alur
terapkan (belum dipetakan karena butuh akun).

---

## 17. Alur AI gambar: Teks ke Gambar & Perbesar Gambar

Dipetakan 2026-07-28, VN 2.17.0. Dua **kit AI berbasis kredit** di grid
FirstTime. Pola sama: ketuk kartu → **splash intro** ("… Coba Sekarang",
opsi "Jangan tampilkan lagi") → activity AI (punya resource-id) dengan
**nama model**, **catatan kredit** (`tvBalance`), **riwayat** (`ivHistory`),
dan tombol generate. **Generate belum dieksekusi** (pakai kredit + kemungkinan
butuh login).

### 17a. Teks ke Gambar — `com.frontrow.ai.ui.photo.TextToPhotoActivity`

Kartu grid FirstTime "Teks ke Gambar" (cover @334,1277 di baris-2). Splash
"Coba Sekarang" @540,2003 → activity:

| Elemen | resource-id | Posisi |
|---|---|---|
| Kembali | `ivBack` | @90,198 |
| Judul "Text to Image" | `tvTitle` | @498,166 |
| Nama model (mis. "Official · Nano Banana (Gemini)") | `tvModelName` | @540,237 |
| Ide/inspirasi | `ivIdea` | @855,198 |
| Riwayat generasi | `ivHistory` | @1005,198 |
| Lihat Inspirasi | `tvViewInspirations` | @540,1443 |
| Catatan kredit | `tvBalance` | @540,1679 |
| **Prompt** (EditText) | `etPrompt` | @540,1904 |
| Pengaturan | `flSetting` | @129,2135 |
| **Hasilkan** (generate) | `tvGenerate` | @771,2135 |

Panel **Pengaturan** (`flSetting`): **Ratio** (`tvSize`: `1:1` @169 / `3:4`
@421 / `9:16` @673 / `4:5` @925, semua @y1765) + **Number of images**
(`etValue`/`sbValue`). Tutup `ivClose` @90,1328 / konfirmasi `ivConfirm` @990,1317.

### 17b. Perbesar Gambar — `com.frontrow.ai.ui.enhance.EnhancePhotoActivity`

Kartu grid FirstTime "Perbesar Gambar" (cover @744,1277). AI upscale
(tingkatkan resolusi, ada preview "Sebelum/Setelah" di splash). Splash "Coba
Sekarang" @540,2003 → **media picker** (`VideoEditorMatisseActivity`; tab
"Kamera"/"Semua"/"Stok" — **tile pertama = "Kamera"** membuka kamera, foto
asli mulai kolom ke-2) → pilih 1 foto → activity:

| Elemen | resource-id | Posisi |
|---|---|---|
| Kembali | `ivBack` | @90,198 |
| Judul "Upscale Image" | `tvTitle` | @499,166 |
| Nama model (mis. "Official · SeedVR 2") | `tvModelName` | @541,237 |
| Riwayat | `ivHistory` | @1005,198 |
| Catatan kredit | `tvBalance` | @540,1967 |
| Ganti/pilih foto | `flSelectPhoto` | @129,2135 |
| **Mulai** (generate) | `tvGenerate` | @771,2135 |

> **Batas input terverifikasi:** foto **> 3120×4160 DITOLAK** dengan dialog
> "Resolusi lebih dari 3120x4160 tidak didukung." (`tvErrorOk` "OK"). Siapkan
> gambar ≤ batas ini sebelum alur upscale.

### 17c. AI Cutout — `com.frontrow.ai.ui.restyle.RestylePhotoActivity`

Kartu grid FirstTime "AI Cutout" (cover @129,985, baris-1). AI background
removal ("Smartly detects the main subject… fast and accurate background
removal"). Splash "Coba Sekarang" @540,2003 → **media picker** → pilih foto
→ **`RestylePhotoActivity`** (struktur identik dgn EnhancePhotoActivity 17b,
punya resource-id):

| Elemen | resource-id | Posisi |
|---|---|---|
| Kembali | `ivBack` | @90,198 |
| Judul "AI Cutout" | `tvTitle` | @498,166 |
| Nama model (mis. "Official · BiRefNet") | `tvModelName` | @540,237 |
| Riwayat | `ivHistory` | @1005,198 |
| Catatan biaya kredit + saldo | `tvBalance` | @540,1967 |
| Ganti/pilih foto | `flSelectPhoto` | @129,2135 |
| **Mulai** (generate) | `tvGenerate` | @771,2135 |

> **Temuan kredit penting:** `tvBalance` berbunyi *"Generasi ini akan
> menggunakan **2,00 kredit**. (Saldo **100,00**)"* — jadi (a) kit AI foto
> berbiaya kredit tetap (AI Cutout = 2 kredit), dan (b) **akun ini punya
> saldo 100 kredit** (kredit percobaan tersedia bahkan tanpa login penuh,
> beda dari template komunitas §16 yang mentok di `LoginActivity`).
> **`tvGenerate` TIDAK ditekan** saat pemetaan agar tak menghabiskan kredit
> milik user.

> **`RestylePhotoActivity` = activity restyle bersama.** Kemungkinan besar
> jalur yang sama melayani efek foto AIKit lain (Anime Style, Era Look,
> Figurine Maker, dst — lihat 8f) karena semuanya "restyle foto berbasis
> model+kredit". Pola generik: `tvModelName` (model), `tvBalance` (biaya),
> `flSelectPhoto` (input), `tvGenerate` (jalankan), `ivHistory` (hasil lampau).

### 17d. Tingkatkan Potret — `EnhancePhotoActivity` (model GFPGAN)

Kartu grid FirstTime "Tingkatkan Potret" (cover @539,1277, baris-2; splash
berjudul "Perbaiki Potret" — AI sesuaikan warna kulit, tingkatkan detail,
hapus noda). Splash "Coba Sekarang" @540,2003 → **media picker** → pilih foto
→ **`EnhancePhotoActivity`** — **activity & elemen PERSIS SAMA dengan Perbesar
Gambar (17b)**, hanya beda `tvTitle` ("Enhance Portrait") & `tvModelName`
("Official · **GFPGAN**"). Biaya `tvBalance` = 2 kredit (Saldo 100).
`tvGenerate` TIDAK ditekan.

### 17e. Ringkasan pola kit AI foto (17a–17d)

Semua kit AI foto berbagi **dua activity generik** berstruktur identik
(`ivBack`/`tvTitle`/`tvModelName`/`ivHistory`/`tvBalance`/`flSelectPhoto`/
`tvGenerate`) + splash intro "Coba Sekarang":

| Kit | Activity | Model | Input |
|---|---|---|---|
| Teks ke Gambar | `TextToPhotoActivity` | Nano Banana (Gemini) | prompt teks (`etPrompt`) |
| Perbesar Gambar | `EnhancePhotoActivity` | SeedVR 2 | foto (picker, ≤3120×4160) |
| Tingkatkan Potret | `EnhancePhotoActivity` | GFPGAN | foto (picker) |
| AI Cutout | `RestylePhotoActivity` | BiRefNet | foto (picker) |

**Pola otomasi:** kenali kit dari `tvTitle`/`tvModelName`; input via `etPrompt`
(text-to-image) atau `flSelectPhoto`/media-picker (berbasis foto); jalankan
`tvGenerate`. Semua berbiaya kredit (`tvBalance`, saldo tampil) — akun tamu
punya kredit percobaan (100). `TextToPhotoActivity` punya `flSetting` (Ratio +
Number of images) yang tak ada di enhance/restyle.

---

## 19. Alur Overlay (kit) — template frame multi-slot

Dipetakan 2026-07-28, VN 2.17.0.

> **Beda dari tool `editor_toolbar_toPiP` (§8c).** toPiP hanya memindahkan
> klip terpilih ke trek overlay/PiP. Kartu FirstTime **"Overlay"** adalah
> galeri **template frame overlay jadi** (bentuk berlubang multi-slot) yang
> diisi beberapa klip sekaligus.

**1. `com.frontrow.videoeditor.overlay.list.OverlayListActivity`** — galeri
grid 2 kolom template overlay. `ivBack` @75,198, `tvTitle` "Overlay",
`ivAddOverlayMaterial` @984,198 (impor overlay kustom). Template (`rootView`
+ `tvOverlay`): **Camera** @293,597, **Circular** @788,597, **Heart** @293,1155,
**Photo** @788,1155, **Rectangle** @293,1713, **Rectangle2** @788,1713 (+ lagi,
scroll). Konteks `NATIVE_APP`.

**2. `...overlay.preview.OverlayPreviewActivity`** — preview template terpilih
(Lynx). Pemutar (`ivPlayState`, `sbProgress`, `ivSetupFullScreen`) + metadata:
`tvDuration` ("0:02") & **`tvColorCount`** ("3") berlabel `tvDurationText`
"Durasi" / `tvColorCountText` "Warna" (= jumlah **slot** overlay). Tombol
utama **`tvUse` "Menggunakan"** @762,2137.

**3. `...overlay.select.OverlaySelectActivity`** — pemilih media utk mengisi
slot. Instruksi **"Silahkan pilih N rekaman (0/N)"** (Camera = 3), slot
**berkode warna Blue/Green/Red**. Grid media standar: `ivAlbum` "Semua"
@540,183 (pilih album), kolom x **179/540/901**, tiap sel `check_view` +
`media_thumbnail` + `ivPreview`. Setelah cukup terpilih → **"LANJUT"** →
editor dgn overlay terpasang (belum ditelusuri lebih jauh).

**Catatan otomasi:** jumlah media yang wajib dipilih = `tvColorCount` template
(slot berkode warna). Verifikasi lewat counter "(k/N)" sebelum "LANJUT".

---

## 20. Alur BeatsClips (kit) — template beat-sync, dua jalur masuk

Dipetakan 2026-07-28, VN 2.17.0. BeatsClips = video yang klipnya dipotong &
disinkronkan ke **ketukan musik**. (Ini juga muncul sebagai *mode* di editor
AutoCut §13 — ketiganya AutoCut/Template/BeatsClips berbagi editor itu.)

**1. Masuk.** Kartu grid FirstTime "BeatsClips" (cover @539,985, baris-1) →
**bottom sheet** (`design_bottom_sheet`, item `ivItem`/`tvItem`) dgn 2 pilihan:
- **"Buat Template Musik"** @403,1934 (jalur **music-first**)
- **"Buat Template Video"** @400,2114 (jalur **video-first**)

**2. Jalur music-first → `com.frontrow.videoeditor.music.ui.MusicManageActivity`**
(pustaka musik bersama — sama dgn tool Musik §8):
- Tab (`tvTabName`): **Musik** @180,414 · **Favorit** @540,414 · **Milikmu** @900,414.
- `flSearch` / `tvSearch` "Mencari" @540,591.
- Grid kategori (`tvTitle`, 3 kolom): **Vlog** @200,981, **Pop** @531,981,
  **Dynamic** @864,981, **Fresh** @199,1353, **Acoustic** @531,1353,
  **Electronic** @863,1353, **Hip-Hop** @199,1725 (+ lagi).
- Ketuk kategori → **daftar track** (baris: ikon, nama, durasi, ikon **unduh**
  di kanan; mis. "We Go (Remix)" 4:03, "Story", "Save Me", "Do It" …).

**2a. Pilih track.** Ketuk baris track → **preview main** (waveform +
play/pause) dan muncul di baris itu: ikon **bintang (favorit)** + tombol
**"Menggunakan"** (Lynx, ~@930,1835 — tanpa node teks, ketuk by-koordinat).

**2b. `...music.ui.detail.MusicDetailActivity`** (setelah "Menggunakan") —
konfigurasi track:
- `ivChooseMusic` @90,180 (ganti musik) · `ivFavorite` @828,180 · `ivMore` @990,180.
- `textView_music_name` ("Do It"), `tvOriginalDuration` ("Ikson · 2:31"),
  `ivMusicPlay` @933,900.
- Rentang & beat: `tvBegin` @150,1332 / **`tvBeatCount`** ("0" jumlah beat)
  @541,1332 / `tvEnd` @910,1332.
- **`flEditBeats` "Edit Beats"** @540,1802 (sunting titik beat manual).
- **`flCreateProject` "Buat Proyek"** @540,1982.

**2c. "Buat Proyek" → `EditorActivity` STANDAR** (bukan AutoCut editor) —
proyek dibuka dengan **track musik sudah ter-load** (`editor_track_music`
ada, `total_textView` = durasi track, mis. 2:31.59). Dari sini tambah klip
(`editor_track_main_add`) di timeline musik itu, lalu ekspor/`tvCreateTemplate`
seperti biasa (§9). **Koreksi:** jalur music-first BeatsClips TIDAK bermuara
ke `AutoCutEditorActivity`; itu editor VN standar dengan musik sebagai basis.

**3. Jalur video-first** ("Buat Template Video" @400,2114) — dipetakan
2026-07-28. Ini **authoring template beat-sync dari video**, bukan sekadar
pilih musik:
- → **media picker** (`VideoEditorMatisseActivity`) → pilih video.
- → **`com.frontrow.videoeditor.ui.template.create.video.VideoTemplateCreatingActivity`**
  (Lynx) — layar **trim + penanda beat**:
  - Trim: `tvSliceIndex` "Trim", `tvDurationTitle` "Durasi",
    `etTotalRangeTimeS` (total range detik, editable), seek
    (`multiple_video_seekBar`, `current_textView`/`total_textView`).
  - **`ivAddBeat`** @540,2162 — taruh **penanda beat** di posisi playhead
    (marker manual, tempat klip nanti dipotong/berganti mengikuti irama).
  - Tab bawah `llTrimCell` "Trim"; bar `ivCancel` @189,2174 /
    `ivEditorPlay` @540,2174 / `ivDone` @891,2174.
  - `ivDone` mengunci trim → muncul aksi **"Membuat"** (lanjut buat template).

**Catatan:** dua jalur bermuara berbeda — **music-first** → `EditorActivity`
standar (musik ter-load; ekspor via `VideoGenerateOptionActivity`, template
via §9); **video-first** → `VideoTemplateCreatingActivity` → "Membuat"
(pembuatan template, pola §9). Keduanya BUKAN `AutoCutEditorActivity` (itu
jalur kit AutoCut §13, tempat "BeatsClips" muncul sebagai *mode* terpisah).

---

## 18. Alur Cerita (Storyline) — pintu masuk standalone

Dipetakan 2026-07-28, VN 2.17.0.

> **Kartu FirstTime "Cerita" membuka activity yang SAMA dengan tool
> `editor_toolbar_story` (§8g): `com.frontrow.videoeditor.storyline.
> StorylineComposeActivity`** — hanya **pintu masuk berbeda**. Dari editor
> (§8g) storyline dibangun atas klip yang sudah ada; dari kartu FirstTime
> "Cerita" ia **mulai kosong** ("Ceritaku") lalu kamu susun bagian dari nol.

**1. Masuk.** Kartu grid FirstTime "Cerita" (cover @129,1277, baris-2) →
`StorylineComposeActivity` kosong. Elemen awal: `ivBack` @75,198,
`tvTitle` "Ceritaku" @540,198, `ivMore` @1005,198, dan `llAddStory`
**"Tambah Bagian"** @269,393.

**2. Tambah bagian.** Ketuk `llAddStory` → muncul field judul bagian
**`etStoryTitle`** ("Masukkan judul cerita") @540,393 + `tvStoryNext`
"Lanjut". Isi judul → bagian terbentuk.

**3. Komposer bagian** (setelah judul diisi) — identik pola §8g:

| Elemen | resource-id | Posisi |
|---|---|---|
| Judul bagian | `tvTitle` | @176,405 |
| "Gunakan judul sebagai transisi" (toggle) | `sbTitleAsTransition` | @921,531 |
| Tambahkan klip (→ pemilih media) | *(teks)* | @422,726 |
| Tambah Bagian (bagian berikutnya) | `llAddStory` | @269,951 |
| **Simpan Cerita** (endpoint standalone) | `tvStorySave` | @245,2159 |
| **Lanjut** (→ lanjut ke editor/generate) | `tvStoryNext` | @740,2159 |

Tiap bagian bisa diberi judul + klip (lewat "Tambahkan klip") + deskripsi
(`etMediaDescription`, lihat §8g). **Dua endpoint:** `tvStorySave`
("Simpan Cerita") menyimpan storyline; `tvStoryNext` ("Lanjut") meneruskan
ke tahap berikut (editor/generate — belum dieksekusi).
