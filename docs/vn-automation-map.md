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
Jadi otomatisasi yang membersihkan proyeknya sendiri (bagian 10) akan
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

### Toolbar berubah menurut konteks

Daftar 21 tool di bagian 7 bukan himpunan tetap. Contoh terverifikasi:
`editor_toolbar_delete` **hanya muncul ketika proyek berisi lebih dari
satu klip** — masuk akal, karena klip tunggal tidak dapat dihapus.

Konsekuensinya, skrip tidak boleh mengasumsikan posisi indeks pada
toolbar. Selalu pilih lewat `~content-desc`, dan periksa keberadaannya
dulu sebelum mengetuk.

---

## 9. Memperbarui dokumen ini

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

## 10. Membersihkan proyek

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

---

## 11. Catatan lain

**Izin.** VN memasuki alur pemilih media akan meminta akses penyimpanan.
Pada sesi pemetaan ini `READ_EXTERNAL_STORAGE` berubah menjadi granted.
Skrip otomatisasi sebaiknya menyiapkan izin lebih dulu agar tidak
terhalang dialog:

```sh
adb -s <udid> shell pm grant com.frontrow.vlog android.permission.READ_MEDIA_VIDEO
adb -s <udid> shell pm grant com.frontrow.vlog android.permission.READ_MEDIA_IMAGES
adb -s <udid> shell pm grant com.frontrow.vlog android.permission.READ_MEDIA_AUDIO
```

**Kuota proyek.** Versi gratis dibatasi 100 proyek (`tvProjectLimit`).
Otomatisasi yang membuat proyek berulang kali perlu membersihkannya,
kalau tidak kuota habis dan alur berhenti di layar upgrade. Alurnya ada
di bagian 10.

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
