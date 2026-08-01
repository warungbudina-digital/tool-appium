# Playbook: Membuat Template Reel di VN lewat Otomasi (ADB/Appium)

Panduan **reproducible** untuk membuat template video Reels di VN Video Editor
(`com.frontrow.vlog` 2.17.0, akun **VN Pro + login**) dari VPS lewat WireGuard → ADB.
Ditulis dua lapis: **§A–§F = referensi teknis/AI** (perintah + koordinat + jebakan),
**§G = manual singkat untuk pengguna** (tanpa terminal).

> Semua koordinat di dokumen ini untuk **Infinix X662, layar 1080×2408**. Kalau perangkat
> berubah, JANGAN pakai koordinat mentah — petakan ulang dengan `tests/ui-map.js` (§B).
> Selector ber-`resource-id` (mis. `tvBtnMore`) stabil; layar Lynx tanpa id wajib by-koordinat.

Status hasil playbook ini (2026-08-01): template **`Reel-Tips-18-Detik`** (6 slot × 3.00s,
9:16, teks hook editable) sudah dibuat + diunggah ke Google Drive; proyek sumber
"Banyak yang" sudah ditambah **musik `Discover` (Ikson) dengan 31 beat otomatis**.
CTA slot-6 **belum** ditambahkan (lihat §H).

---

## A. Prasyarat & koneksi

```bash
C=tool-appium-appium-1                 # container Appium di VPS
D=10.66.66.2:44887                     # <IP tunnel WG>:<port debug> — port GANTI tiap toggle

# 1) peer WireGuard hidup?
sudo wg show wg0 dump | awk -F'\t' '$4 ~ /10.66.66.2\// {print "hs="strftime("%H:%M:%S",$5)}'
ping -c1 -W2 10.66.66.2

# 2) container jalan?
docker ps --filter name=$C --format "{{.Status}}"

# 3) ADB tersambung?
docker exec $C adb devices
```

**Kalau belum tersambung (Android 11 wajib PAIRING dulu):** minta user buka
*Wireless debugging → Pair device with pairing code*, lalu:

```bash
# port scan kalau port debug tak diketahui
sudo nmap -Pn -p5555,30000-61000 --open -T4 --max-retries 1 10.66.66.2

docker exec $C adb pair 10.66.66.2:<port-pairing> <kode-6-digit>
docker exec $C adb connect 10.66.66.2:<port-debug>
```

> **GOTCHA:** pakai **IP tunnel `10.66.66.2`**, BUKAN IP WiFi yang ditampilkan HP
> (mis. 192.168.1.7). Port pairing ≠ port debug. `adb kill-server` di host dulu kalau
> bentrok port 5037 (container punya adb server sendiri, `network_mode: host`).

Izin baca media (sekali per install / setelah `pm clear`):

```bash
docker exec $C adb -s $D shell pm grant com.frontrow.vlog android.permission.READ_EXTERNAL_STORAGE
```

---

## B. Alat bantu: petakan & lihat layar

**Pemeta UI** (menghasilkan inventaris selector + titik ketuk):

```bash
cd /home/warungbudina/tool-appium
docker compose exec -T -e ANDROID_UDID=$D -e APP_PACKAGE=com.frontrow.vlog \
  -e FORCE_APP_LAUNCH=false -e MAP_NAME=<label> \
  appium npx wdio run ./wdio.conf.js --spec tests/ui-map.js

# baca hasilnya
docker compose exec -T appium node -e '
const m=require("/tmp/uimap-<label>.json");
console.log("activity:", m.activity, "| nodes:", (m.nodes||[]).length);
(m.nodes||[]).filter(n=>n.id||n.label).forEach(n=>
  console.log(" ", (n.clickable?"[C] ":"    ")+(n.id||"-").padEnd(24), "|",
              (n.label||"").replace(/\s+/g," ").slice(0,44).padEnd(44), "|", n.tapX+","+n.tapY));'
```

`FORCE_APP_LAUNCH=false` **wajib** saat memetakan berurutan (menempel ke layar aktif,
tidak me-restart app).

**Screenshot** (verifikasi visual — WAJIB dipakai; DOM saja sering menyesatkan):

```bash
docker exec $C sh -c "adb -s $D exec-out screencap -p" > shot.png
```

**Aktivitas teratas** (lebih andal daripada `dumpsys window` untuk activity berlapis):

```bash
docker exec $C adb -s $D shell dumpsys activity activities \
  | grep -oE "com.frontrow.vlog/[a-zA-Z0-9_.]*Activity" | head -1
```

**Input dasar:**

```bash
docker exec $C adb -s $D shell input tap <x> <y>
docker exec $C adb -s $D shell input swipe <x1> <y1> <x2> <y2> <ms>   # <x,y> sama + 800ms = long-press
docker exec $C adb -s $D shell input text "kata%skata"                 # %s = SPASI
docker exec $C adb -s $D shell input keyevent 66                       # ENTER (baris baru)
docker exec $C adb -s $D shell input keyevent 123                      # MOVE_END
docker exec $C adb -s $D shell input keyevent 67                       # DEL (ulang N kali utk clear)
docker exec $C adb -s $D shell input keyevent KEYCODE_WAKEUP
```

---

## C. Alur membuat template (rantai lengkap, terverifikasi)

Luncurkan bersih:

```bash
docker exec $C adb -s $D shell am force-stop com.frontrow.vlog
docker exec $C adb -s $D shell monkey -p com.frontrow.vlog -c android.intent.category.LAUNCHER 1
```

| # | Layar | Aksi | Koordinat / selector |
|---|---|---|---|
| 1 | `FirstTimeActivity` | Buat proyek baru | `createKit_create_newProject` **@540,420** |
| 2 | Dialog **Mode Edit Proyek** | pilih Berbasis Video → **Simpan** | **@538,2024** |
| 3 | `VideoEditorMatisseActivity` | tab **Foto** | **@815,485** |
| 4 | idem | centang 6 slot | x = **298 / 656 / 1016**, y = **620** (baris 1), **1046** (baris 2) |
| 5 | coach-mark **"Pangkas Klip"** | tutup | **"Mengerti" @648,1834** |
| 6 | idem | **Lanjut** | **@941,1834** |
| 7 | `EditorActivity` | buka rasio | `llFrameType` **@540,198** |
| 8 | panel Pengaturan Video | pilih **9:16** → ✓ | **@298,2106** lalu **@986,1864** |
| 9 | editor | tambah teks | **ketuk BARIS trek subtitle @798,1554** |
| 10 | popup **Memasukkan** | **Teks** | **@290,1944** |
| 11 | panel gaya teks | **"Tambahkan judul"** | **@538,656** |
| 12 | coach-mark **Snap** | tutup | **"Mengerti" @538,2128** |
| 13 | context-menu teks | **Edit** | **@144,1392** |
| 14 | field teks | bersihkan + ketik (lihat §F-1) | `keyevent 123`, `67`×40, `input text` |
| 15 | idem | konfirmasi ✓ | **@974,1402** |
| 16 | editor | menu proyek | `tvBtnMore` **@729,198** |
| 17 | sheet **Project** | **"Membuat"** (= buat template) | **@281,2038** |
| 18 | `TemplateCreateActivity` | klip & teks auto-tercentang sbg *replaceable* → **Lanjut** | **@920,170** |
| 19 | `PublishTemplateActivity` | isi **Judul** / **Deskripsi** | **@538,406** / **@538,586** |
| 20 | idem | **"Buat"** = simpan LOKAL | **@216,2114** |

> **`Buat` vs `Buat dan Publikasikan`:** `Buat` menyimpan template ke perangkat saja.
> `Buat dan Publikasikan` mengunggah ke **komunitas VN** (publik) — jangan dipakai
> kecuali user memintanya eksplisit.

Verifikasi: `home_projects` → tab **Templat** → kartu dengan badge durasi + `✂<jumlah slot>`.

---

## D. Musik + **beat-sync otomatis**

| # | Layar | Aksi | Koordinat |
|---|---|---|---|
| 1 | `EditorActivity` | ketuk **baris trek musik** | **@798,1445** |
| 2 | popup **Memasukkan** | **Musik** | **@188,1954** |
| 3 | `MusicManageActivity` | tab Musik/Favorit/Milikmu + kategori (Vlog·Pop·**Dynamic**·Fresh·Acoustic·Electronic·Hip-Hop) | Dynamic **@859,806** |
| 4 | daftar track | ketuk track (preview jalan) | mis. *Discover* **@307,911** |
| 5 | idem | **Menggunakan** | **@932,938** |
| 6 | **`UseMusicDetailActivity`** | musik **auto-trim ke durasi proyek**; Volume; **Memudar** (fade in) & **Memudar** (fade out) | — |
| 7 | idem | **"Ketukan"** (beat) | **@538,1998** |
| 8 | panel **Ketukan Musik** | kecepatan 0.5x/1x · **toggle "Beat Otomatis"** | **@920,1357** |
| 9 | dialog **"Tambah Beat Secara Otomatis"** | **"Tambah Beat"** | **@538,1337** |
| 10 | hasil | `Beat Otomatis — Beat: N` (mis. **31**) + slider kerapatan + penanda merah bernomor | — |
| 11 | idem | konfirmasi ✓ | **@888,2166** |
| 12 | kembali ke UseMusicDetail | indikator **🚩 N** muncul → ✓ pakai musik | **@764,2161** |

Hasil di editor: klip musik ungu + **garis vertikal penanda beat** di trek.
Toolbar musik (saat klip musik terpilih): *Menggantikan · **Ketukan** · Bingkai utama ·
Pilihan · Kunci · Duplikat · Hapus*; toolbar bawah: *Volume · **Memudar** · Pisah ·
Tolak kebisingan · Efek Suara · Teks Otomatis*.

> **Catatan privasi:** dialog langkah 9 menyatakan audio *"diproses sesuai Kebijakan
> Privasi"* VN. Aman untuk **lagu stok VN**; pikir ulang bila sumbernya rekaman pribadi.
>
> **Beat manual** (tanpa auto): tombol bendera merah **@538,1974** — ketuk mengikuti irama,
> bisa diperlambat ke **0.5x** dulu. Pola sama dengan Edit Beats di BeatsClips
> (lihat `vn-automation-map.md` §20).

---

## E. Simpan / bagikan file template ke Google Drive

| # | Layar | Aksi | Koordinat |
|---|---|---|---|
| 1 | tab **Templat** | **long-press** kartu template | `input swipe x y x y 800` |
| 2 | `TemplatePreviewActivity` | ikon **share** di top bar | **@866,186** |
| 3 | sheet | **"Bagikan File VNFlow"** | **@398,2126** |
| 4 | sheet berbagi | toggle PRO *Read Only* / *Lindungi Proyek* (biarkan **OFF** agar file tetap bisa diedit) → **Bagikan** | **@538,2138** |
| 5 | `android/…ChooserActivity` | **Drive** | **@152,1663** |
| 6 | `…docs/…UploadMenuActivity` | cek **Nama file / Lokasi / Akun** → **Upload** | **@896,202** |

Verifikasi tanpa membuka Drive:

```bash
docker exec $C adb -s $D shell dumpsys notification --noredact \
  | grep -iE "docs|diupload|Drive Saya"
# harapkan: android.title=(1 item diupload)  android.text=(Disimpan ke "Drive Saya")
```

> **JEBAKAN:** ikon **Google Drive / Dropbox** yang tampil di `PublishTemplateActivity`
> baris *"2. Unggah ke cloud"* **BUKAN tombol** — itu ilustrasi teks bantuan; menekannya
> membuka Help Center (`InternalBrowserActivity`). Jalur unggah yang benar = tabel di atas.

---

## F. Jebakan penting (paling menghemat waktu)

1. **`adb input text` BALAPAN dengan IME → huruf teracak.**
   Gejala: "Reel Tips Digital" jadi `Reel Tips Digial 18 detikt`, huruf loncat ke akhir.
   Mitigasi: ketik **per kata** dengan jeda (`sleep 0.8`), pakai token tanpa spasi bila
   memungkinkan, **verifikasi via screenshot**, dan untuk teks final serahkan ke user
   (mengetik manual di HP lebih cepat & akurat).
2. **Coach-mark menelan input.** Yang ditemui: *"Pangkas Klip"*, *"Tips Pengaturan Snap /
   Snap ke Objek Terdekat"*. Selalu tutup dulu (**"Mengerti"**) sebelum lanjut; kalau
   sebuah tap "tidak berefek", curigai coach-mark/keyboard menutupi.
3. **Semantik BACK di editor:** BACK ke-1 = *deselect* elemen; **BACK ke-2 = KELUAR editor**
   (autosave). Jangan merantai dua BACK. Untuk menutup panel pakai `ivCancel`/`✓`/`ivClose`.
4. **Tambah teks:** ketuk **BARIS** trek subtitle (**@798,1554**), bukan ikon `T+` —
   ikonnya terblokir saat ada klip terpilih dan tap-nya gagal senyap.
5. **Foto vs video sebagai slot:** foto masuk dengan durasi **3.00s** yang seragam
   (timing template jadi terprediksi); video masuk **full-length** (mis. 79.92s) sehingga
   butuh trim satu per satu. Untuk membuat *template*, foto jauh lebih efisien.
6. **`input text` tidak menerima spasi mentah** → pakai `%s`. Hindari `%` dan emoji
   (tidak terkirim). Baris baru = `keyevent 66`.
7. **JANGAN `pm clear com.frontrow.vlog`** untuk bersih-bersih lagi — itu **me-logout akun
   VN Pro**. Cara bersih sekarang: keluar editor → dialog → **"Keluar secara langsung"**
   (draft tak tersimpan), atau hapus proyek lewat UI.
8. Cek `dumpsys activity activities` (bukan hanya `dumpsys window`) saat activity
   bertumpuk — `window` kerap masih melaporkan `MainActivity`.

---

## G. Manual singkat untuk pengguna (tanpa terminal)

**Memakai template yang sudah ada**
1. Buka VN → **Proyek Anda** → tab **Templat**.
2. Ketuk **`Reel-Tips-18-Detik`** → **Terapkan**.
3. Pilih **6 klip** milikmu (urut sesuai peran slot) → template mengisi otomatis.
4. Ketuk teks di layar untuk mengganti kalimatnya.
5. Ekspor: ikon ⬆ kanan atas → **Manual** bila ingin atur resolusi/fps → **Selesai**.

**Struktur template (18 detik, 9:16)**

| Slot | Detik | Peran | Isi |
|---|---|---|---|
| 1 | 0–3 | **Hook** | masalah/pertanyaan tajam (teks sudah terpasang, tinggal diedit) |
| 2 | 3–6 | Janji | apa yang penonton dapat |
| 3–5 | 6–15 | Langkah 1·2·3 | inti tips |
| 6 | 15–18 | **CTA** | pertanyaan pemancing komentar |

**Kenapa 18 detik:** watch time rata-rata akun ≈ 18 detik, jadi video yang **selesai**
di detik ke-18 memaksimalkan *completion rate* — sinyal kuat di Reels.

**Menambah musik + beat-sync sendiri**
Editor → ketuk baris **musik** → **Musik** → pilih kategori (mis. *Dynamic*) → ketuk lagu →
**Menggunakan** → **Ketukan** → nyalakan **Beat Otomatis** → **Tambah Beat** → ✓ → ✓.
Potong/ganti klip tepat di garis penanda beat agar terasa nyatu dengan musik.

**Menyimpan template ke Google Drive**
Tab **Templat** → tekan-lama kartu → ikon **bagikan** → **Bagikan File VNFlow** → **Bagikan**
→ pilih **Drive** → cek akun & lokasi → **Upload**. (Aktifkan *Read Only*/*Lindungi Proyek*
hanya bila file akan dikirim ke orang lain dan tak boleh diubah.)

---

## H. Status & langkah lanjutan

- ✅ Template **`Reel-Tips-18-Detik`** dibuat (6 slot × 3.00s, 9:16, hook editable) dan
  file `.vnt` **terunggah ke Google Drive** (Drive Saya, akun `warungbudina@gmail.com`).
- ✅ Proyek sumber **"Banyak yang"** kini bermusik **`Discover` (Ikson)** dengan
  **31 beat otomatis**; musik auto-trim 18.00s.
- ⬜ **Teks CTA slot 6 belum ditambahkan** (sesi terhenti; ikuti §C langkah 9–15 dengan
  playhead digeser ke ±15 detik lebih dulu).
- ⬜ Setelah CTA masuk, buat **template v2** (ulangi §C langkah 16–20, beri judul mis.
  `Reel-Tips-18-Detik-v2`) lalu unggah ulang ke Drive (§E). Template v1 tetap ada
  sebagai cadangan.
- Opsional: **fade out** musik ±0.5s (editor → pilih klip musik → **Memudar**) agar
  ujung video tidak terpotong mendadak saat Reels me-loop.
