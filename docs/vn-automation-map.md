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

Layar ini hanya muncul sekali. Skrip yang tahan banting sebaiknya
memeriksa activity yang aktif, bukan mengasumsikan salah satunya:

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
| 11 | *(belum terverifikasi)* | Mengisi | | | |

> Tool ke-11 ("Mengisi") teridentifikasi lewat label, tetapi
> `content-desc`-nya belum sempat direkam. Jalankan ulang pemeta pada
> posisi scroll yang memuatnya untuk melengkapi.

Menggeser toolbar:

```js
await browser.action("pointer")
  .move({ x: 950, y: 2156 }).down()
  .move({ duration: 400, x: 150, y: 2156 }).up()
  .perform();
```

---

## 8. Memperbarui dokumen ini

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

## 9. Catatan lain

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
kalau tidak kuota habis dan alur berhenti di layar upgrade.

**Iklan sisipan.** `MainActivity` dan `CreationActivity` memuat banner
dengan tombol tutup `ivCloseAds`. Kehadirannya tidak konsisten, jadi
perlakukan sebagai opsional — periksa keberadaannya, jangan menunggunya.
